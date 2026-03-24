import { UserCheck, Eye, Flag, EyeOff } from "lucide-react";
import { SAFETY } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

const icons = [UserCheck, Eye, Flag, EyeOff];

export default function TrustSafety() {
  return (
    <section id="safety" className="py-24 lg:py-32 bg-ivory bg-grain">
      <div className="section-container">
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="section-heading">
            {SAFETY.heading}
          </h2>
          <p className="section-subheading mt-4">
            {SAFETY.subheading}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 lg:gap-6 max-w-3xl mx-auto">
          {SAFETY.cards.map((card, i) => {
            const Icon = icons[i];
            return (
              <Card
                key={i}
                variant="outlined"
                className="p-7 lg:p-8 bg-sage-pale/15 border-sage-light/25"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-border-light/70 flex items-center justify-center mb-5 shadow-xs">
                  <Icon className="w-5 h-5 text-sage" strokeWidth={1.6} />
                </div>
                <h3 className="font-display text-lg text-charcoal mb-2">
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
