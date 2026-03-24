"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { MAJORS, ETHNICITIES, GENDER_PREFERENCES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SchoolPreference = "same" | "nearby" | "any";

const SCHOOL_PREF_OPTIONS: { value: SchoolPreference; label: string }[] = [
  { value: "same", label: "Same school" },
  { value: "nearby", label: "Nearby schools" },
  { value: "any", label: "Any school" },
];

const MAJOR_PREF_OPTIONS = [
  { value: "", label: "No preference" },
  ...MAJORS.map((m) => ({ value: m, label: m })),
];

type Baseline = {
  genderPref: string;
  schoolPref: SchoolPreference;
  ageMin: string;
  ageMax: string;
  majorPref: string;
  ethPrefs: string[];
};

function normalizeSchoolPreference(value: unknown): SchoolPreference {
  if (value === "same" || value === "nearby" || value === "any") return value;
  return "any";
}

function parseEthnicityPreference(raw: string | null | undefined): string[] {
  if (raw == null || !String(raw).trim()) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PreferencesPage() {
  const { status } = useSession();
  const router = useRouter();

  const [genderPref, setGenderPref] = useState("");
  const [schoolPref, setSchoolPref] = useState<SchoolPreference>("any");
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("25");
  const [majorPref, setMajorPref] = useState("");
  const [ethPrefs, setEthPrefs] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ ageMin?: string; ageMax?: string }>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const baselineRef = useRef<Baseline | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    (async () => {
      try {
        const res = await fetch("/api/user");
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            typeof body?.error === "string" ? body.error : "Failed to load preferences"
          );
        }
        if (cancelled) return;

        const nextGenderPref = body.genderPreference ?? "";
        const schoolPreference = normalizeSchoolPreference(body.schoolPreference);
        const nextAgeMin = String(body.ageRangeMin ?? 18);
        const nextAgeMax = String(body.ageRangeMax ?? 25);
        const nextMajor = body.majorPreference ?? "";
        const nextEth = parseEthnicityPreference(body.ethnicityPreference);

        setGenderPref(nextGenderPref);
        setSchoolPref(schoolPreference);
        setAgeMin(nextAgeMin);
        setAgeMax(nextAgeMax);
        setMajorPref(nextMajor);
        setEthPrefs(nextEth);
        baselineRef.current = {
          genderPref: nextGenderPref,
          schoolPref: schoolPreference,
          ageMin: nextAgeMin,
          ageMax: nextAgeMax,
          majorPref: nextMajor,
          ethPrefs: [...nextEth],
        };
      } catch (e) {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const toggleEthPref = useCallback((ethnicity: string) => {
    setEthPrefs((prev) =>
      prev.includes(ethnicity)
        ? prev.filter((e) => e !== ethnicity)
        : [...prev, ethnicity]
    );
  }, []);

  const validate = useCallback((): boolean => {
    const next: { ageMin?: string; ageMax?: string } = {};
    const min = parseInt(ageMin, 10);
    const max = parseInt(ageMax, 10);
    if (!ageMin || isNaN(min)) next.ageMin = "Enter a minimum age";
    else if (min < 18 || min > 30) next.ageMin = "Must be between 18 and 30";
    if (!ageMax || isNaN(max)) next.ageMax = "Enter a maximum age";
    else if (max < 18 || max > 30) next.ageMax = "Must be between 18 and 30";
    if (!next.ageMin && !next.ageMax && min > max) {
      next.ageMin = "Min can't be greater than max";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [ageMin, ageMax]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genderPreference: genderPref,
          schoolPreference: schoolPref,
          ageRangeMin: ageMin,
          ageRangeMax: ageMax,
          majorPreference: majorPref,
          ethnicityPreference: ethPrefs.length > 0 ? ethPrefs.join(",") : "",
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string" ? body.error : "Failed to save preferences"
        );
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      baselineRef.current = {
        genderPref,
        schoolPref,
        ageMin,
        ageMax,
        majorPref,
        ethPrefs: [...ethPrefs],
      };
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [validate, genderPref, schoolPref, ageMin, ageMax, majorPref, ethPrefs]);

  const handleReset = useCallback(() => {
    const b = baselineRef.current;
    if (!b) return;
    setGenderPref(b.genderPref);
    setSchoolPref(b.schoolPref);
    setAgeMin(b.ageMin);
    setAgeMax(b.ageMax);
    setMajorPref(b.majorPref);
    setEthPrefs([...b.ethPrefs]);
    setErrors({});
    setSaveError(null);
  }, []);

  const formDisabled = loading || saving;
  const showSessionGate = status === "loading" || status === "unauthenticated";

  if (showSessionGate) {
    return (
      <div className="flex min-h-dvh flex-col bg-ivory">
        <Navbar />

        <main className="flex-1">
          <div className="section-container max-w-2xl py-10 sm:py-14">
            <p className="text-sm text-text-secondary" role="status">
              {status === "unauthenticated" ? "Redirecting…" : "Loading…"}
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
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
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal">Your preferences</h1>
          <p className="mt-1 text-text-secondary mb-8">
            Tell us what matters in a match. Changes take effect on your next match cycle.
          </p>

          {/* Success message */}
          {saved && (
            <div className="mb-6 rounded-xl bg-success-light border border-success/20 px-4 py-3 text-sm text-success" role="status">
              Preferences saved successfully.
            </div>
          )}

          {fetchError && (
            <div className="mb-6 rounded-xl bg-error-light border border-error/20 px-4 py-3 text-sm text-error" role="alert">
              {fetchError}
            </div>
          )}

          {saveError && (
            <div className="mb-6 rounded-xl bg-error-light border border-error/20 px-4 py-3 text-sm text-error" role="alert">
              {saveError}
            </div>
          )}

          {loading && (
            <div className="mb-6 rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-secondary" role="status">
              Loading preferences…
            </div>
          )}

          <Card className="mb-8">
            <div className="relative">
              {loading && (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70"
                  aria-hidden="true"
                />
              )}
              <div
                className={cn(
                  "flex flex-col gap-8",
                  formDisabled && "pointer-events-none opacity-50"
                )}
              >
                {/* Gender preference */}
                <div>
                  <p className="mb-1.5 text-sm font-medium text-charcoal">Interested in</p>
                  <p className="mb-3 text-sm text-text-tertiary">
                    Who would you like to be matched with?
                  </p>
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    {GENDER_PREFERENCES.map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        disabled={formDisabled}
                        onClick={() => setGenderPref(pref)}
                        className={cn(
                          "flex-1 py-3 text-sm font-medium transition-colors duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-inset",
                          genderPref === pref
                            ? "bg-sage text-white"
                            : "bg-white text-text-secondary hover:bg-sage-pale hover:text-charcoal"
                        )}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* School preference */}
                <div>
                  <p className="mb-1.5 text-sm font-medium text-charcoal">School preference</p>
                  <p className="mb-3 text-sm text-text-tertiary">
                    How close should your match be?
                  </p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="School preference">
                    {SCHOOL_PREF_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={schoolPref === opt.value}
                        disabled={formDisabled}
                        onClick={() => setSchoolPref(opt.value)}
                        className={cn(
                          "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2",
                          schoolPref === opt.value
                            ? "bg-sage-pale border-sage text-olive"
                            : "bg-white border-border text-text-secondary hover:border-sage-light hover:text-charcoal"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age range */}
                <div>
                  <p className="mb-1.5 text-sm font-medium text-charcoal">Age range</p>
                  <p className="mb-3 text-sm text-text-tertiary">
                    What age range are you open to?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Min"
                      type="number"
                      min={18}
                      max={30}
                      value={ageMin}
                      onChange={(e) => setAgeMin(e.target.value)}
                      error={errors.ageMin}
                      placeholder="18"
                      disabled={formDisabled}
                    />
                    <Input
                      label="Max"
                      type="number"
                      min={18}
                      max={30}
                      value={ageMax}
                      onChange={(e) => setAgeMax(e.target.value)}
                      error={errors.ageMax}
                      placeholder="30"
                      disabled={formDisabled}
                    />
                  </div>
                </div>

                {/* Major preference */}
                <Select
                  label="Major preference"
                  value={majorPref}
                  onChange={(e) => setMajorPref(e.target.value)}
                  options={MAJOR_PREF_OPTIONS}
                  helperText="Leave as 'No preference' to match with any major."
                  disabled={formDisabled}
                />

                {/* Ethnicity preference */}
                <div>
                  <p className="mb-1.5 text-sm font-medium text-charcoal">
                    Ethnicity preference <span className="font-normal text-text-tertiary">(optional)</span>
                  </p>
                  <p className="mb-3 text-sm text-text-tertiary">
                    Optional — leave blank to match with everyone.
                  </p>
                  <div className="flex flex-wrap gap-2" role="listbox" aria-label="Ethnicity preference" aria-multiselectable="true">
                    {ETHNICITIES.map((eth) => (
                      <Chip
                        key={eth}
                        selected={ethPrefs.includes(eth)}
                        onToggle={() => toggleEthPref(eth)}
                        disabled={formDisabled}
                      >
                        {eth}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
            <Button variant="ghost" onClick={handleReset} disabled={formDisabled}>
              Reset to defaults
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={formDisabled}>
              {saving ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
