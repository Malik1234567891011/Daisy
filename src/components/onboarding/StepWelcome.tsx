"use client";

import { User, Heart, MessageCircle } from "lucide-react";
import DaisyLogo from "@/components/layout/DaisyLogo";
import Button from "@/components/ui/Button";

interface StepWelcomeProps {
  onNext: () => void;
}

const INFO_POINTS = [
  { icon: User, text: "Share a few basics about yourself" },
  { icon: Heart, text: "Tell us what you're looking for" },
  { icon: MessageCircle, text: "Choose how you'd like to connect" },
] as const;

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="flex flex-col items-center text-center pt-8 md:pt-16">
      <div className="mb-8">
        <DaisyLogo size="lg" />
      </div>

      <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
        Let&rsquo;s find your person.
      </h1>
      <p className="text-text-secondary text-base sm:text-lg mb-12 max-w-sm leading-relaxed">
        This takes about 2 minutes. We&rsquo;ll ask a few simple questions to
        find you a great match.
      </p>

      <div className="w-full max-w-xs space-y-4 mb-14">
        {INFO_POINTS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-4 text-left">
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-sage-pale/60 border border-sage-light/30">
              <Icon className="w-5 h-5 text-sage" strokeWidth={1.6} />
            </div>
            <span className="text-text-primary text-sm">{text}</span>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onNext} className="w-full max-w-xs">
        Let&rsquo;s go
      </Button>

      <p className="mt-7 text-sm text-text-tertiary">
        Already have an account?{" "}
        <Button variant="link" href="/login">
          Sign in
        </Button>
      </p>
    </div>
  );
}
