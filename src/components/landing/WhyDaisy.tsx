import { Target, MapPin, Lock, Shield } from "lucide-react";
import { WHY_DAISY } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

const icons = [Target, MapPin, Lock, Shield];

export default function WhyDaisy() {
  return (
    <section className="py-20 lg:py-28 bg-ivory-warm">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-14 lg:mb-18">
          <h2 className="font-display text-3xl lg:text-4xl text-charcoal">
            {WHY_DAISY.heading}
          </h2>
          <p className="text-text-secondary mt-3 max-w-lg mx-auto leading-relaxed">
            {WHY_DAISY.subheading}
          </p>
        </div>

        {/* Points grid */}
        <div className="grid sm:grid-cols-2 gap-5 lg:gap-6 max-w-3xl mx-auto">
          {WHY_DAISY.points.map((point, i) => {
            const Icon = icons[i];
            return (
              <Card key={i} className="p-6 lg:p-7">
                <div className="w-10 h-10 rounded-xl bg-sage-pale flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-sage" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-lg text-charcoal mb-1.5">
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
