"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { normalizePhone } from "@/lib/phone";
import { ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";

interface StepOTPProps {
  phone: string;
  smsConsent: boolean;
  onVerified: () => void;
  onBack: () => void;
}

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function StepOTP({ phone, smsConsent, onVerified, onBack }: StepOTPProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);


  const submitCode = useCallback(
    async (code: string) => {
      setVerifying(true);
      setError("");

      try {
        const res = await fetch("/api/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalizePhone(phone) ?? phone, code, smsConsent }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed");

        onVerified();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setDigits(Array(CODE_LENGTH).fill(""));
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
      } finally {
        setVerifying(false);
      }
    },
    [phone, smsConsent, onVerified],
  );

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (verifying) return;

      // Handle paste of full code
      if (value.length > 1) {
        const pasted = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
        if (pasted.length === CODE_LENGTH) {
          const newDigits = pasted.split("");
          setDigits(newDigits);
          inputsRef.current[CODE_LENGTH - 1]?.focus();
          submitCode(pasted);
          return;
        }
      }

      const digit = value.replace(/\D/g, "").slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);
      if (error) setError("");

      if (digit && index < CODE_LENGTH - 1) {
        inputsRef.current[index + 1]?.focus();
      }

      // Auto-submit when all digits filled
      if (digit && index === CODE_LENGTH - 1) {
        const full = newDigits.join("");
        if (full.length === CODE_LENGTH) {
          submitCode(full);
        }
      }
    },
    [digits, verifying, error, submitCode],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
      if (pasted.length === CODE_LENGTH) {
        const newDigits = pasted.split("");
        setDigits(newDigits);
        inputsRef.current[CODE_LENGTH - 1]?.focus();
        submitCode(pasted);
      }
    },
    [submitCode],
  );

  const handleResend = useCallback(async () => {
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone) ?? phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");

      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setResending(false);
    }
  }, [phone]);

  const maskedPhone = phone.replace(/\D/g, "");
  const displayPhone =
    maskedPhone.length > 4
      ? `+${"•".repeat(maskedPhone.length - 4)}${maskedPhone.slice(-4)}`
      : phone;

  return (
    <div className="pt-4 md:pt-8">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-sage-pale/60 border border-sage-light/30 mb-6 mx-auto sm:mx-0">
        <ShieldCheck className="w-6 h-6 text-sage" strokeWidth={1.6} />
      </div>

      <h2 className="font-display text-3xl text-charcoal mb-2 text-center sm:text-left">
        Enter your code
      </h2>
      <p className="text-text-secondary mb-8 text-center sm:text-left">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-charcoal">{displayPhone}</span>
      </p>

      {/* OTP inputs */}
      {/* A grid, not a centred row of fixed widths: six w-12 boxes plus gaps
          measure ~338px and the panel's interior is ~250px on a phone, so the
          row used to hang off both edges of the card. Columns divide whatever
          width there is instead. */}
      <div
        className="grid grid-cols-6 gap-2 sm:gap-3 mb-3"
        onPaste={handlePaste}
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={CODE_LENGTH}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={verifying}
            aria-label={`Digit ${i + 1}`}
            className="w-full min-w-0 h-[52px] sm:h-16 text-center text-xl sm:text-2xl font-display rounded-[12px] border border-border bg-white text-charcoal transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-light/60 focus:border-sage disabled:opacity-50"
          />
        ))}
      </div>

      {/* Resend */}
      <div className="text-center mb-8">
        {cooldown > 0 ? (
          <p className="text-sm text-text-tertiary">
            Resend code in {cooldown}s
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-medium text-sage hover:text-olive transition-colors disabled:opacity-50"
          >
            {resending ? "Resending\u2026" : "Resend code"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={verifying}>
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={digits.join("").length < CODE_LENGTH || verifying}
          onClick={() => submitCode(digits.join(""))}
          className="flex-1"
        >
          {verifying ? "Verifying\u2026" : "Verify"}
        </Button>
      </div>
    </div>
  );
}
