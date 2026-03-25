"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { INTENTIONS, VIBES } from "@/lib/constants";
import type { PersonalityData } from "@/lib/types";

interface StepPersonalityProps {
  personality: PersonalityData;
  onPersonalityChange: (updates: Partial<PersonalityData>) => void;
  onNext: () => void;
  onBack: () => void;
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
      className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
        selected
          ? "border-sage bg-sage-pale/40 text-charcoal"
          : "border-border bg-white text-text-secondary hover:border-border/80 hover:bg-cream/30"
      }`}
    >
      <span className="text-lg">{emoji}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function StepPersonality({
  personality,
  onPersonalityChange,
  onNext,
  onBack,
}: StepPersonalityProps) {
  const [touched, setTouched] = useState(false);

  const canContinue = personality.intentions && personality.vibe;

  const handleNext = () => {
    setTouched(true);
    if (canContinue) onNext();
  };

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="font-display text-3xl text-charcoal mb-2">
        A little about you
      </h2>
      <p className="text-text-secondary mb-8">
        Helps us find someone on the same page.
      </p>

      {/* Intentions */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-text-primary mb-3">
          What are you looking for?
        </label>
        <div className="grid grid-cols-1 gap-2">
          {INTENTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={personality.intentions === opt.value}
              onClick={() => onPersonalityChange({ intentions: opt.value })}
              emoji={opt.emoji}
              label={opt.label}
            />
          ))}
        </div>
        {touched && !personality.intentions && (
          <p className="text-sm text-error mt-2">Pick one</p>
        )}
      </div>

      {/* Vibe */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-text-primary mb-3">
          Your social energy?
        </label>
        <div className="grid grid-cols-1 gap-2">
          {VIBES.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={personality.vibe === opt.value}
              onClick={() => onPersonalityChange({ vibe: opt.value })}
              emoji={opt.emoji}
              label={opt.label}
            />
          ))}
        </div>
        {touched && !personality.vibe && (
          <p className="text-sm text-error mt-2">Pick one</p>
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
