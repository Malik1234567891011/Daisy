"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  Panel, PanelTitle, Muted, Pill, Field, ChoicePills, FormStatus,
} from "@/components/dashboard/primitives";
import { Input } from "@/components/ui/Input";
import type { ContactMethod } from "@/lib/types";

const CONTACT_METHODS: { value: ContactMethod; label: string; placeholder: string; hint: string }[] = [
  { value: "instagram", label: "Instagram", placeholder: "@yourhandle", hint: "Your handle, with or without the @." },
  { value: "phone", label: "Phone", placeholder: "(555) 123-4567", hint: "They’ll get this number to text you." },
  { value: "email", label: "Email", placeholder: "you@example.com", hint: "Any address you actually check." },
];
const CONTACT_METHOD_VALUES = CONTACT_METHODS.map((m) => m.value);

function parseContactMethod(value: unknown): ContactMethod {
  return typeof value === "string" && CONTACT_METHOD_VALUES.includes(value as ContactMethod)
    ? (value as ContactMethod)
    : "instagram";
}

/**
 * How a match reaches you. Shared only once both people have said yes, so
 * this is the one thing on the profile that another person ever sees
 * verbatim — which is why it gets a page to itself.
 */
export default function ContactPage() {
  const { status } = useSession();
  const router = useRouter();

  const [contactMethod, setContactMethod] = useState<ContactMethod>("instagram");
  const [contactValue, setContactValue] = useState("");
  const [smsConsent, setSmsConsent] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setLoadError(null);
      setIsFetching(true);
      try {
        const res = await fetch("/api/user");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Failed to load contact info");
        }
        if (cancelled) return;
        setContactMethod(parseContactMethod(data.contactMethod));
        setContactValue(typeof data.contactValue === "string" ? data.contactValue : "");
        setSmsConsent(data.smsConsent !== false);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load contact info");
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [status]);

  const isPageLoading = status === "loading" || (status === "authenticated" && isFetching);
  const active = CONTACT_METHODS.find((m) => m.value === contactMethod) ?? CONTACT_METHODS[0];

  const handleSave = useCallback(async () => {
    if (!contactValue.trim()) {
      setError("Please enter your contact info");
      return;
    }
    setError(undefined);
    setSaveError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactMethod, contactValue: contactValue.trim(), smsConsent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [contactMethod, contactValue, smsConsent]);

  if (status === "unauthenticated") return null;

  return (
    <DashboardShell title="Contact info" backHref="/dashboard">
      <Muted className="-mt-2 text-center">
        Only shared after it&rsquo;s mutual. Nobody sees this before then.
      </Muted>

      {isPageLoading && <FormStatus kind="info">Loading…</FormStatus>}
      {loadError && !isPageLoading && <FormStatus kind="error">{loadError}</FormStatus>}
      {saved && <FormStatus kind="success">Contact info updated.</FormStatus>}
      {saveError && <FormStatus kind="error">{saveError}</FormStatus>}

      <Panel className="flex flex-col gap-6">
        <PanelTitle className="text-[20px]">How your match reaches you</PanelTitle>

        <Field label="Best way to reach you">
          <ChoicePills
            label="Contact method"
            options={CONTACT_METHODS.map(({ value, label }) => ({ value, label }))}
            value={contactMethod}
            onChange={(m) => {
              setContactMethod(m);
              setError(undefined);
            }}
            disabled={isPageLoading}
          />
        </Field>

        <Input
          label={active.label}
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
          placeholder={active.placeholder}
          helperText={active.hint}
          error={error}
          disabled={isPageLoading}
          inputMode={contactMethod === "phone" ? "tel" : contactMethod === "email" ? "email" : "text"}
          autoComplete={contactMethod === "phone" ? "tel" : contactMethod === "email" ? "email" : "off"}
        />
      </Panel>

      <Panel>
        <PanelTitle className="text-[20px]">Texts from Daisy</PanelTitle>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={(e) => setSmsConsent(e.target.checked)}
            disabled={isPageLoading}
            className="mt-1 h-5 w-5 shrink-0 rounded accent-sage"
          />
          <span className="text-[14px] leading-relaxed text-white/70">
            <span className="font-medium text-ivory">Text me about my matches.</span>{" "}
            When a match drops and when it&rsquo;s mutual. Turn this off and you&rsquo;ll
            need to check the dashboard yourself.
          </span>
        </label>
      </Panel>

      <div className="flex flex-col gap-2.5">
        <Pill onClick={handleSave} disabled={isPageLoading || isSaving} className="w-full">
          {isSaving ? "Saving…" : "Save changes"}
        </Pill>
        <Pill tone="glass" href="/dashboard" className="w-full">
          Cancel
        </Pill>
      </div>
    </DashboardShell>
  );
}
