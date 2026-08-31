"use client";

import { forwardRef, useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The dark form panel that floats on the card's photograph, plus the controls
 * that live in it.
 *
 * These are separate from the site-wide Input/Button because those are drawn
 * for ivory grounds — white fills, charcoal text, sage rings. On the card that
 * inverts completely, and the two sets share no useful middle ground.
 */

/** Near-opaque on purpose: it is a slab laid on the photo, not a tint of it. */
export function AuthPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-white/10 bg-[rgba(17,21,14,0.86)]",
        "px-5 pb-7 pt-6 backdrop-blur-md sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ label, error, className, id: externalId, ...props }, ref) {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;

    return (
      <div className="w-full">
        <label htmlFor={id} className="mb-3 block text-[16px] text-ivory">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-[52px] w-full rounded-[10px] border px-4 text-[15px] text-ivory",
            "bg-white/[0.09] placeholder:text-white/40",
            "transition-colors duration-200 ease-out",
            "focus:border-sage-light/70 focus:bg-white/[0.13] focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-error/80" : "border-white/12",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="mt-2 text-[13px] text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

/** The white pill. One per screen — it is the only thing that moves you on. */
export function AuthSubmit({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "h-[48px] w-full rounded-full bg-ivory text-[16px] font-bold text-olive",
        "transition-all duration-200 ease-out hover:bg-bloom-soft active:scale-[0.99]",
        "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-4" aria-hidden>
      <span className="h-px flex-1 bg-white/15" />
      <span className="text-[14px] text-white/55">{label}</span>
      <span className="h-px flex-1 bg-white/15" />
    </div>
  );
}

type AltProps = {
  className?: string;
  children: React.ReactNode;
};

const altClasses =
  "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[12px] " +
  "border border-white/12 bg-white/[0.06] text-[15px] text-ivory " +
  "transition-colors duration-200 ease-out hover:bg-white/[0.12] " +
  "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2";

/** The quiet rows under the divider — a second route, never the main one. */
export function AuthAltButton({
  className,
  children,
  ...props
}: AltProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(altClasses, className)} {...props}>
      {children}
    </button>
  );
}

export function AuthAltLink({
  href,
  className,
  children,
}: AltProps & { href: string }) {
  return (
    <Link href={href} className={cn(altClasses, className)}>
      {children}
    </Link>
  );
}
