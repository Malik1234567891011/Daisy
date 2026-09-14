"use client";

import { Heart } from "lucide-react";

/**
 * The moment after "Interested": one big heart blooms in the middle of the
 * card and a ring of small ones scatters outward, then it all clears. Purely
 * decorative — the parent unmounts it after the animation runs — so it is
 * hidden from assistive tech and never blocks a tap.
 *
 * Keyframes live in globals.css (`.like-*`).
 */

const PETALS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * 360 + (i % 2 ? 12 : -8);
  const distance = 86 + (i % 3) * 22;
  return {
    "--like-angle": `${angle}deg`,
    "--like-dist": `${distance}px`,
    "--like-delay": `${(i % 4) * 45}ms`,
    "--like-size": `${12 + (i % 3) * 4}px`,
  } as React.CSSProperties;
});

export default function LikeBurst() {
  return (
    <div className="like-burst" aria-hidden="true">
      <div className="like-ring" />
      <Heart className="like-heart" fill="currentColor" strokeWidth={0} />
      {PETALS.map((style, i) => (
        <Heart key={i} className="like-petal" style={style} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  );
}
