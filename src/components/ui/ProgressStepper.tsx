"use client";

import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description?: string;
}

interface ProgressStepperProps {
  currentStep: number;
  totalSteps: number;
  steps?: Step[];
  className?: string;
}

function ProgressStepper({
  currentStep,
  totalSteps,
  steps = [],
  className,
}: ProgressStepperProps) {
  const progress = Math.min((currentStep / totalSteps) * 100, 100);
  const currentLabel = steps[currentStep - 1]?.label;

  return (
    <div className={cn("w-full", className)} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[13px] font-medium text-charcoal tracking-wide">
            Step {currentStep} of {totalSteps}
          </span>
          {currentLabel && (
            <span className="text-[13px] text-text-tertiary truncate ml-3">
              {currentLabel}
            </span>
          )}
        </div>
        <div className="h-1 w-full rounded-full bg-cream-dark/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-sage transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={stepNum} className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-400 ease-out",
                    isCompleted && "bg-sage",
                    isCurrent && "bg-sage ring-[3px] ring-sage-light/50 scale-125",
                    !isCompleted && !isCurrent && "bg-cream-dark/60"
                  )}
                  aria-label={`Step ${stepNum}${steps[i] ? `: ${steps[i].label}` : ""}`}
                />
                {i < totalSteps - 1 && (
                  <div
                    className={cn(
                      "h-px w-5 rounded-full transition-colors duration-400",
                      stepNum < currentStep ? "bg-sage-light" : "bg-cream-dark/50"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        {currentLabel && (
          <p className="mt-4 text-center text-sm font-medium text-charcoal">
            {currentLabel}
          </p>
        )}
      </div>
    </div>
  );
}

export { ProgressStepper };
export type { ProgressStepperProps, Step };
