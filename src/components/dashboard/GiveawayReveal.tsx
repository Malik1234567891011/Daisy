"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import Confetti from "@/components/dashboard/Confetti";
import { REVEAL, type RevealPhase } from "@/lib/giveawayReveal";

/**
 * Full-screen reveal of the $200 date winners, over the dashboard.
 *
 * Before 11:58: the real countdown and a shaking heart. After: a short
 * countdown for latecomers, then the heart splits open on "you won" or
 * "not this time". Seen once per browser, then it stays out of the way.
 *
 * Preview locally with /dashboard?reveal=win or ?reveal=lose (dev only).
 * Keyframes live in globals.css (`.reveal-*`).
 */

const SEEN_KEY = "daisy-reveal-seen";

type Api = { phase: RevealPhase; revealAt: string; serverNow: number; won?: boolean };

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function HeartHalf({ side }: { side: "left" | "right" }) {
  return (
    <div className={cn("reveal-half absolute inset-0", `reveal-half-${side}`)}>
      <svg viewBox="0 0 32 29" className="h-full w-full">
        <defs>
          <linearGradient id={`reveal-g-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F08A98" />
            <stop offset="1" stopColor="#C2475A" />
          </linearGradient>
        </defs>
        <path
          fill={`url(#reveal-g-${side})`}
          d="M16 29 2.7 15.6A8.5 8.5 0 0 1 16 4.3a8.5 8.5 0 0 1 13.3 11.3Z"
        />
      </svg>
    </div>
  );
}

export default function GiveawayReveal({ firstName }: { firstName?: string | null }) {
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);
  const target = useRef(0);
  const offset = useRef(0);

  // Decide whether to show at all, and what we are counting down to.
  useEffect(() => {
    let cancelled = false;

    const preview =
      process.env.NODE_ENV === "development"
        ? new URLSearchParams(window.location.search).get("reveal")
        : null;
    if (preview === "win" || preview === "lose") {
      target.current = Date.now() + REVEAL.lateCountdownSec * 1000;
      setWon(preview === "win");
      setOpen(true);
      return;
    }

    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {}

    fetch("/api/giveaway/reveal", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Api>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        offset.current = data.serverNow - Date.now();
        if (data.phase === "countdown") {
          target.current = new Date(data.revealAt).getTime() - offset.current;
          setOpen(true);
        } else if (data.phase === "live") {
          target.current = Date.now() + REVEAL.lateCountdownSec * 1000;
          setWon(Boolean(data.won));
          setOpen(true);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  // Tick the clock.
  useEffect(() => {
    if (!open) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((target.current - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [open]);

  // At zero, ask the server for the result if we don't have it yet. Retries
  // cover a phone clock that runs a second or two ahead of ours.
  useEffect(() => {
    if (left !== 0 || won !== null) return;
    let cancelled = false;
    let tries = 0;
    const ask = () =>
      fetch("/api/giveaway/reveal", { cache: "no-store" })
        .then((r) => r.json() as Promise<Api>)
        .then((data) => {
          if (cancelled) return;
          if (data.phase === "live") setWon(Boolean(data.won));
          else if (tries++ < 15) setTimeout(ask, 1000);
        })
        .catch(() => { if (!cancelled && tries++ < 15) setTimeout(ask, 1000); });
    ask();
    return () => { cancelled = true; };
  }, [left, won]);

  useEffect(() => {
    if (left !== 0 || won === null || revealed) return;
    setRevealed(true);
    try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
  }, [left, won, revealed]);

  // Keep the dashboard underneath from scrolling while this is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || left === null) return null;

  const final = left <= 10;
  const ig = REVEAL.instagram;

  // Portalled to <body>: the dashboard shell has a transformed ancestor,
  // which would otherwise pin this "fixed" layer inside the panel.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="$200 date giveaway reveal"
      className="fixed inset-0 z-[100] flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_50%_40%,#2a2f1f_0%,var(--color-ink)_65%)] px-4 py-10 text-center text-ivory"
    >
      {revealed && won && <Confetti />}

      <div className="flex w-full max-w-[520px] flex-col items-center gap-6">
        {!revealed && (
          <>
            <div>
              <p className="eyebrow text-bloom">Daisy Weekly · $200 date giveaway</p>
              <h1 className="mt-3 font-display text-ivory text-[clamp(28px,7vw,44px)] leading-[1.05]">
                The winner is revealed in
              </h1>
            </div>
            <div
              className={cn(
                "font-display text-[clamp(64px,20vw,120px)] leading-none tabular-nums",
                final && "reveal-pulse text-bloom",
              )}
              aria-live="polite"
            >
              {fmt(left)}
            </div>
          </>
        )}

        <div
          className={cn(
            "relative aspect-[10/9] w-[min(200px,50vw)]",
            revealed ? "reveal-open" : final ? "reveal-shake-hard" : "reveal-shake",
          )}
          aria-hidden="true"
        >
          <div className="reveal-glow absolute -inset-10 rounded-full" />
          <HeartHalf side="left" />
          <HeartHalf side="right" />
        </div>

        {revealed && (
          <div className="reveal-result flex w-full flex-col items-center gap-3.5">
            {won ? (
              <>
                <p className="eyebrow text-bloom">You won</p>
                <h1 className="font-display text-ivory text-[clamp(28px,7vw,44px)] leading-[1.05]">
                  {firstName ? `${firstName}, your` : "Your"} date is on us 🎉
                </h1>
                <p className="max-w-[380px] text-base leading-relaxed text-sage-light">
                  You and your match just won the $200 dinner. DM us on Instagram to claim it.
                </p>
                <a
                  href={`https://ig.me/m/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 block w-full max-w-[320px] rounded-full bg-bloom px-6 py-3.5 font-semibold text-ink"
                >
                  DM @{ig}
                </a>
              </>
            ) : (
              <>
                <p className="eyebrow text-bloom">Not this time</p>
                <h1 className="font-display text-ivory text-[clamp(28px,7vw,44px)] leading-[1.05]">
                  You didn’t win this one
                </h1>
                <p className="max-w-[380px] text-base leading-relaxed text-sage-light">
                  Follow @{ig} to hear about the next giveaway first.
                </p>
                <a
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 block w-full max-w-[320px] rounded-full bg-bloom px-6 py-3.5 font-semibold text-ink"
                >
                  Follow @{ig}
                </a>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 text-sm text-sage-light underline underline-offset-4"
            >
              Go to my dashboard
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
