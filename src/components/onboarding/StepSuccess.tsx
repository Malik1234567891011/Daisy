"use client";

import { CheckCircle, Search, MessageCircle } from "lucide-react";
import Button from "@/components/ui/Button";

const NEXT_STEPS = [
  { icon: CheckCircle, text: "We review your profile" },
  { icon: Search, text: "We find compatible matches" },
  { icon: MessageCircle, text: "We connect you on your terms" },
] as const;

function DaisyFlower() {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="daisy-bloom"
    >
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="40"
          cy="18"
          rx="8"
          ry="16"
          fill="currentColor"
          className="text-sage-light"
          opacity="0.8"
          transform={`rotate(${angle} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="10" className="fill-butter" />
    </svg>
  );
}

export default function StepSuccess() {
  return (
    <>
      <div className="flex flex-col items-center text-center pt-8 md:pt-16">
        <div className="mb-8">
          <DaisyFlower />
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
          You&rsquo;re in.
        </h1>
        <p className="text-text-secondary text-lg mb-10 max-w-sm">
          We&rsquo;ll start looking for your match. When we find someone great,
          we&rsquo;ll let you know.
        </p>

        <div className="w-full max-w-xs mb-12">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-5">
            What happens next
          </h3>
          <div className="space-y-4">
            {NEXT_STEPS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4 text-left">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-sage-pale">
                  <Icon className="w-5 h-5 text-olive" />
                </div>
                <span className="text-text-primary text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <Button size="lg" href="/dashboard" className="w-full">
            Go to your dashboard
          </Button>
          <Button
            variant="secondary"
            size="lg"
            href="/profile"
            className="w-full"
          >
            Edit your profile
          </Button>
        </div>
      </div>

      <style>{`
        .daisy-bloom {
          animation: daisy-bloom-pulse 4s ease-in-out infinite;
        }
        @keyframes daisy-bloom-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.06); opacity: 0.92; }
        }
        @media (prefers-reduced-motion: reduce) {
          .daisy-bloom { animation: none; }
        }
      `}</style>
    </>
  );
}
