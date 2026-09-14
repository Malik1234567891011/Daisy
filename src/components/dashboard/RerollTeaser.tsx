"use client";

import { Shuffle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel, PANEL_INSET, Eyebrow, PanelTitle, Muted, Pill } from "@/components/dashboard/primitives";
import { formatRerollPrice, formatRerollPriceWithCurrency } from "@/lib/billing";

/**
 * The paid reroll, sold as a person rather than a price.
 *
 * One portrait, blurred past recognition, picked to match who the user said
 * they are looking for. The photographs are generated placeholders shipped
 * already blurred (`public/reroll/`), so no face — real or otherwise — ever
 * reaches the browser sharp; the CSS blur on top is only there to soften the
 * card's edge against the panel.
 *
 * The card floats on its own and shivers faster while a reroll is in flight,
 * so the wait feels like a card being turned rather than a spinner.
 * Motion lives in globals.css (`.reroll-*`) and collapses to a still card
 * under prefers-reduced-motion.
 */

/* Where the little gold sparks sit and when each one fires. Hand-placed so
   they ring the card instead of falling in a grid. */
const SPARKS: React.CSSProperties[] = [
  { left: "22%", top: "24%", animationDelay: "0s" },
  { left: "76%", top: "18%", animationDelay: "0.7s", scale: "0.7" },
  { left: "18%", top: "62%", animationDelay: "1.3s", scale: "0.8" },
  { left: "80%", top: "58%", animationDelay: "1.9s" },
  { left: "30%", top: "84%", animationDelay: "2.5s", scale: "0.6" },
  { left: "70%", top: "80%", animationDelay: "3.1s", scale: "0.75" },
];

const PORTRAITS = {
  woman: "/reroll/woman.webp",
  man: "/reroll/man.webp",
} as const;

/**
 * "Women" and "Men" are exact. "Everyone" (and anything unset) alternates by
 * account rather than at random, so the same person always sees the same card
 * and it never flickers between renders.
 */
export function portraitFor(genderPreference: string | null | undefined, seed = ""): string {
  if (genderPreference === "Women") return PORTRAITS.woman;
  if (genderPreference === "Men") return PORTRAITS.man;
  return seed.charCodeAt(0) % 2 === 0 ? PORTRAITS.woman : PORTRAITS.man;
}

export type RerollTeaserProps = {
  /** Where the card is shown: under a live match, or after one closed. */
  context: "match" | "closed";
  genderPreference: string | null | undefined;
  /** Stable per-account seed for the "Everyone" case — the user id. */
  seed?: string;
  onReroll: () => void;
  rerolling: boolean;
  rerollError: string | null;
  hasRerollCredit: boolean;
};

export default function RerollTeaser({
  context,
  genderPreference,
  seed,
  onReroll,
  rerolling,
  rerollError,
  hasRerollCredit,
}: RerollTeaserProps) {
  const src = portraitFor(genderPreference, seed);

  return (
    <Panel flush className="relative overflow-hidden">
      {/* Stage. The panel's own colour fades up over the foot of the card so
          it sits *in* the slab rather than pasted on top of it. */}
      {/* `data-ready`: a reroll is already paid for, so the card is a prize
          waiting to be claimed and the whole panel gets louder about it. */}
      <div
        className="reroll-stage"
        data-rerolling={rerolling || undefined}
        data-ready={(hasRerollCredit && !rerolling) || undefined}
      >
        <div className="reroll-glow" aria-hidden="true" />

        <div className="reroll-card" aria-hidden="true">
          <img src={src} alt="" className="reroll-card-art" draggable={false} />
          <div className="reroll-card-shine" />
          <span className="reroll-badge">
            <Sparkles className="h-3.5 w-3.5 text-bloom" strokeWidth={2} aria-hidden="true" />
            {rerolling ? "Dealing…" : "Someone new"}
          </span>
        </div>

        {hasRerollCredit && !rerolling && (
          <div className="reroll-sparks" aria-hidden="true">
            {SPARKS.map((sp, i) => (
              <span key={i} className="reroll-spark" style={sp} />
            ))}
          </div>
        )}

        <div className="reroll-fade" aria-hidden="true" />
      </div>

      <div className={cn(PANEL_INSET, "-mt-3 text-center")}>
        {/* A paid-for reroll is announced here, in gold, rather than on the
            card — a label on the photograph fought the photograph. */}
        {hasRerollCredit ? (
          <Eyebrow className="justify-center text-bloom">1 reroll ready</Eyebrow>
        ) : (
          <Eyebrow className="justify-center">
            {context === "closed" ? "Skip the wait" : "Don’t wait for Wednesday"}
          </Eyebrow>
        )}
        <PanelTitle className="mt-2">This could be your next match</PanelTitle>
        <Muted className="mx-auto mt-2 max-w-[300px]">
          {context === "closed"
            ? "Get a new match dealt right now instead of waiting a week."
            : "Swap this one for someone new, right now."}{" "}
          {hasRerollCredit
            ? "You already have a reroll waiting."
            : `One-time ${formatRerollPriceWithCurrency()}. Not a subscription.`}
        </Muted>

        <Pill
          onClick={onReroll}
          disabled={rerolling}
          className={cn("reroll-cta mt-5 w-full", hasRerollCredit && "reroll-cta-ready")}
        >
          <Shuffle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {rerolling
            ? "Finding someone new…"
            : hasRerollCredit
              ? "Use your reroll"
              : `Reroll for ${formatRerollPrice()}`}
        </Pill>

        {rerollError && (
          <p className="mt-3 text-[13px] text-error" role="alert">
            {rerollError}
          </p>
        )}
      </div>
    </Panel>
  );
}
