import { cn } from "@/lib/utils";

/**
 * The two nested surfaces every account screen sits in: a frosted bezel, and
 * a photographic ink card floating inside it.
 *
 * Two surfaces rather than one because the bezel is what makes the card read
 * as an object lying on the backdrop instead of a panel pasted over it — the
 * ground passes through the bezel at near-full brightness and only goes dark
 * inside the card, so the two edges never blend together.
 *
 * Shared by the sign-in and onboarding shell and by the dashboard, so the
 * signed-in screens are visibly the same object as the ones that led there.
 */

export const FRAME_WIDTHS = {
  /* Sign-in: one field at a time, so the frame stays phone-shaped. */
  sm: "max-w-[420px]",
  /* Onboarding: option grids and two-column rows need the extra room. */
  md: "max-w-[440px]",
  /* Dashboard: a match photograph and a countdown want a little more air,
     but it stays a single column so the phone and desktop layouts agree. */
  lg: "max-w-[560px]",
} as const;

interface AuthFrameProps {
  width?: keyof typeof FRAME_WIDTHS;
  /** Hold a portrait proportion even when the content is short. */
  portrait?: boolean;
  /** Classes for the card's inner column — this is where padding goes. The
   *  column carries none of its own, so callers never fight `cn` over it. */
  className?: string;
  children: React.ReactNode;
}

export default function AuthFrame({
  width = "sm",
  portrait = false,
  className,
  children,
}: AuthFrameProps) {
  return (
    <div
      className={cn(
        "w-full rounded-[32px] border border-white/40 p-[15px]",
        "bg-white/15 backdrop-blur-xl",
        "shadow-[0_28px_80px_rgba(20,24,15,0.28),inset_0_1px_0_rgba(255,255,255,0.5)]",
        FRAME_WIDTHS[width],
      )}
    >
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[22px] bg-ink",
          portrait && "min-h-[560px]",
        )}
      >
        {/* The campus itself, dimmed rather than hidden. The card should
            still read as a photograph — that is what the content floats on. */}
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

        <div className={cn("relative flex flex-1 flex-col", className)}>{children}</div>
      </div>
    </div>
  );
}
