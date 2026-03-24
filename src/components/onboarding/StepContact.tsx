"use client";

import { useState } from "react";
import { AtSign, Phone, Mail, Shield } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ContactMethod, ContactPreference } from "@/lib/types";

interface StepContactProps {
  contact: ContactPreference;
  email: string;
  onContactChange: (updates: Partial<ContactPreference>) => void;
  onNext: () => void;
  onBack: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_OPTIONS: {
  method: ContactMethod;
    icon: typeof AtSign;
  label: string;
  description: string;
  placeholder: string;
  inputType: string;
}[] = [
  {
    method: "instagram",
    icon: AtSign,
    label: "Instagram",
    description: "Share your handle",
    placeholder: "@yourhandle",
    inputType: "text",
  },
  {
    method: "phone",
    icon: Phone,
    label: "Phone",
    description: "Share your number",
    placeholder: "(555) 123-4567",
    inputType: "tel",
  },
  {
    method: "email",
    icon: Mail,
    label: "Email",
    description: "Use your email",
    placeholder: "you@mail.mcgill.ca",
    inputType: "email",
  },
];

export default function StepContact({
  contact,
  email,
  onContactChange,
  onNext,
  onBack,
}: StepContactProps) {
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  function selectMethod(method: ContactMethod) {
    onContactChange({ method, value: method === "email" ? email : "" });
    setError("");
    setTouched(false);
  }

  function getError(value: string): string {
    if (!value.trim()) return "Please enter your contact info";
    if (
      contact.method === "email" &&
      !EMAIL_RE.test(value)
    ) {
      return "Please enter a valid email";
    }
    return "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const err = getError(contact.value);
    setError(err);
    if (!err) onNext();
  }

  const activeOption = CONTACT_OPTIONS.find(
    (o) => o.method === contact.method
  )!;

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="font-display text-3xl text-charcoal mb-2">
        How should your match reach you?
      </h2>
      <p className="text-text-secondary mb-8">
        Pick one way to connect. This stays private until you&rsquo;re matched.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-3 mb-6" role="radiogroup" aria-label="Contact method">
          {CONTACT_OPTIONS.map(({ method, icon: Icon, label, description }) => {
            const isSelected = contact.method === method;
            return (
              <button
                key={method}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => selectMethod(method)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2",
                  isSelected
                    ? "border-sage bg-sage-pale/50 shadow-sm"
                    : "border-border-light bg-white hover:border-border hover:shadow-xs"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-xl transition-colors",
                    isSelected
                      ? "bg-sage text-white"
                      : "bg-cream text-text-secondary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-charcoal">
                    {label}
                  </span>
                  <span className="block text-sm text-text-tertiary">
                    {description}
                  </span>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 flex items-center justify-center",
                    isSelected ? "border-sage" : "border-border"
                  )}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-sage" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Input
          label={activeOption.label}
          type={activeOption.inputType}
          placeholder={activeOption.placeholder}
          value={contact.value}
          onChange={(e) => {
            onContactChange({ value: e.target.value });
            if (touched) setError(getError(e.target.value));
          }}
          onBlur={() => {
            setTouched(true);
            setError(getError(contact.value));
          }}
          error={touched ? error || undefined : undefined}
        />

        <div className="flex items-center gap-2 mt-5 text-text-tertiary">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">
            Your contact info is only shared after a successful match.
          </p>
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
