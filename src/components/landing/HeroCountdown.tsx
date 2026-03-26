"use client";

import { useState, useEffect } from "react";

const FIRST_DROP = new Date("2026-04-08T18:00:00");

function getTarget(): Date {
  const now = new Date();
  if (now < FIRST_DROP) return FIRST_DROP;
  const wed = new Date(now);
  wed.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7 || 7));
  wed.setHours(18, 0, 0, 0);
  if (wed <= now) wed.setDate(wed.getDate() + 7);
  return wed;
}

function fmt(n: number): string {
  return String(n).padStart(2, "0");
}

export default function HeroCountdown() {
  const [target] = useState(getTarget);
  const [diff, setDiff] = useState(() => Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, target.getTime() - Date.now());
      setDiff(remaining);
      if (remaining === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const isFirstDrop = target.getTime() === FIRST_DROP.getTime();
  const isLive = diff === 0;

  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);

  if (isLive) {
    return (
      <div className="mt-7 text-center lg:text-left">
        <p className="text-sm sm:text-base text-sage font-medium tracking-wide animate-pulse">
          Matches are live &#127804;
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7 text-center lg:text-left">
      <p className="text-[13px] sm:text-sm text-text-tertiary tracking-wide mb-1.5">
        Next drop in
      </p>
      <p className="font-display text-xl sm:text-2xl text-charcoal tracking-tight">
        {d > 0 && <><span>{d}d</span><span className="mx-1.5 text-border font-light">&middot;</span></>}
        <span>{fmt(h)}h</span>
        <span className="mx-1.5 text-border font-light">&middot;</span>
        <span>{fmt(m)}m</span>
        <span className="mx-1.5 text-border font-light">&middot;</span>
        <span className="text-text-tertiary">{fmt(s)}s</span>
      </p>
      <p className="text-xs text-text-tertiary mt-2.5 tracking-wide">
        {isFirstDrop ? "First drop: Wednesday, April 8" : "Every Wednesday at 6 PM"}
      </p>
    </div>
  );
}
