"use client";

import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { OnboardingData } from "@/lib/types";

interface StepReviewProps {
  data: OnboardingData;
  onNext: () => void;
  onBack: () => void;
  goToStep: (step: number) => void;
  loading?: boolean;
  error?: string;
}

const SCHOOL_PREF_LABELS: Record<string, string> = {
  same: "Same school",
  nearby: "Nearby schools",
  any: "Any school",
};

const CONTACT_LABELS: Record<string, string> = {
  instagram: "Instagram",
  phone: "Phone",
  email: "Email",
};

function mask(value: string): string {
  if (value.length <= 4) return value;
  return value.slice(0, 3) + "\u2022".repeat(Math.min(value.length - 3, 6));
}

function SectionHeader({
  title,
  step,
  goToStep,
}: {
  title: string;
  step: number;
  goToStep: (s: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
        {title}
      </h3>
      <button
        type="button"
        onClick={() => goToStep(step)}
        className="text-sm font-medium text-sage hover:text-olive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 rounded px-1"
      >
        Edit
      </button>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-text-tertiary">{label}</span>
      <span className="text-sm font-medium text-charcoal text-right">
        {value}
      </span>
    </div>
  );
}

export default function StepReview({
  data,
  onNext,
  onBack,
  goToStep,
  loading,
  error,
}: StepReviewProps) {
  const { profile, preferences, contact } = data;

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="font-display text-3xl text-charcoal mb-2">
        Look everything over
      </h2>
      <p className="text-text-secondary mb-8">
        Make sure this looks right. You can always change it later.
      </p>

      <div className="space-y-4">
        <Card>
          <SectionHeader title="Profile" step={3} goToStep={goToStep} />
          <InfoRow label="Name" value={profile.firstName} />
          <InfoRow label="School" value={profile.school} />
          <InfoRow label="Major" value={profile.major} />
          <InfoRow label="Age" value={profile.age?.toString()} />
          <InfoRow label="Gender" value={profile.gender} />
        </Card>

        {profile.ethnicity && (
          <Card>
            <SectionHeader title="Identity" step={4} goToStep={goToStep} />
            <InfoRow label="Ethnicity" value={profile.ethnicity} />
          </Card>
        )}

        <Card>
          <SectionHeader title="Preferences" step={5} goToStep={goToStep} />
          <InfoRow label="Interested in" value={preferences.genderPreference} />
          <InfoRow
            label="School"
            value={SCHOOL_PREF_LABELS[preferences.schoolPreference]}
          />
          <InfoRow
            label="Age range"
            value={`${preferences.ageRange.min}\u2013${preferences.ageRange.max}`}
          />
          <InfoRow
            label="Major"
            value={preferences.majorPreference || "No preference"}
          />
          <InfoRow
            label="Ethnicity"
            value={preferences.ethnicityPreference || "No preference"}
          />
        </Card>

        <Card>
          <SectionHeader title="Contact" step={6} goToStep={goToStep} />
          <InfoRow label="Method" value={CONTACT_LABELS[contact.method]} />
          <InfoRow label="Details" value={mask(contact.value)} />
        </Card>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-10">
        <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button type="button" size="lg" onClick={onNext} disabled={loading} className="flex-1">
          {loading ? "Joining\u2026" : "Confirm & join"}
        </Button>
      </div>
    </div>
  );
}
