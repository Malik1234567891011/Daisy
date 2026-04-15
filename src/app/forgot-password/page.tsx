"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DaisyLogo from "@/components/layout/DaisyLogo";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type Step = "email" | "code" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError("");
    setFormError("");

    const trimmed = email.trim();
    if (!trimmed) { setFieldError("Email is required"); return; }
    if (!isValidEmail(trimmed)) { setFieldError("Please enter a valid email address"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed.toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(typeof data.error === "string" ? data.error : "Something went wrong");
        return;
      }

      if (data.phoneLast4) {
        setPhoneLast4(data.phoneLast4);
        setStep("code");
      } else {
        setFormError("No verified phone number found for this account.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCodeSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError("");
    setFormError("");

    if (!code || !/^\d{6}$/.test(code.trim())) {
      setFieldError("Enter a valid 6-digit code");
      return;
    }

    setStep("password");
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError("");
    setFormError("");

    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (typeof data.error === "string" && data.error.toLowerCase().includes("code")) {
          setStep("code");
          setCode("");
        }
        setFormError(typeof data.error === "string" ? data.error : "Something went wrong");
        return;
      }

      router.push("/login?reset=success");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const subtitle =
    step === "email"
      ? "Enter your email and we\u2019ll text a code to your verified phone."
      : step === "code"
        ? `We sent a 6-digit code to your phone ending in ${phoneLast4}.`
        : "Choose a new password.";

  return (
    <div
      className={cn(
        "min-h-screen bg-ivory bg-grain px-4 py-12",
        "flex flex-col items-center justify-center",
      )}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-10">
        <DaisyLogo size="md" className="shrink-0" />

        <div className="w-full rounded-2xl bg-white p-8 sm:p-10 shadow-card border border-border-light/60">
          <div className="mb-9 text-center">
            <h1 className="font-display text-2xl text-charcoal">
              {step === "password" ? "Set a new password" : "Forgot password"}
            </h1>
            <p className="mt-2.5 text-sm text-text-secondary">{subtitle}</p>
          </div>

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5" noValidate>
              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@mail.mcgill.ca"
                value={email}
                error={fieldError}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError("");
                  if (formError) setFormError("");
                }}
                disabled={isSubmitting}
              />
              {formError && (
                <p className="text-[13px] text-error" role="alert">{formError}</p>
              )}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending\u2026" : "Send code"}
              </Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleCodeSubmit} className="space-y-5" noValidate>
              <Input
                label="6-digit code"
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                error={fieldError}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(v);
                  if (fieldError) setFieldError("");
                  if (formError) setFormError("");
                }}
                disabled={isSubmitting}
              />
              {formError && (
                <p className="text-[13px] text-error" role="alert">{formError}</p>
              )}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                Verify code
              </Button>
              <button
                type="button"
                className="w-full text-sm text-text-tertiary hover:text-sage transition-colors"
                onClick={() => { setStep("email"); setCode(""); setFormError(""); setFieldError(""); }}
              >
                Didn&rsquo;t get it? Go back
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
              <Input
                label="New password"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                error={fieldError}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldError) setFieldError("");
                  if (formError) setFormError("");
                }}
                disabled={isSubmitting}
              />
              {formError && (
                <p className="text-[13px] text-error" role="alert">{formError}</p>
              )}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving\u2026" : "Save new password"}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-text-tertiary">
            <Link href="/login" className="text-sage transition-colors duration-200 hover:text-olive">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
