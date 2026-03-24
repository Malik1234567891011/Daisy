import { Target, MapPin, Lock, Shield } from "lucide-react";
import { WHY_DAISY } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

const icons = [Target, MapPin, Lock, Shield];

export default function WhyDaisy() {
  return (
    <section className="relative py-24 lg:py-32 bg-ivory-warm overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-sage-pale/15 blur-3xl -translate-y-1/2 translate-x-1/3" aria-hidden="true" />

      <div className="section-container relative z-10">
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="section-heading">
            {WHY_DAISY.heading}
          </h2>
          <p className="section-subheading mt-4">
            {WHY_DAISY.subheading}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 lg:gap-6 max-w-3xl mx-auto">
          {WHY_DAISY.points.map((point, i) => {
            const Icon = icons[i];
            return (
              <Card key={i} hover className="p-7 lg:p-8">
                <div className="w-11 h-11 rounded-xl bg-sage-pale/60 flex items-center justify-center mb-5 border border-sage-light/30">
                  <Icon className="w-5 h-5 text-sage" strokeWidth={1.6} />
                </div>
                <h3 className="font-display text-lg text-charcoal mb-2">
                  {point.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {point.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
