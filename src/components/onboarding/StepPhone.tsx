"use client";

import { useState, useCallback } from "react";
import { Phone } from "lucide-react";
import Button from "@/components/ui/Button";

interface StepPhoneProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onCodeSent: () => void;
  onBack: () => void;
}

function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 1) return digits.length === 1 ? `+${digits}` : "";
  if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
  if (digits.length <= 7)
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return `+${digits}`;
}

export default function StepPhone({
  phone,
  onPhoneChange,
  onCodeSent,
  onBack,
}: StepPhoneProps) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^\d+() \-]/g, "");
      onPhoneChange(val);
      if (error) setError("");
    },
    [onPhoneChange, error],
  );

  const handleSend = useCallback(async () => {
    const e164 = toE164(phone);
    if (e164.length < 8) {
      setError("Enter a valid phone number with country code");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: e164 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      onCodeSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }, [phone, onCodeSent]);

  const digits = phone.replace(/\D/g, "");
  const isValid = digits.length >= 8;

  return (
    <div className="pt-4 md:pt-8">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-sage-pale/60 border border-sage-light/30 mb-6 mx-auto sm:mx-0">
        <Phone className="w-6 h-6 text-sage" strokeWidth={1.6} />
      </div>

      <h2 className="font-display text-3xl text-charcoal mb-2 text-center sm:text-left">
        Where should we send your match?
      </h2>
      <p className="text-text-secondary mb-8 text-center sm:text-left">
        Enter your number to receive your match. We&rsquo;ll send a quick
        verification code.
      </p>

      <div className="space-y-2 mb-2">
        <label
          htmlFor="phone-input"
          className="block text-sm font-medium text-text-primary"
        >
          Phone number
        </label>
        <input
          id="phone-input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 (514) 555-1234"
          value={phone ? formatDisplay(phone) : ""}
          onChange={handleChange}
          className="w-full rounded-xl border border-border bg-white px-4 py-3.5 text-base text-text-primary placeholder:text-text-tertiary/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sage-light/60 focus:border-sage hover:border-border/80"
        />
      </div>

      <p className="text-xs text-text-tertiary mb-8">
        Standard message rates may apply. We&rsquo;ll only text you for
        verification.
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={sending}>
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleSend}
          disabled={!isValid || sending}
          className="flex-1"
        >
          {sending ? "Sending\u2026" : "Send code"}
        </Button>
      </div>
    </div>
  );
}
