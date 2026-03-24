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

  useEffect(() => {
    if (phase !== "bloom") return;
    const t1 = setTimeout(() => setPhase("exit"), HOLD_MS);
    const t2 = setTimeout(() => {
      setPhase("done");
      try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
    }, HOLD_MS + EXIT_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  const skip = useCallback(() => {
    if (phase === "bloom" || phase === "exit") {
      setPhase("done");
      try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
    }
  }, [phase]);

  if (phase === "check") return null;
  if (phase === "done") return <>{children}</>;

  const exiting = phase === "exit";

  return (
    <>
      {children}

      <div
        onClick={skip}
        aria-hidden="true"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ivory cursor-pointer select-none"
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
    </>
  );
}
