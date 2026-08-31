"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The frame every account screen sits in: a soft campus photograph behind a
 * frosted bezel, and a photographic card floating inside it.
 *
 * Two nested surfaces rather than one because the bezel is what makes the card
 * read as an object lying on the backdrop instead of a panel pasted over it —
 * the ground passes through the bezel at near-full brightness and only goes
 * dark inside the card, so the two edges never blend together.
 *
 * The card is deliberately portrait: a tall photograph with the form floating
 * in its middle third, header photo above, sign-up line below.
 */

const WIDTHS = {
  /* Sign-in: one field at a time, so the frame stays phone-shaped. */
  sm: "max-w-[420px]",
  /* Onboarding: option grids and two-column rows need the extra room. */
  md: "max-w-[440px]",
} as const;

interface AuthShellProps {
  /** The boxed wordmark at the top of the card. A trailing second word is
   *  picked out in bloom, the way the homepage section lockups are set. */
  title: string;
  /** Circular chevron, top-left. Omit both and no button renders. */
  onBack?: () => void;
  backHref?: string;
  backLabel?: string;
  /** Sits on the photograph below the form — where the sign-up prompt goes. */
  footer?: React.ReactNode;
  width?: keyof typeof WIDTHS;
  /** Extra classes for the card's inner column. */
  className?: string;
  children: React.ReactNode;
}

export default function AuthShell({
  title,
  onBack,
  backHref,
  backLabel = "Go back",
  footer,
  width = "sm",
  className,
  children,
}: AuthShellProps) {
  const backButtonClasses = cn(
    "inline-flex h-[52px] w-[52px] items-center justify-center rounded-full",
    /* Same glass as the homepage's on-dark pills: backdrop blur plus the
       inset highlights that give the surface an edge. */
    "liquid-glass bg-ivory/15 text-ivory",
    "transition-colors duration-200 hover:bg-ivory/25",
    "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
  );

  const words = title.trim().split(/\s+/);
  const lead = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8">
      {/* Fixed, not absolute: the onboarding flow scrolls, and the photograph
          should stay put underneath it the way a wallpaper does. The file is
          already blurred, so nothing is filtered here. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-ink bg-cover bg-center"
        style={{ backgroundImage: "url('/campus/personal-page-bg.jpg')" }}
      />

      <div
        className={cn(
          "w-full rounded-[32px] border border-white/40 p-[15px]",
          "bg-white/15 backdrop-blur-xl",
          "shadow-[0_28px_80px_rgba(20,24,15,0.28),inset_0_1px_0_rgba(255,255,255,0.5)]",
          WIDTHS[width],
        )}
      >
        <div
          className={cn(
            "relative flex flex-col overflow-hidden rounded-[22px] bg-ink",
            /* Holds the portrait proportion on the short sign-in screen; the
               onboarding steps outgrow it and it stops mattering. */
            width === "sm" && "min-h-[560px]",
          )}
        >
          {/* The campus itself, dimmed rather than hidden. The card should
              still read as a photograph — that is what the form floats on. */}
          <div
            aria-hidden
            /* Oversized: blur leaves a transparent fringe at the edges of the
               layer, so it has to overhang the card it fills. */
            className="pointer-events-none absolute -inset-[12%] bg-cover bg-center"
            style={{
              backgroundImage: "url('/campus/mcgill-campus.png')",
              filter: "blur(14px) brightness(0.72) saturate(0.95)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,15,0.22)_0%,rgba(20,24,15,0.12)_38%,rgba(20,24,15,0.45)_100%)]"
          />

          <div className={cn("relative flex flex-1 flex-col px-5 pt-6 sm:px-6", className)}>
            <div className="h-[52px]">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label={backLabel}
                  className={backButtonClasses}
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </button>
              ) : backHref ? (
                <Link href={backHref} aria-label={backLabel} className={backButtonClasses}>
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </Link>
              ) : null}
            </div>

            {/* Same lockup as the homepage section headings: type on a solid
                ink plate, sized to the words rather than the column. */}
            <h1
              className={cn(
                "mx-auto w-fit bg-ink px-5 py-1.5",
                width === "sm" ? "mt-12" : "mt-8",
              )}
            >
              <span
                className={cn(
                  "font-display leading-none text-ivory",
                  width === "sm" ? "text-[40px]" : "text-[34px]",
                )}
              >
                {lead ? `${lead} ` : ""}
              </span>
              <span
                className={cn(
                  "font-display leading-none",
                  width === "sm" ? "text-[40px]" : "text-[34px]",
                  lead ? "text-bloom" : "text-ivory",
                )}
              >
                {last}
              </span>
            </h1>

            <div className={width === "sm" ? "mt-9" : "mt-6"}>{children}</div>

            {/* Pushes the sign-up line to the bottom of the photograph on the
                short screens, and simply follows the content on the long ones. */}
            <div className="flex-1" />

            {footer ? (
              <div className="pb-6 pt-8 text-center text-[15px] text-white/80">
                {footer}
              </div>
            ) : (
              <div className="pb-7" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
