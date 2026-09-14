"use client";

import { Heart } from "lucide-react";

/**
 * A short fall of gold, ivory and sage pieces over the mutual-match hero.
 * Positions and timings are derived from the index rather than Math.random
 * so every render agrees with the last. Decorative only: hidden from
 * assistive tech, never blocks a tap, and the parent unmounts it.
 *
 * Keyframes live in globals.css (`.confetti-*`).
 */

const COLOURS = ["#E8C77E", "#FFFDF7", "#B5C4AB", "#F4E4BC"];

const PIECES = Array.from({ length: 30 }, (_, i) => {
  const left = (i * 37) % 100;
  const delay = ((i * 53) % 900) / 1000;
  const duration = 2.2 + ((i * 29) % 12) / 10;
  const sway = ((i % 5) - 2) * 18;
  const size = 6 + (i % 3) * 2;
  return {
    heart: i % 6 === 0,
    style: {
      left: `${left}%`,
      width: size,
      height: i % 6 === 0 ? size + 4 : size * 1.6,
      backgroundColor: i % 6 === 0 ? undefined : COLOURS[i % COLOURS.length],
      color: COLOURS[i % COLOURS.length],
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      "--cf-sway": `${sway}px`,
      "--cf-spin": `${360 + (i % 4) * 180}deg`,
    } as React.CSSProperties,
  };
});

export default function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {PIECES.map((p, i) =>
        p.heart ? (
          <Heart key={i} className="confetti-piece" style={p.style} fill="currentColor" strokeWidth={0} />
        ) : (
          <span key={i} className="confetti-piece" style={p.style} />
        ),
      )}
    </div>
  );
}
