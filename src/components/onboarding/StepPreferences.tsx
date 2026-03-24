"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MAJORS, ETHNICITIES, GENDER_PREFERENCES } from "@/lib/constants";
import type { UserPreferences } from "@/lib/types";

interface StepPreferencesProps {
  preferences: UserPreferences;
  onPreferencesChange: (updates: Partial<UserPreferences>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SCHOOL_OPTIONS: {
  value: UserPreferences["schoolPreference"];
  label: string;
}[] = [
  { value: "same", label: "Same school" },
  { value: "nearby", label: "Nearby schools" },
  { value: "any", label: "Any school" },
];

const majorOptions = [
  { value: "", label: "No preference" },
  ...MAJORS.map((m) => ({ value: m, label: m })),
];

export default function StepPreferences({
  preferences,
  onPreferencesChange,
  onNext,
  onBack,
}: StepPreferencesProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!preferences.genderPreference) next.genderPreference = "Please select who you're interested in";
    const { min, max } = preferences.ageRange;
    if (min < 18) next.minAge = "Minimum age is 18";
    if (max > 30) next.maxAge = "Maximum age is 30";
    if (min > max) next.minAge = "Min can't exceed max";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext();
  }

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="font-display text-3xl text-charcoal mb-2">
        What are you looking for?
      </h2>
      <p className="text-text-secondary mb-8">
        These help us match you better. You can change them anytime.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Gender preference */}
        <fieldset>
          <legend className="text-sm font-medium text-charcoal mb-3">
            I&rsquo;m interested in
          </legend>
          <div className="flex rounded-xl border border-border overflow-hidden">
            {GENDER_PREFERENCES.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() =>
                  onPreferencesChange({ genderPreference: pref })
                }
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-inset",
                  preferences.genderPreference === pref
                    ? "bg-sage text-white"
                    : "bg-white text-text-secondary hover:bg-sage-pale hover:text-charcoal"
                )}
              >
                {pref}
              </button>
            ))}
          </div>
          {errors.genderPreference && (
            <p className="mt-1.5 text-sm text-error" role="alert">{errors.genderPreference}</p>
          )}
        </fieldset>

        {/* School preference — segmented control */}
        <fieldset>
          <legend className="text-sm font-medium text-charcoal mb-3">
            School preference
          </legend>
          <div className="flex rounded-xl border border-border overflow-hidden">
            {SCHOOL_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  onPreferencesChange({ schoolPreference: value })
                }
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-inset",
                  preferences.schoolPreference === value
                    ? "bg-sage text-white"
                    : "bg-white text-text-secondary hover:bg-sage-pale hover:text-charcoal"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Age range */}
        <fieldset>
          <legend className="text-sm font-medium text-charcoal mb-3">
            Age range
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min age"
              type="number"
              min={18}
              max={30}
              value={preferences.ageRange.min}
              onChange={(e) =>
                onPreferencesChange({
                  ageRange: {
                    ...preferences.ageRange,
                    min: Number(e.target.value) || 18,
                  },
                })
              }
              error={errors.minAge}
            />
            <Input
              label="Max age"
              type="number"
              min={18}
              max={30}
              value={preferences.ageRange.max}
              onChange={(e) =>
                onPreferencesChange({
                  ageRange: {
                    ...preferences.ageRange,
                    max: Number(e.target.value) || 25,
                  },
                })
              }
              error={errors.maxAge}
            />
          </div>
        </fieldset>

        {/* Major preference */}
        <Select
          label="Major preference"
          value={preferences.majorPreference}
          onChange={(e) =>
            onPreferencesChange({ majorPreference: e.target.value })
          }
          options={majorOptions}
        />

        {/* Ethnicity preference */}
        <fieldset>
          <legend className="text-sm font-medium text-charcoal mb-1">
            Ethnicity preference
          </legend>
          <p className="text-sm text-text-tertiary mb-3">
            Optional &mdash; leave blank to match with everyone
          </p>
          <div
            className="flex flex-wrap gap-2.5"
            role="listbox"
            aria-label="Ethnicity preference"
          >
            <Chip
              selected={!preferences.ethnicityPreference}
              onToggle={() =>
                onPreferencesChange({ ethnicityPreference: undefined })
              }
            >
              No preference
            </Chip>
            {ETHNICITIES.map((eth) => (
              <Chip
                key={eth}
                selected={preferences.ethnicityPreference === eth}
                onToggle={() =>
                  onPreferencesChange({
                    ethnicityPreference:
                      preferences.ethnicityPreference === eth ? undefined : eth,
                  })
                }
              >
                {eth}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3 pt-2">
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
