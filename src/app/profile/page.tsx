"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import { SCHOOLS, MAJORS, ETHNICITIES, GENDERS, IDEAL_HANGOUTS } from "@/lib/constants";
import { parseIdealHangouts, stringifyIdealHangouts } from "@/lib/idealHangouts";
import type { ContactMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import ProfilePhotoPicker from "@/components/profile/ProfilePhotoPicker";

const SCHOOL_OPTIONS = SCHOOLS.map((s) => ({ value: s, label: s }));
const MAJOR_OPTIONS = MAJORS.map((m) => ({ value: m, label: m }));
const GENDER_OPTIONS = GENDERS.map((g) => ({ value: g, label: g }));

const CONTACT_METHODS: { value: ContactMethod; label: string; placeholder: string }[] = [
  { value: "instagram", label: "Instagram", placeholder: "@yourhandle" },
  { value: "phone", label: "Phone", placeholder: "(555) 123-4567" },
  { value: "email", label: "Email", placeholder: "you@example.com" },
];

const CONTACT_METHOD_VALUES = CONTACT_METHODS.map((m) => m.value) as ContactMethod[];

function parseContactMethod(value: unknown): ContactMethod {
  return typeof value === "string" && CONTACT_METHOD_VALUES.includes(value as ContactMethod)
    ? (value as ContactMethod)
    : "instagram";
}

function ethnicityApiToSelected(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(", ")
    .map((s) => s.trim())
    .filter((s) => ETHNICITIES.includes(s));
}

function hangoutsApiToSelected(raw: string | null | undefined): string[] {
  const known = IDEAL_HANGOUTS.map((o) => o.value);
  return parseIdealHangouts(raw).filter((v) => known.includes(v));
}

interface FormErrors {
  firstName?: string;
  school?: string;
  major?: string;
  age?: string;
  idealHangouts?: string;
  contactValue?: string;
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
  const [selectedHangouts, setSelectedHangouts] = useState<string[]>([]);
  const [contactMethod, setContactMethod] = useState<ContactMethod>("instagram");
  const [contactValue, setContactValue] = useState("");
  const [smsConsent, setSmsConsent] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    async function loadUser() {
      setLoadError(null);
      setIsFetchingUser(true);
      try {
        const res = await fetch("/api/user");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Failed to load profile");
        }
        if (cancelled) return;
        setFirstName(typeof data.firstName === "string" ? data.firstName : "");
        setSchool(typeof data.school === "string" ? data.school : "");
        setMajor(typeof data.major === "string" ? data.major : "");
        setAge(data.age != null && data.age !== "" ? String(data.age) : "");
        setGender(typeof data.gender === "string" ? data.gender : "");
        setSelectedEthnicities(ethnicityApiToSelected(data.ethnicity));
        setSelectedHangouts(hangoutsApiToSelected(data.idealHangout));
        setContactMethod(parseContactMethod(data.contactMethod));
        setContactValue(typeof data.contactValue === "string" ? data.contactValue : "");
        setSmsConsent(data.smsConsent !== false);
        setPhotoUrl(typeof data.photoUrl === "string" ? data.photoUrl : null);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) setIsFetchingUser(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const isPageLoading = status === "loading" || (status === "authenticated" && isFetchingUser);

  const toggleEthnicity = useCallback((ethnicity: string) => {
    setSelectedEthnicities((prev) =>
      prev.includes(ethnicity)
        ? prev.filter((e) => e !== ethnicity)
        : [...prev, ethnicity]
    );
  }, []);

  const toggleHangout = useCallback((value: string) => {
    setSelectedHangouts((prev) =>
      prev.includes(value) ? prev.filter((h) => h !== value) : [...prev, value]
    );
  }, []);

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!school) next.school = "Please select your school";
    if (!major) next.major = "Please select your major";
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum)) next.age = "Please enter your age";
    else if (ageNum < 18 || ageNum > 30) next.age = "Age must be between 18 and 30";
    if (selectedHangouts.length === 0) next.idealHangouts = "Pick at least one";
    if (!contactValue.trim()) next.contactValue = "Please enter your contact info";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [firstName, school, major, age, selectedHangouts, contactValue]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          school,
          major,
          age,
          gender,
          ethnicity: selectedEthnicities.length > 0 ? selectedEthnicities.join(", ") : "",
          idealHangout: stringifyIdealHangouts(selectedHangouts),
          contactMethod,
          contactValue: contactValue.trim(),
          smsConsent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to save profile");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }, [
    validate,
    firstName,
    school,
    major,
    age,
    gender,
    selectedEthnicities,
    selectedHangouts,
    contactMethod,
    contactValue,
    smsConsent,
  ]);

  const activePlaceholder = CONTACT_METHODS.find((m) => m.value === contactMethod)?.placeholder ?? "";

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ivory bg-grain">
      <Navbar />

      <main className="flex-1">
        <div className="section-container max-w-2xl py-10 sm:py-14">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-charcoal transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to dashboard
          </Link>

          {/* Heading */}
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal">Your profile</h1>
          <p className="mt-1 text-text-secondary mb-8">
            This is what helps us find your match. Update anytime.
          </p>

          {isPageLoading && (
            <div className="mb-6 rounded-xl bg-cream border border-border px-4 py-3 text-sm text-text-secondary" role="status">
              Loading profile…
            </div>
          )}

          {loadError && !isPageLoading && (
            <div className="mb-6 rounded-xl bg-error-light border border-error/20 px-4 py-3 text-sm text-error" role="alert">
              {loadError}
            </div>
          )}

          {/* Success message */}
          {saved && (
            <div className="mb-6 rounded-xl bg-success-light border border-success/20 px-4 py-3 text-sm text-success" role="status">
              Profile updated successfully.
            </div>
          )}

          {saveError && (
            <div className="mb-6 rounded-xl bg-error-light border border-error/20 px-4 py-3 text-sm text-error" role="alert">
              {saveError}
            </div>
          )}

          {/* Profile form */}
          <Card id="photo" className="mb-6">
            <ProfilePhotoPicker
              photoUrl={photoUrl}
              onUploaded={setPhotoUrl}
              disabled={isPageLoading}
            />
            <div className="h-px bg-border-light my-6" aria-hidden />
            <div className="flex flex-col gap-5">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.firstName}
                placeholder="Your first name"
                disabled={isPageLoading}
              />

              <Select
                label="School"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                options={SCHOOL_OPTIONS}
                placeholder="Select your school"
                error={errors.school}
                disabled={isPageLoading}
              />

              <Select
                label="Major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                options={MAJOR_OPTIONS}
                placeholder="Select your major"
                error={errors.major}
                disabled={isPageLoading}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Age"
                  type="number"
                  min={18}
                  max={30}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  error={errors.age}
                  placeholder="18"
                  disabled={isPageLoading}
                />

                <Select
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  options={GENDER_OPTIONS}
                  placeholder="Select"
                  disabled={isPageLoading}
                />
              </div>

              {/* Ethnicity */}
              <div>
                <p className="mb-1.5 text-sm font-medium text-charcoal">
                  Ethnicity <span className="font-normal text-text-tertiary">(optional)</span>
                </p>
                <p className="mb-3 text-sm text-text-tertiary">
                  Only used to respect preferences, if you choose to include it.
                </p>
                <div className="flex flex-wrap gap-2" role="listbox" aria-label="Ethnicity options" aria-multiselectable="true">
                  {ETHNICITIES.map((eth) => (
                    <Chip
                      key={eth}
                      selected={selectedEthnicities.includes(eth)}
                      onToggle={() => toggleEthnicity(eth)}
                      disabled={isPageLoading}
                    >
                      {eth}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Ideal first hangout */}
              <div>
                <p className="mb-1.5 text-sm font-medium text-charcoal">
                  Ideal first hangout{" "}
                  <span className="font-normal text-text-tertiary">(pick any)</span>
                </p>
                <p className="mb-3 text-sm text-text-tertiary">
                  What you&rsquo;d actually want to do on a first date.
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="listbox"
                  aria-label="Ideal first hangout options"
                  aria-multiselectable="true"
                >
                  {IDEAL_HANGOUTS.map((opt) => (
                    <Chip
                      key={opt.value}
                      selected={selectedHangouts.includes(opt.value)}
                      onToggle={() => toggleHangout(opt.value)}
                      disabled={isPageLoading}
                    >
                      <span className="mr-1.5" aria-hidden>
                        {opt.emoji}
                      </span>
                      {opt.label}
                    </Chip>
                  ))}
                </div>
                {errors.idealHangouts && (
                  <p className="mt-2 text-sm text-error">{errors.idealHangouts}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Contact preference */}
          <Card id="contact" className="mb-8">
            <h2 className="font-display text-lg text-charcoal">Contact preference</h2>
            <p className="mt-0.5 text-sm text-text-secondary mb-5">
              How your match will reach you
            </p>

            <div className="flex flex-wrap gap-2 mb-5" role="radiogroup" aria-label="Contact method">
              {CONTACT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  role="radio"
                  aria-checked={contactMethod === method.value}
                  onClick={() => setContactMethod(method.value)}
                  disabled={isPageLoading}
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    contactMethod === method.value
                      ? "bg-sage-pale border-sage text-olive"
                      : "bg-white border-border text-text-secondary hover:border-sage-light hover:text-charcoal"
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <Input
              label={CONTACT_METHODS.find((m) => m.value === contactMethod)?.label}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={activePlaceholder}
              error={errors.contactValue}
              disabled={isPageLoading}
            />

            <p className="mt-3 text-xs text-text-tertiary">
              Only shared after a successful match.
            </p>

            <div className="h-px bg-border-light my-5" aria-hidden />

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                disabled={isPageLoading}
                className="mt-0.5 h-4 w-4 rounded border-border text-sage focus:ring-sage-light/60 accent-sage"
              />
              <span className="text-sm text-text-secondary leading-relaxed">
                <span className="font-medium text-charcoal">Text me about my matches.</span>{" "}
                When a match drops and when it&rsquo;s mutual. Turn this off and
                you&rsquo;ll need to check the dashboard yourself.
              </span>
            </label>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
            <Button variant="secondary" href="/dashboard">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isPageLoading || isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
