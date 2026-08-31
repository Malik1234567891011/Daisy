"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthAltLink,
  AuthDivider,
  AuthField,
  AuthPanel,
  AuthSubmit,
} from "@/components/auth/AuthPanel";

/**
 * Either credential works: the school email, or the phone number verified
 * during onboarding. The server resolves which one it got — this only has to
 * reject input that could never be either.
 */
function isValidIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const digits = trimmed.replace(/[\s\-().]/g, "");
  return /^\+?[1-9]\d{6,14}$/.test(digits);
}

function PasswordResetSuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("reset") !== "success") return null;
  return (
    <p
      className="mb-5 rounded-xl border border-sage-light/25 bg-sage/15 px-4 py-3 text-center text-[14px] text-ivory"
      role="status"
    >
      Your password was updated. Sign in with your new password.
    </p>
  );
}

/**
 * One field at a time: who you are, then your password. The second step is
 * what gives the card's back chevron something to do.
 */
type Step = "identifier" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Moving to the password step without focusing it would leave the one field
  // on screen unfocused, which reads as a dead end.
  useEffect(() => {
    if (step === "password") passwordRef.current?.focus();
  }, [step]);

  function goToIdentifierStep() {
    setStep("identifier");
    setPasswordError("");
    setFormError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (step === "identifier") {
      const trimmed = identifier.trim();
      if (!trimmed) {
        setIdentifierError("Enter your school email or phone number");
        return;
      }
      if (!isValidIdentifier(trimmed)) {
        setIdentifierError("That doesn’t look like an email or phone number");
        return;
      }
      setIdentifierError("");
      setStep("password");
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    const result = await signIn("credentials", {
      identifier: identifier.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setFormError("Those details don’t match an account");
      setIsSubmitting(false);
      return;
    }

    if (result?.ok) {
      router.push("/dashboard");
      return;
    }

    setIsSubmitting(false);
  }

  const onFirstStep = step === "identifier";

  return (
    <AuthShell
      title="Login"
      backLabel={onFirstStep ? "Back to home" : "Back to email or phone"}
      {...(onFirstStep ? { backHref: "/" } : { onBack: goToIdentifierStep })}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/onboarding"
            className="text-ivory underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            Sign up
          </Link>
        </>
      }
    >
      <AuthPanel>
        <Suspense fallback={null}>
          <PasswordResetSuccessBanner />
        </Suspense>

        <form onSubmit={handleSubmit} noValidate>
          {onFirstStep ? (
            <AuthField
              label="School email or phone number"
              type="text"
              inputMode="email"
              name="identifier"
              autoComplete="username"
              autoFocus
              placeholder="school email or phone number"
              value={identifier}
              error={identifierError}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (identifierError) setIdentifierError("");
                if (formError) setFormError("");
              }}
            />
          ) : (
            <AuthField
              ref={passwordRef}
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="your password"
              value={password}
              error={passwordError}
              disabled={isSubmitting}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
                if (formError) setFormError("");
              }}
            />
          )}

          {!onFirstStep && !passwordError ? (
            <p className="mt-2 truncate text-[13px] text-white/45">
              Signing in as {identifier.trim()}
            </p>
          ) : null}

          {formError ? (
            <p className="mt-3 text-[13px] text-error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="mt-7">
            <AuthSubmit type="submit" disabled={isSubmitting}>
              {onFirstStep
                ? "Continue"
                : isSubmitting
                  ? "Signing in…"
                  : "Sign in"}
            </AuthSubmit>
          </div>
        </form>

        {onFirstStep ? null : (
          <>
            <AuthDivider />
            <AuthAltLink href="/forgot-password">Forgot password?</AuthAltLink>
          </>
        )}
      </AuthPanel>
    </AuthShell>
  );
}
