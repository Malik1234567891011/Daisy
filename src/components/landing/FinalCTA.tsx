import { FINAL_CTA } from "@/lib/constants";
import Button from "@/components/ui/Button";

function DecorativeDaisy({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Petals arranged radially */}
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse
          key={i}
          cx="32"
          cy="14"
          rx="6"
          ry="13"
          fill="currentColor"
          opacity={0.5}
          transform={`rotate(${i * 45} 32 32)`}
        />
      ))}
      {/* Center */}
      <circle cx="32" cy="32" r="7" fill="currentColor" opacity={0.7} />
    </svg>
  );
}

export default function FinalCTA() {
  return (
    <section className="relative py-20 lg:py-28 bg-sage-pale overflow-hidden">
      {/* Decorative elements */}
      <DecorativeDaisy className="absolute -top-8 -left-8 w-32 h-32 text-sage-light opacity-30" />
      <DecorativeDaisy className="absolute -bottom-6 -right-6 w-24 h-24 text-butter opacity-25" />
      <DecorativeDaisy className="absolute top-1/2 -right-12 w-20 h-20 text-sage-light opacity-15 hidden lg:block" />

      <div className="section-container relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-3xl lg:text-4xl text-charcoal">
            {FINAL_CTA.heading}
          </h2>
          <p className="text-text-secondary mt-4 leading-relaxed max-w-md mx-auto">
            {FINAL_CTA.subheading}
          </p>
          <div className="mt-8">
            <Button href="/onboarding" size="lg">
              {FINAL_CTA.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
