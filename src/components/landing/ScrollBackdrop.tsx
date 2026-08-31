"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scallop shape for the seam — the region that *stays*, meaning everything
 * above a wavy line. Masking a chapter with it carves rounded bites out of its
 * bottom edge so the next chapter rises through them as soft bumps.
 *
 * Elliptical arcs (rx 12, ry 10) rather than true semicircles: a half-circle
 * bump is as deep as it is wide and reads as a row of scallops, where the
 * reference is a shallower, flatter wave.
 *
 * sweep-flag 0, not 1. Between two points on the same horizontal, sweep 1
 * takes the lower half of the ellipse — which falls outside the shape and
 * leaves a straight edge. Sweep 0 takes the upper half and actually carves
 * the bite.
 */
const NOTCH = encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='20'>" +
    "<path d='M0 0 L48 0 L48 20 A 12 10 0 0 0 24 20 A 12 10 0 0 0 0 20 Z' fill='#000'/>" +
    "</svg>",
);

const SEAM_HEIGHT = 20;
const SEAM_TILE = 48;

interface ScrollBackdropProps {
  /** Path under /public. */
  image: string;
  /** Blur in px once the chapter has scrolled a full viewport. */
  maxBlur?: number;
  /** Base opacity of the ink layer before scroll darkening is added. */
  baseInk?: number;
  /** Sections that share this backdrop. */
  children: React.ReactNode;
  /** Colour wash laid over the photograph. */
  wash?: string;
  /**
   * Cut a torn edge into the bottom of this chapter. The next chapter is
   * pulled up underneath and shows through the notches, so the seam is made
   * of that chapter's actual photograph rather than a flat colour — which
   * never blends, because what it sits against is an image, not a fill.
   */
  seamBottom?: boolean;
  /** Stacking order. Earlier chapters must paint above later ones for the
   *  notches to reveal anything. */
  z?: number;
  className?: string;
}

const DEFAULT_WASH =
  "linear-gradient(180deg, rgba(72,68,168,0.52) 0%, rgba(58,60,150,0.40) 42%, rgba(28,32,70,0.62) 100%)";

/**
 * A "chapter": one photograph pinned behind several sections, softening as you
 * read past it.
 *
 * The backdrop is `sticky` rather than `fixed` so it is scoped to this chapter
 * automatically — a fixed layer would sit behind the entire page and need a
 * containing block hack to contain it. The negative margin pulls the content
 * back up over the pinned layer.
 */
export default function ScrollBackdrop({
  image,
  maxBlur = 26,
  baseInk = 0.1,
  wash = DEFAULT_WASH,
  seamBottom = false,
  z,
  className = "",
  children,
}: ScrollBackdropProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = chapterRef.current;
    if (!el) return;

    // Honour reduced-motion by never blurring.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const { top } = el.getBoundingClientRect();
      // 0 while the chapter starts on screen, 1 once a full viewport of it
      // has passed. Clamped so it holds at full blur for the rest.
      setProgress(Math.min(1, Math.max(0, -top / window.innerHeight)));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const blur = progress * maxBlur;

  const seamMask = seamBottom
    ? {
        maskImage: `linear-gradient(#000,#000), url("data:image/svg+xml,${NOTCH}")`,
        WebkitMaskImage: `linear-gradient(#000,#000), url("data:image/svg+xml,${NOTCH}")`,
        maskSize: `100% calc(100% - ${SEAM_HEIGHT}px), ${SEAM_TILE}px ${SEAM_HEIGHT}px`,
        WebkitMaskSize: `100% calc(100% - ${SEAM_HEIGHT}px), ${SEAM_TILE}px ${SEAM_HEIGHT}px`,
        maskPosition: "0 0, 0 100%",
        WebkitMaskPosition: "0 0, 0 100%",
        maskRepeat: "no-repeat, repeat-x",
        WebkitMaskRepeat: "no-repeat, repeat-x",
      }
    : undefined;

  return (
    <div
      ref={chapterRef}
      className={`relative ${className}`}
      style={{ ...(z !== undefined ? { zIndex: z } : {}), ...seamMask }}
    >
      <div className="sticky top-0 z-0 h-dvh -mb-[100dvh] overflow-hidden">
        {/* Scaled up slightly so blurring never exposes soft edges. */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${image}')`,
            filter: `blur(${blur}px)`,
            transform: `scale(${1.06 + progress * 0.06})`,
            willChange: "filter, transform",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 mix-blend-multiply" style={{ background: wash }} aria-hidden="true" />
        {/* Deepens as the photograph softens, so type keeps its contrast. */}
        <div
          className="absolute inset-0 bg-ink"
          style={{ opacity: baseInk + progress * 0.3 }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-halftone opacity-[0.85]" aria-hidden="true" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, rgba(255,253,247,0.16) 0.5px, transparent 0.6px)",
            backgroundSize: "3px 3px",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-grain opacity-60" aria-hidden="true" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
