"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DaisyLogo from "@/components/layout/DaisyLogo";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setFormError("");
    setDoneMessage("");

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError("Please enter a valid email address");
      return;
    }

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

      setDoneMessage(
        typeof data.message === "string"
          ? data.message
          : "If an account exists for that email, you’ll get a link to reset your password shortly.",
      );
      setEmail("");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
            <h1 className="font-display text-2xl text-charcoal">Forgot password</h1>
            <p className="mt-2.5 text-sm text-text-secondary">
              We&rsquo;ll email you a link to choose a new one.
            </p>
          </div>

          {doneMessage ? (
            <div className="space-y-6">
              <p className="text-sm text-text-secondary leading-relaxed" role="status">
                {doneMessage}
              </p>
              <Button variant="secondary" size="lg" className="w-full" href="/login">
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@mail.mcgill.ca"
                value={email}
                error={emailError}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (formError) setFormError("");
                }}
                disabled={isSubmitting}
              />

              {formError ? (
                <p className="text-[13px] text-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending\u2026" : "Send reset link"}
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
