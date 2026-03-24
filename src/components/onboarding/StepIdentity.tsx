"use client";

import { Chip } from "@/components/ui/Chip";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ETHNICITIES } from "@/lib/constants";

interface StepIdentityProps {
  ethnicity?: string;
  onEthnicityChange: (ethnicity?: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepIdentity({
  ethnicity,
  onEthnicityChange,
  onNext,
  onBack,
}: StepIdentityProps) {
  return (
    <div className="pt-4 md:pt-8">
      <div className="flex items-start gap-3 mb-2">
        <h2 className="font-display text-3xl text-charcoal">
          A little more about you
        </h2>
        <Badge variant="butter" className="mt-2 flex-shrink-0">
          Optional
        </Badge>
      </div>
      <p className="text-text-secondary mb-8">
        Everything here is optional. Only share what you&rsquo;re comfortable
        with.
      </p>

      <fieldset>
        <legend className="text-sm font-medium text-charcoal mb-3">
          Ethnicity
        </legend>
        <div
          className="flex flex-wrap gap-2.5"
          role="listbox"
          aria-label="Ethnicity selection"
        >
          {ETHNICITIES.map((eth) => (
            <Chip
              key={eth}
              selected={ethnicity === eth}
              onToggle={() =>
                onEthnicityChange(ethnicity === eth ? undefined : eth)
              }
            >
              {eth}
            </Chip>
          ))}
        </div>
      </fieldset>

      <p className="mt-4 text-sm text-text-tertiary leading-relaxed">
        This is used only to respect preferences, and is never displayed on your
        profile.
      </p>

      <div className="flex items-center gap-3 mt-10">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={onNext}>
          Skip this step
        </Button>
        <Button type="button" onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
