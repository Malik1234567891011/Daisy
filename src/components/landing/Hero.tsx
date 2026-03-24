import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO } from "@/lib/constants";
import Button from "@/components/ui/Button";

function DaisyPetal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 56"
      fill="none"
      className={cn("absolute opacity-[0.18]", className)}
      aria-hidden="true"
    >
      <ellipse
        cx="16"
        cy="28"
        rx="11"
        ry="26"
        fill="currentColor"
        transform="rotate(-12 16 28)"
      />
    </svg>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:max-w-md" aria-hidden="true">
      {/* Scattered daisy petals */}
      <DaisyPetal className="text-sage-light w-8 h-14 -top-4 left-6 rotate-[-30deg]" />
      <DaisyPetal className="text-butter-light w-6 h-10 top-8 -right-2 rotate-[25deg]" />
      <DaisyPetal className="text-sage-pale w-7 h-12 bottom-12 -left-3 rotate-[50deg]" />
      <DaisyPetal className="text-butter w-5 h-9 -bottom-2 right-10 rotate-[-15deg] opacity-[0.12]" />

      {/* Profile card */}
      <div className="relative z-10 rounded-2xl bg-white border border-border-light shadow-lg p-5 ml-4 lg:ml-0">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-sage-pale flex items-center justify-center flex-shrink-0">
            <span className="text-olive font-display text-lg">E</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-charcoal">Emma, 21</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
            </div>
            <p className="text-text-secondary text-sm mt-0.5">McGill · Psychology</p>
            <div className="flex gap-2 mt-3">
              <span className="inline-flex items-center rounded-full bg-sage-pale px-2.5 py-0.5 text-xs text-olive font-medium">
                Verified
              </span>
              <span className="inline-flex items-center rounded-full bg-butter-pale px-2.5 py-0.5 text-xs text-espresso font-medium">
                Campus match
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 h-px bg-border-light" />
        <p className="mt-3 text-text-tertiary text-xs leading-relaxed">
          "Looking for someone genuine who likes long walks and good coffee."
        </p>
      </div>

      {/* Match notification card */}
      <div className="relative z-20 -mt-6 mr-4 ml-auto w-[75%] rounded-xl bg-butter-pale border border-butter-light shadow-md p-4 lg:mr-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-butter flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 20 20" className="w-4 h-4 text-espresso" fill="currentColor" aria-hidden="true">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          </div>
          <div>
            <p className="font-display text-base text-charcoal">It&apos;s a match</p>
            <p className="text-text-secondary text-xs mt-0.5">You and Emma have been paired</p>
          </div>
        </div>
      </div>

      {/* Small floating detail card */}
      <div className="absolute z-30 top-4 -right-2 lg:right-0 w-36 rounded-lg bg-white border border-border-light shadow-sm p-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sage-pale flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-3 h-3 text-sage" />
          </div>
          <span className="text-[11px] text-text-secondary font-medium">School verified</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] lg:min-h-0 lg:py-24 flex items-center overflow-hidden bg-gradient-to-b from-ivory via-ivory to-butter-pale/40">
      <div className="section-container w-full py-16 sm:py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content column */}
          <div className="text-center lg:text-left order-1">
            {/* Trust bar */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-4 gap-y-2 mb-8">
              {HERO.trustBar.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-text-secondary">
                  <ShieldCheck className="w-3.5 h-3.5 text-sage flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-charcoal max-w-2xl mx-auto lg:mx-0 text-balance leading-[1.1]">
              {HERO.headline}
            </h1>

            <p className="font-body text-lg text-text-secondary max-w-xl mx-auto lg:mx-0 mt-5 leading-relaxed">
              {HERO.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mt-8">
              <Button href="/onboarding" size="lg">
                {HERO.cta}
              </Button>
              <Button href="#how-it-works" variant="secondary" size="lg">
                {HERO.ctaSecondary}
              </Button>
            </div>
          </div>

          {/* Visual column */}
          <div className="order-2 lg:order-2 pt-4 lg:pt-0">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
