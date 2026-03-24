"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { SCHOOLS, MAJORS, GENDERS } from "@/lib/constants";
import type { UserProfile } from "@/lib/types";

interface StepProfileProps {
  profile: UserProfile;
  onProfileChange: (updates: Partial<UserProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

type FieldName = "firstName" | "school" | "major" | "age" | "gender";
type ProfileErrors = Partial<Record<FieldName, string>>;

function getFieldError(field: FieldName, value: unknown): string {
  switch (field) {
    case "firstName":
      return !(value as string)?.trim() ? "First name is required" : "";
    case "school":
      return !value ? "Please select your school" : "";
    case "major":
      return !value ? "Please select your major" : "";
    case "gender":
      return !value ? "Please select your gender" : "";
    case "age": {
      if (value === null || value === undefined || value === "")
        return "Age is required";
      const num = Number(value);
      if (isNaN(num) || num < 18 || num > 30)
        return "Enter an age between 18 and 30";
      return "";
    }
    default:
      return "";
  }
}

const FIELDS: FieldName[] = ["firstName", "school", "major", "age", "gender"];

const schoolOptions = SCHOOLS.map((s) => ({ value: s, label: s }));
const majorOptions = MAJORS.map((m) => ({ value: m, label: m }));
const genderOptions = GENDERS.map((g) => ({ value: g, label: g }));

export default function StepProfile({
  profile,
  onProfileChange,
  onNext,
  onBack,
}: StepProfileProps) {
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function touchAndValidate(field: FieldName, value: unknown) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => {
      const err = getFieldError(field, value);
      return { ...prev, [field]: err || undefined };
    });
  }

  function handleFieldChange(
    field: FieldName,
    value: string | number | null
  ) {
    onProfileChange({ [field]: value });
    if (touched[field]) {
      setErrors((prev) => {
        const err = getFieldError(field, value);
        return { ...prev, [field]: err || undefined };
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    const newErrors: ProfileErrors = {};
    FIELDS.forEach((f) => {
      allTouched[f] = true;
      const err = getFieldError(f, profile[f]);
      if (err) newErrors[f] = err;
    });
    setTouched(allTouched);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) onNext();
  }

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="font-display text-3xl text-charcoal mb-2">The basics</h2>
      <p className="text-text-secondary mb-8">Just enough to get started.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="First name"
          placeholder="Your first name"
          value={profile.firstName}
          onChange={(e) => handleFieldChange("firstName", e.target.value)}
          onBlur={() => touchAndValidate("firstName", profile.firstName)}
          error={touched.firstName ? errors.firstName : undefined}
          autoComplete="given-name"
        />

        <Select
          label="School"
          placeholder="Select your school"
          value={profile.school}
          onChange={(e) => handleFieldChange("school", e.target.value)}
          onBlur={() => touchAndValidate("school", profile.school)}
          error={touched.school ? errors.school : undefined}
          options={schoolOptions}
        />

        <Select
          label="Major"
          placeholder="Select your major"
          value={profile.major}
          onChange={(e) => handleFieldChange("major", e.target.value)}
          onBlur={() => touchAndValidate("major", profile.major)}
          error={touched.major ? errors.major : undefined}
          options={majorOptions}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age"
            type="number"
            placeholder="18"
            min={18}
            max={30}
            value={profile.age ?? ""}
            onChange={(e) =>
              handleFieldChange(
                "age",
                e.target.value ? Number(e.target.value) : null
              )
            }
            onBlur={() => touchAndValidate("age", profile.age)}
            error={touched.age ? errors.age : undefined}
          />

          <Select
            label="Gender"
            placeholder="Select"
            value={profile.gender}
            onChange={(e) => handleFieldChange("gender", e.target.value)}
            onBlur={() => touchAndValidate("gender", profile.gender)}
            error={touched.gender ? errors.gender : undefined}
            options={genderOptions}
          />
        </div>

        <div className="flex items-center gap-3 pt-3">
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
