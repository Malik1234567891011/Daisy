"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { INTERESTS, IDEAL_HANGOUTS, AVAILABILITY } from "@/lib/constants";
import type { PersonalityData } from "@/lib/types";

interface StepInterestsProps {
  personality: PersonalityData;
  onPersonalityChange: (updates: Partial<PersonalityData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
        selected
          ? "bg-sage text-white"
          : "bg-cream/60 text-text-secondary border border-border hover:border-border/80"
      }`}
    >
      {children}
    </button>
  );
}

function OptionCard({
  selected,
  onClick,
  emoji,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
        selected
          ? "border-sage bg-sage-pale/40 text-charcoal"
          : "border-border bg-white text-text-secondary hover:border-border/80"
      }`}
    >
      <span className="text-base">{emoji}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function StepInterests({
  personality,
  onPersonalityChange,
  onNext,
  onBack,
}: StepInterestsProps) {
  const [touched, setTouched] = useState(false);

  const toggleInterest = (interest: string) => {
    const current = personality.interests;
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    onPersonalityChange({ interests: updated });
  };

  const toggleAvailability = (slot: string) => {
    const current = personality.availability;
    const updated = current.includes(slot)
      ? current.filter((s) => s !== slot)
      : [...current, slot];
    onPersonalityChange({ availability: updated });
  };

  const canContinue =
    personality.interests.length >= 2 &&
    personality.idealHangout &&
    personality.availability.length >= 1;

  const handleNext = () => {
    setTouched(true);
    if (canContinue) onNext();
  };

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="font-display text-3xl text-charcoal mb-2">
        What you enjoy
      </h2>
      <p className="text-text-secondary mb-8">
        Pick what resonates. This helps us match thoughtfully.
      </p>

      {/* Interests */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-text-primary mb-3">
          Interests <span className="text-text-tertiary font-normal">(pick at least 2)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <Chip
              key={interest}
              selected={personality.interests.includes(interest)}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Chip>
          ))}
        </div>
        {touched && personality.interests.length < 2 && (
          <p className="text-sm text-error mt-2">Pick at least 2</p>
        )}
      </div>

      {/* Ideal hangout */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-text-primary mb-3">
          Ideal first hangout?
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {IDEAL_HANGOUTS.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={personality.idealHangout === opt.value}
              onClick={() => onPersonalityChange({ idealHangout: opt.value })}
              emoji={opt.emoji}
              label={opt.label}
            />
          ))}
        </div>
        {touched && !personality.idealHangout && (
          <p className="text-sm text-error mt-2">Pick one</p>
        )}
      </div>

      {/* Availability */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-text-primary mb-3">
          When are you usually free?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABILITY.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleAvailability(opt.value)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                personality.availability.includes(opt.value)
                  ? "border-sage bg-sage-pale/40 text-charcoal"
                  : "border-border bg-white text-text-secondary hover:border-border/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {touched && personality.availability.length < 1 && (
          <p className="text-sm text-error mt-2">Pick at least one</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" size="lg" onClick={handleNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
