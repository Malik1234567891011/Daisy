"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-2 block text-sm font-medium text-charcoal"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-text-primary placeholder:text-text-tertiary/70",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage-light/60",
            "hover:border-border/80",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-cream/50",
            error ? "border-error ring-1 ring-error/10" : "border-border",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-[13px] text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
