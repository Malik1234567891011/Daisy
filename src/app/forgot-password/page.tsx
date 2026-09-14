"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthAltButton,
  AuthDivider,
  AuthField,
  AuthPanel,
  AuthSubmit,
} from "@/components/auth/AuthPanel";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Three screens in the same card as sign-in: the email, the six-digit code
 * texted to the verified phone, then the new password. The chevron walks back
 * one screen at a time; from the first it returns to sign-in.
 */
type Step = "email" | "code" | "password";

const TITLES: Record<Step, string> = {
  email: "Forgot password",
  code: "Check your phone",
  password: "New password",
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Each screen has one field; landing on it unfocused reads as a dead end.
  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
    if (step === "password") passwordRef.current?.focus();
  }, [step]);

  function clearErrors() {
    setFieldError("");
    setFormError("");
  }

  function goTo(next: Step) {
    clearErrors();
    setStep(next);
  }

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearErrors();

    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError("Enter your school email");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setFieldError("That doesn’t look like an email address");
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
      setStep("code");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCodeSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearErrors();
    if (!/^\d{6}$/.test(code.trim())) {
      setFieldError("Enter the 6-digit code");
      return;
    }
    setStep("password");
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearErrors();

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
        const message = typeof data.error === "string" ? data.error : "Something went wrong";
        // A bad or expired code is fixed on the code screen, not this one.
        if (message.toLowerCase().includes("code")) {
          setCode("");
          setStep("code");
        }
        setFormError(message);
        return;
      }
      router.push("/login?reset=success");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const back =
    step === "email"
      ? { backHref: "/login", backLabel: "Back to sign in" }
      : step === "code"
        ? { onBack: () => goTo("email"), backLabel: "Back to email" }
        : { onBack: () => goTo("code"), backLabel: "Back to code" };

  return (
    <AuthShell
      title={TITLES[step]}
      {...back}
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="text-ivory underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </>
      }
    >
      <AuthPanel>
        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} noValidate>
            <AuthField
              label="School email"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="you@mail.mcgill.ca"
              value={email}
              error={fieldError}
              disabled={isSubmitting}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError || formError) clearErrors();
              }}
            />
            {!fieldError ? (
              <p className="mt-2 text-[13px] text-white/45">
                We’ll text a code to the phone you verified.
              </p>
            ) : null}
            {formError ? (
              <p className="mt-3 text-[13px] text-error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="mt-7">
              <AuthSubmit type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send code"}
              </AuthSubmit>
            </div>
          </form>
        ) : null}

        {step === "code" ? (
          <form onSubmit={handleCodeSubmit} noValidate>
            <AuthField
              ref={codeRef}
              label="6-digit code"
              type="text"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              error={fieldError}
              disabled={isSubmitting}
              className="tracking-[0.3em]"
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (fieldError || formError) clearErrors();
              }}
            />
            {!fieldError ? (
              <div className="mt-2 text-[13px] text-white/45">
                <p className="truncate text-white/60">{email.trim()}</p>
                <p>If that account has a verified phone, the code is on its way.</p>
              </div>
            ) : null}
            {formError ? (
              <p className="mt-3 text-[13px] text-error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="mt-7">
              <AuthSubmit type="submit" disabled={isSubmitting}>
                Continue
              </AuthSubmit>
            </div>
            <AuthDivider />
            <AuthAltButton
              type="button"
              onClick={() => {
                setCode("");
                goTo("email");
              }}
            >
              Didn’t get it? Try another email
            </AuthAltButton>
          </form>
        ) : null}

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit} noValidate>
            <AuthField
              ref={passwordRef}
              label="New password"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="at least 8 characters"
              value={password}
              error={fieldError}
              disabled={isSubmitting}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldError || formError) clearErrors();
              }}
            />
            {formError ? (
              <p className="mt-3 text-[13px] text-error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="mt-7">
              <AuthSubmit type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save new password"}
              </AuthSubmit>
            </div>
          </form>
        ) : null}
      </AuthPanel>
    </AuthShell>
  );
}
