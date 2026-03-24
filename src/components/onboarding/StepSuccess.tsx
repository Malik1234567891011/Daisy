"use client";

import { CheckCircle, Search, MessageCircle } from "lucide-react";
import DaisyLogo from "@/components/layout/DaisyLogo";
import Button from "@/components/ui/Button";

const NEXT_STEPS = [
  { icon: CheckCircle, text: "We review your profile" },
  { icon: Search, text: "We find compatible matches" },
  { icon: MessageCircle, text: "We connect you on your terms" },
] as const;

export default function StepSuccess() {
  return (
    <div className="flex flex-col items-center text-center pt-8 md:pt-16">
      <div className="mb-8 opacity-60">
        <DaisyLogo size="md" />
      </div>

      <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
        You&rsquo;re in.
      </h1>
      <p className="text-text-secondary text-base sm:text-lg mb-12 max-w-sm leading-relaxed">
        We&rsquo;ll start looking for your match. When we find someone great,
        we&rsquo;ll let you know.
      </p>

      <div className="w-full max-w-xs mb-14">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-[0.12em] mb-6">
          What happens next
        </h3>
        <div className="space-y-4">
          {NEXT_STEPS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4 text-left">
              <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-sage-pale/60 border border-sage-light/30">
                <Icon className="w-5 h-5 text-sage" strokeWidth={1.6} />
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
  );
}
