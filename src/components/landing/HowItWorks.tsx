import { HOW_IT_WORKS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-ivory">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-14 lg:mb-18">
          <h2 className="font-display text-3xl lg:text-4xl text-charcoal">
            {HOW_IT_WORKS.heading}
          </h2>
          <p className="text-text-secondary mt-3 max-w-md mx-auto">
            {HOW_IT_WORKS.subheading}
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative grid md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-border"
            aria-hidden="true"
          />

          {HOW_IT_WORKS.steps.map((step, i) => (
            <Card
              key={i}
              hover
              className="relative text-center px-6 py-8 lg:py-10"
            >
              {/* Step number */}
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sage-pale text-sage font-display text-sm mb-5 relative z-10">
                {step.number}
              </div>

              <h3 className="font-display text-xl text-charcoal mb-2">
                {step.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
