"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface StepAccountProps {
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BLOCKED_DOMAINS = [
  "gmail.com", "googlemail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.ca", "ymail.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com",
  "protonmail.com", "proton.me", "pm.me",
  "mail.com", "zoho.com", "gmx.com", "gmx.net",
  "tutanota.com", "tuta.io",
  "fastmail.com", "yandex.com",
];

function getEmailError(value: string): string {
  if (!value.trim()) return "Email is required";
  if (!EMAIL_RE.test(value)) return "Please enter a valid email address";
  const [local, domain] = value.trim().toLowerCase().split("@");
  if (local.length < 4) return "That doesn\u2019t look like a school email";
  if (BLOCKED_DOMAINS.includes(domain)) return "Please use your school email (e.g. you@mail.mcgill.ca)";
  return "";
}

function getPasswordError(value: string): string {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return "";
}

export default function StepAccount({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onNext,
  onBack,
}: StepAccountProps) {
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onEmailChange(val);
    if (emailTouched) setEmailError(getEmailError(val));
  }

  function handleEmailBlur() {
    setEmailTouched(true);
    setEmailError(getEmailError(email));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onPasswordChange(val);
    if (passwordTouched) setPasswordError(getPasswordError(val));
  }

  function handlePasswordBlur() {
    setPasswordTouched(true);
    setPasswordError(getPasswordError(password));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    const eErr = getEmailError(email);
    const pErr = getPasswordError(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (!eErr && !pErr) onNext();
  }

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="font-display text-3xl text-charcoal mb-2">
        Create your account
      </h2>
      <p className="text-text-secondary mb-8">
        Use your school email for verification. We&rsquo;ll never share it.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="School email"
          type="email"
          placeholder="you@mail.mcgill.ca"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          error={emailTouched ? emailError || undefined : undefined}
          helperText="We use this to verify you're a student"
          autoFocus
          autoComplete="email"
        />

        <div className="mt-5">
          <Input
            label="Create a password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={passwordTouched ? passwordError || undefined : undefined}
            autoComplete="new-password"
          />
        </div>

        <div className="flex items-center gap-3 mt-8">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
