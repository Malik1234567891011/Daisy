"use client";

import { User, Heart, MessageCircle } from "lucide-react";
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
    <div className="flex flex-col items-center text-center">
      <h1 className="font-display text-[26px] text-charcoal mb-2.5">
        Let&rsquo;s find your person.
      </h1>
      <p className="text-text-secondary text-[15px] mb-7 max-w-sm leading-relaxed">
        This takes about 2 minutes. We&rsquo;ll ask a few simple questions to
        find you a great match.
      </p>

      <div className="w-full max-w-xs space-y-3 mb-8">
        {INFO_POINTS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-4 text-left">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-sage-pale/60 border border-sage-light/30">
              <Icon className="w-5 h-5 text-sage" strokeWidth={1.6} />
            </div>
            <span className="text-text-primary text-sm">{text}</span>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onNext} className="w-full max-w-xs">
        Let&rsquo;s go
      </Button>
    </div>
  );
}
