import { HOW_IT_WORKS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-ivory bg-grain">
      <div className="section-container">
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="section-heading">
            {HOW_IT_WORKS.heading}
          </h2>
          <p className="section-subheading mt-4">
            {HOW_IT_WORKS.subheading}
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-border-light"
            aria-hidden="true"
          />

          {HOW_IT_WORKS.steps.map((step, i) => (
            <Card
              key={i}
              hover
              className="relative text-center px-6 py-10 lg:py-12"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-sage-pale/70 text-sage font-display text-sm mb-6 relative z-10 border border-sage-light/40">
                {step.number}
              </div>

              <h3 className="font-display text-xl text-charcoal mb-2.5">
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
