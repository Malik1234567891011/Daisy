import { UserCheck, Eye, Flag, EyeOff } from "lucide-react";
import { SAFETY } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

const icons = [UserCheck, Eye, Flag, EyeOff];

export default function TrustSafety() {
  return (
    <section id="safety" className="py-20 lg:py-28 bg-ivory">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-14 lg:mb-18">
          <h2 className="font-display text-3xl lg:text-4xl text-charcoal">
            {SAFETY.heading}
          </h2>
          <p className="text-text-secondary mt-3 max-w-lg mx-auto leading-relaxed">
            {SAFETY.subheading}
          </p>
        </div>

        {/* Safety cards */}
        <div className="grid sm:grid-cols-2 gap-5 lg:gap-6 max-w-3xl mx-auto">
          {SAFETY.cards.map((card, i) => {
            const Icon = icons[i];
            return (
              <Card
                key={i}
                variant="outlined"
                className="p-6 lg:p-7 bg-sage-pale/30"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center mb-4 shadow-xs">
                  <Icon className="w-5 h-5 text-sage" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-lg text-charcoal mb-1.5">
                  {card.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {card.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
