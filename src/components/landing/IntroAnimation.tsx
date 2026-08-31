"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "daisy_intro_seen";
const HOLD_MS = 1100;
const EXIT_MS = 600;
const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

export default function IntroAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<"check" | "bloom" | "exit" | "done">(
    "check"
  );

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setPhase("done");
        return;
      }
    } catch {
      setPhase("done");
      return;
    }
    requestAnimationFrame(() => setPhase("bloom"));
  }, []);

  /**
   * Each phase schedules only its own next step.
   *
   * Previously both timers were set together while in "bloom". The first one
   * moved the phase to "exit", which re-ran this effect and its cleanup
   * cancelled the second timer — so "done" never arrived, the overlay stayed
   * mounted at opacity 0, and it swallowed every click on the page.
   */
  useEffect(() => {
    if (phase === "bloom") {
      const t = setTimeout(() => setPhase("exit"), HOLD_MS);
      return () => clearTimeout(t);
    }
    if (phase === "exit") {
      const t = setTimeout(() => {
        setPhase("done");
        try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
      }, EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const skip = useCallback(() => {
    if (phase === "bloom" || phase === "exit") {
      setPhase("done");
      try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
    }
  }, [phase]);

  // Signals the page that the splash has cleared, so entrance animations can
  // start. Without this they would play behind the overlay and be over by the
  // time it lifts.
  useEffect(() => {
    if (phase === "done") document.documentElement.dataset.intro = "done";
  }, [phase]);

  const showOverlay = phase === "check" || phase === "bloom" || phase === "exit";
  const exiting = phase === "exit";

  return (
    <>
      {children}

      {showOverlay && (
        <div
          onClick={skip}
          aria-hidden="true"
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ivory select-none ${exiting ? "pointer-events-none cursor-default" : "cursor-pointer"}`}
          style={{
            opacity: exiting ? 0 : 1,
            transition: `opacity ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            pointerEvents: exiting ? "none" : "auto",
          }}
        >
          <div className="intro-logo flex flex-col items-center">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              aria-hidden="true"
            >
              {PETAL_ANGLES.map((angle, i) => (
                <g key={angle} transform={`rotate(${angle} 60 60)`}>
                  <ellipse
                    cx="60"
                    cy="33"
                    rx="11"
                    ry="22"
                    fill="var(--color-sage)"
                    className="intro-petal"
                    style={{ animationDelay: `${80 + i * 60}ms` }}
                  />
                </g>
              ))}
              <circle
                cx="60"
                cy="60"
                r="9"
                fill="var(--color-butter)"
                className="intro-center"
              />
            </svg>

            <span className="intro-name font-display text-charcoal text-3xl mt-4 tracking-tight">
              Daisy
            </span>
          </div>
        </div>
      )}

      {showOverlay && (
        <style>{`
          .intro-petal {
            opacity: 0;
            transform: scale(0.3);
            transform-origin: 60px 60px;
            animation: petal-in 550ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes petal-in {
            0%   { opacity: 0; transform: scale(0.3); }
            100% { opacity: 0.75; transform: scale(1); }
          }

          .intro-center {
            opacity: 0;
            transform: scale(0);
            transform-origin: 60px 60px;
            animation: center-in 450ms cubic-bezier(0.34, 1.4, 0.64, 1) 400ms forwards;
          }
          @keyframes center-in {
            0%   { opacity: 0; transform: scale(0); }
            100% { opacity: 1; transform: scale(1); }
          }

          .intro-name {
            opacity: 0;
            transform: translateY(8px);
            animation: name-in 450ms cubic-bezier(0.16, 1, 0.3, 1) 550ms forwards;
          }
          @keyframes name-in {
            0%   { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          .intro-logo {
            animation: logo-breathe 1800ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          @keyframes logo-breathe {
            0%   { transform: scale(0.97); }
            60%  { transform: scale(1); }
            100% { transform: scale(1); }
          }

          @media (prefers-reduced-motion: reduce) {
            .intro-petal,
            .intro-center,
            .intro-name,
            .intro-logo {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
            .intro-petal { opacity: 0.75 !important; }
          }
        `}</style>
      )}
    </>
  );
}
