"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DaisyLogo from "@/components/layout/DaisyLogo";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setFormError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required");
      valid = false;
    } else if (!isValidEmail(trimmed)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError("");
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setFormError("Invalid email or password");
      setIsSubmitting(false);
      return;
    }

    if (result?.ok) {
      router.push("/dashboard");
      return;
    }

    setIsSubmitting(false);
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-ivory px-4 py-12",
        "flex flex-col items-center justify-center font-body"
      )}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <DaisyLogo size="md" className="shrink-0" />

        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl text-charcoal">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Sign in to check on your matches
            </p>
          </div>

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

            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                error={passwordError}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                  if (formError) setFormError("");
                }}
                disabled={isSubmitting}
              />
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-sage transition-colors hover:text-olive"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {formError ? (
              <p className="text-sm text-error" role="alert">
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
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-text-tertiary">or</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            href="/onboarding"
          >
            Create an account
          </Button>
        </div>

        <p className="text-center text-sm text-text-tertiary">
          <Link
            href="/"
            className="text-sage transition-colors hover:text-olive"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
