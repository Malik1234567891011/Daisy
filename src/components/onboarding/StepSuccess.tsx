"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

export default function StepSuccess() {
  const router = useRouter();
  const [phase, setPhase] = useState<"bloom" | "text" | "exit">("bloom");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(() => router.replace("/dashboard"), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  return (
    <>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-ivory"
        style={{
          opacity: phase === "exit" ? 0 : 1,
          transition: "opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute w-72 h-72 rounded-full bg-sage-pale/30 blur-3xl" aria-hidden="true" />

        <div className="relative flex flex-col items-center text-center px-6">
          {/* Blooming flower */}
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
            className="cinematic-flower"
          >
            {PETAL_ANGLES.map((angle, i) => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                <ellipse
                  cx="50"
                  cy="27"
                  rx="9"
                  ry="18"
                  fill="var(--color-sage)"
                  className="cinematic-petal"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              </g>
            ))}
            <circle
              cx="50"
              cy="50"
              r="8"
              fill="var(--color-butter)"
              className="cinematic-center"
            />
          </svg>

          {/* Text */}
          <h1
            className="cinematic-title font-display text-4xl sm:text-5xl text-charcoal mt-8"
          >
            You&rsquo;re in
          </h1>
          <p className="cinematic-sub text-text-secondary text-base sm:text-lg mt-3 max-w-xs leading-relaxed">
            We&rsquo;re preparing your first match.
          </p>
        </div>
      </div>

      <style>{`
        .cinematic-petal {
          opacity: 0;
          transform: scale(0.2);
          transform-origin: 50px 50px;
          animation: cin-petal 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes cin-petal {
          to { opacity: 0.7; transform: scale(1); }
        }

        .cinematic-center {
          opacity: 0;
          transform: scale(0);
          transform-origin: 50px 50px;
          animation: cin-center 400ms cubic-bezier(0.34, 1.4, 0.64, 1) 300ms forwards;
        }
        @keyframes cin-center {
          to { opacity: 1; transform: scale(1); }
        }

        .cinematic-flower {
          animation: cin-breathe 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes cin-breathe {
          0% { transform: scale(0.95); }
          40% { transform: scale(1); }
          100% { transform: scale(1.02); }
        }

        .cinematic-title {
          opacity: 0;
          transform: translateY(12px);
          animation: cin-fade-up 500ms cubic-bezier(0.16, 1, 0.3, 1) 550ms forwards;
        }

        .cinematic-sub {
          opacity: 0;
          transform: translateY(8px);
          animation: cin-fade-up 500ms cubic-bezier(0.16, 1, 0.3, 1) 700ms forwards;
        }

        @keyframes cin-fade-up {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cinematic-petal,
          .cinematic-center,
          .cinematic-flower,
          .cinematic-title,
          .cinematic-sub {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .cinematic-petal { opacity: 0.7 !important; }
        }
      `}</style>
    </>
  );
}
