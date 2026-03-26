import { ShieldCheck } from "lucide-react";
import { HERO } from "@/lib/constants";
import Button from "@/components/ui/Button";
import HeroCountdown from "@/components/landing/HeroCountdown";

function HeroVisual() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:max-w-md" aria-hidden="true">
      {/* Soft ambient glow */}
      <div className="absolute -inset-8 bg-sage-pale/30 rounded-full blur-3xl" />

      {/* Profile card */}
      <div className="relative z-10 rounded-2xl bg-white border border-border-light/70 shadow-lg p-6 ml-4 lg:ml-0">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-sage-pale flex items-center justify-center flex-shrink-0">
            <span className="text-olive font-display text-lg">E</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-charcoal">Emma, 21</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
            </div>
            <p className="text-text-secondary text-sm mt-0.5">McGill &middot; Psychology</p>
            <div className="flex gap-2 mt-3">
              <span className="inline-flex items-center rounded-full bg-sage-pale/70 px-2.5 py-1 text-xs text-olive font-medium">
                Verified
              </span>
              <span className="inline-flex items-center rounded-full bg-butter-pale px-2.5 py-1 text-xs text-espresso font-medium">
                Campus match
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 h-px bg-border-light" />
        <p className="mt-4 text-text-tertiary text-[13px] leading-relaxed italic">
          &ldquo;Looking for someone genuine who likes long walks and good coffee.&rdquo;
        </p>
      </div>

      {/* Match notification */}
      <div className="relative z-20 -mt-5 mr-4 ml-auto w-[75%] rounded-2xl bg-butter-pale/80 border border-butter-light/80 shadow-md p-4 lg:mr-0 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-butter/60 flex items-center justify-center flex-shrink-0">
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

      {/* Floating badge */}
      <div className="absolute z-30 top-3 -right-2 lg:right-0 rounded-xl bg-white/90 border border-border-light/60 shadow-md p-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sage-pale flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-3 h-3 text-sage" />
          </div>
          <span className="text-[11px] text-text-secondary font-medium pr-0.5">School verified</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] lg:min-h-0 lg:py-28 flex items-center overflow-hidden bg-grain">
      {/* Warm gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-ivory via-ivory to-butter-pale/30" />

      {/* Subtle organic shape */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-sage-pale/20 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 -right-24 w-80 h-80 rounded-full bg-butter-pale/40 blur-3xl" aria-hidden="true" />

      <div className="section-container relative z-10 w-full py-16 sm:py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="text-center lg:text-left order-1">
            {/* Trust bar */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 mb-10">
              {HERO.trustBar.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs text-text-tertiary tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5 text-sage-muted flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>

            <h1 className="font-display text-[2.75rem] sm:text-5xl lg:text-[3.75rem] text-charcoal max-w-2xl mx-auto lg:mx-0 text-balance leading-[1.05]">
              {HERO.headline}
            </h1>

            <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto lg:mx-0 mt-5 leading-relaxed">
              {HERO.subheadline}
            </p>

            <HeroCountdown />

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mt-8">
              <Button href="/onboarding" size="lg">
                {HERO.cta}
              </Button>
              <Button href="#how-it-works" variant="secondary" size="lg">
                {HERO.ctaSecondary}
              </Button>
            </div>
          </div>

          <div className="order-2 lg:order-2 pt-4 lg:pt-0">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
