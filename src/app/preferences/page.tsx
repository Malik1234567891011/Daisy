"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  Panel, PanelTitle, Muted, Pill, Field, ChoicePills, ToggleChips, FormStatus,
} from "@/components/dashboard/primitives";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MAJORS, ETHNICITIES, GENDER_PREFERENCES } from "@/lib/constants";
import {
  parseEthnicityPreference,
  stringifyEthnicityPreference,
} from "@/lib/ethnicityPreference";
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

const ETHNICITY_OPTIONS = ETHNICITIES.map((e) => ({ value: e, label: e }));

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

/** Who you want to meet. Changes take effect on the next Wednesday drop. */
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
    if (status === "unauthenticated") router.replace("/login");
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
          throw new Error(typeof body?.error === "string" ? body.error : "Failed to load preferences");
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
        if (!cancelled) setFetchError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [status]);

  const toggleEthPref = useCallback((eth: string) => {
    setEthPrefs((prev) => (prev.includes(eth) ? prev.filter((e) => e !== eth) : [...prev, eth]));
  }, []);

  const validate = useCallback((): boolean => {
    const next: { ageMin?: string; ageMax?: string } = {};
    const min = parseInt(ageMin, 10);
    const max = parseInt(ageMax, 10);
    if (!ageMin || isNaN(min)) next.ageMin = "Enter a minimum age";
    else if (min < 18 || min > 30) next.ageMin = "Must be between 18 and 30";
    if (!ageMax || isNaN(max)) next.ageMax = "Enter a maximum age";
    else if (max < 18 || max > 30) next.ageMax = "Must be between 18 and 30";
    if (!next.ageMin && !next.ageMax && min > max) next.ageMin = "Min can't be greater than max";
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
          ethnicityPreference: stringifyEthnicityPreference(ethPrefs) ?? "",
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Failed to save preferences");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      baselineRef.current = { genderPref, schoolPref, ageMin, ageMax, majorPref, ethPrefs: [...ethPrefs] };
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

  if (status === "unauthenticated") return null;

  return (
    <DashboardShell title="Your preferences" backHref="/dashboard">
      <Muted className="-mt-2 text-center">
        What matters in a match. Changes take effect on your next Wednesday.
      </Muted>

      {loading && <FormStatus kind="info">Loading preferences…</FormStatus>}
      {fetchError && !loading && <FormStatus kind="error">{fetchError}</FormStatus>}
      {saved && <FormStatus kind="success">Preferences saved.</FormStatus>}
      {saveError && <FormStatus kind="error">{saveError}</FormStatus>}

      <Panel className={cn("flex flex-col gap-6", formDisabled && "pointer-events-none opacity-60")}>
        <PanelTitle className="text-[20px]">Who you want to meet</PanelTitle>

        <Field label="Interested in">
          {/* Segmented: one row, one choice, the whole width. */}
          <div className="flex overflow-hidden rounded-full border border-white/12 bg-white/[0.05] p-1" role="radiogroup" aria-label="Interested in">
            {GENDER_PREFERENCES.map((pref) => {
              const on = genderPref === pref;
              return (
                <button
                  key={pref}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={formDisabled}
                  onClick={() => setGenderPref(pref)}
                  className={cn(
                    "h-10 min-w-0 flex-1 rounded-full px-1 text-[13px] transition-all duration-200",
                    "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
                    on
                      ? "bg-[var(--color-ivory)] font-semibold text-[var(--color-olive)]"
                      : "font-medium text-white/70 hover:text-ivory",
                  )}
                >
                  {pref}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="School" hint="How close should your match be?">
          <ChoicePills
            label="School preference"
            options={SCHOOL_PREF_OPTIONS}
            value={schoolPref}
            onChange={setSchoolPref}
            disabled={formDisabled}
          />
        </Field>

        <Field label="Age range">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min"
              type="number"
              inputMode="numeric"
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
              inputMode="numeric"
              min={18}
              max={30}
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
              error={errors.ageMax}
              placeholder="30"
              disabled={formDisabled}
            />
          </div>
        </Field>

        <Select
          label="Major preference"
          value={majorPref}
          onChange={(e) => setMajorPref(e.target.value)}
          options={MAJOR_PREF_OPTIONS}
          helperText="Leave as ‘No preference’ to match with any major."
          disabled={formDisabled}
        />

        <Field
          label="Ethnicity preference"
          optional
          hint="Select all that apply, or leave blank to match with everyone."
        >
          <ToggleChips
            label="Ethnicity preference"
            options={ETHNICITY_OPTIONS}
            selected={ethPrefs}
            onToggle={toggleEthPref}
            disabled={formDisabled}
          />
        </Field>
      </Panel>

      <div className="flex flex-col gap-2.5">
        <Pill onClick={handleSave} disabled={formDisabled} className="w-full">
          {saving ? "Saving…" : "Save preferences"}
        </Pill>
        <Pill tone="glass" onClick={handleReset} disabled={formDisabled} className="w-full">
          Undo changes
        </Pill>
      </div>
    </DashboardShell>
  );
}
