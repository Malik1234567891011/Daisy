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
      <div className="mt-9 flex items-center justify-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bloom opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-bloom" />
        </span>
        <p className="eyebrow text-bloom">Matches are live</p>
      </div>
    );
  }

  return (
    <div className="mt-9 flex flex-col items-center">
      <p className="eyebrow text-ivory/40 mb-3">Next drop in</p>

      {/* tabular-nums so the seconds digit doesn't shift the whole row each tick */}
      <p className="font-display text-3xl sm:text-4xl text-ivory tabular-nums tracking-tight">
        {d > 0 && (
          <>
            <span>{d}</span>
            <span className="text-ivory/35 text-xl sm:text-2xl">d</span>
            <span className="mx-2 text-ivory/20 font-light">:</span>
          </>
        )}
        <span>{fmt(h)}</span>
        <span className="text-ivory/35 text-xl sm:text-2xl">h</span>
        <span className="mx-2 text-ivory/20 font-light">:</span>
        <span>{fmt(m)}</span>
        <span className="text-ivory/35 text-xl sm:text-2xl">m</span>
        <span className="mx-2 text-ivory/20 font-light">:</span>
        <span className="text-ivory/55">{fmt(s)}</span>
        <span className="text-ivory/30 text-xl sm:text-2xl">s</span>
      </p>

      <p className="text-xs text-ivory/35 mt-3 tracking-wide">
        {isFirstDrop ? "First drop: Wednesday, April 8" : "Every Wednesday at 6 PM"}
      </p>
    </div>
  );
}
