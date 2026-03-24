import { FINAL_CTA } from "@/lib/constants";
import Button from "@/components/ui/Button";

export default function FinalCTA() {
  return (
    <section className="relative py-24 lg:py-32 bg-sage-pale/40 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-sage-light/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-butter/15 blur-3xl" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="section-heading">
            {FINAL_CTA.heading}
          </h2>
          <p className="text-text-secondary mt-5 leading-relaxed max-w-md mx-auto">
            {FINAL_CTA.subheading}
          </p>
          <div className="mt-10">
            <Button href="/onboarding" size="lg">
              {FINAL_CTA.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
