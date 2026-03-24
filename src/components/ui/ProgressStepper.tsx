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
      {/* Mobile: thin progress bar with step count */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-charcoal">
            Step {currentStep} of {totalSteps}
          </span>
          {currentLabel && (
            <span className="text-sm text-text-secondary truncate ml-3">
              {currentLabel}
            </span>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-cream-dark/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-sage transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Desktop: dots with current step label */}
      <div className="hidden md:block">
        <div className="flex items-center justify-center gap-2.5">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={stepNum} className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-300",
                    isCompleted && "bg-sage",
                    isCurrent && "bg-sage ring-4 ring-sage-light",
                    !isCompleted && !isCurrent && "bg-cream-dark"
                  )}
                  aria-label={`Step ${stepNum}${steps[i] ? `: ${steps[i].label}` : ""}`}
                />
                {i < totalSteps - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-6 rounded-full transition-colors duration-300",
                      stepNum < currentStep ? "bg-sage" : "bg-cream-dark"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        {currentLabel && (
          <p className="mt-3 text-center text-sm font-medium text-charcoal">
            {currentLabel}
          </p>
        )}
      </div>
    </div>
  );
}

export { ProgressStepper };
export type { ProgressStepperProps, Step };
