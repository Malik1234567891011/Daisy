"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DaisyLogo from "@/components/layout/DaisyLogo";
import { Skeleton } from "@/components/ui/Skeleton";

function getPasswordError(value: string): string {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return "";
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const pErr = getPasswordError(password);
    setPasswordError(pErr);
    if (pErr) return;

    if (!token) {
      setFormError("This reset link is invalid. Request a new one from the sign-in page.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
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

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-sm text-text-secondary leading-relaxed">
          This reset link is missing or invalid. Open the link from your email, or request a new reset
          from sign in.
        </p>
        <Button variant="primary" size="lg" className="w-full" href="/forgot-password">
          Request reset link
        </Button>
        <Button variant="secondary" size="lg" className="w-full" href="/login">
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="New password"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        error={passwordError}
        onChange={(e) => {
          setPassword(e.target.value);
          if (passwordError) setPasswordError("");
          if (formError) setFormError("");
        }}
        disabled={isSubmitting}
      />

      {formError ? (
        <p className="text-[13px] text-error" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving\u2026" : "Save new password"}
      </Button>
    </form>
  );
}

function ResetFormFallback() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-[50px] w-full rounded-full" />
    </div>
  );
}

export default function ResetPasswordPage() {
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
            <h1 className="font-display text-2xl text-charcoal">Set a new password</h1>
            <p className="mt-2.5 text-sm text-text-secondary">Choose a password you haven&rsquo;t used here before.</p>
          </div>

          <Suspense fallback={<ResetFormFallback />}>
            <ResetPasswordForm />
          </Suspense>

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
