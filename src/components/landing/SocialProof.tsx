import { SOCIAL_PROOF } from "@/lib/constants";

const stats = [
  { value: SOCIAL_PROOF.campuses, label: SOCIAL_PROOF.campusLabel },
  { value: SOCIAL_PROOF.matches, label: SOCIAL_PROOF.matchLabel },
  { value: SOCIAL_PROOF.rating, label: SOCIAL_PROOF.ratingLabel },
];

export default function SocialProof() {
  return (
    <section className="py-8 sm:py-10 bg-cream/50">
      <div className="section-container">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Vertical divider between items on desktop */}
              {i > 0 && (
                <div
                  className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-10 bg-border"
                  aria-hidden="true"
                />
              )}
              <span className="font-display text-xl sm:text-2xl lg:text-3xl text-charcoal">
                {stat.value}
              </span>
              <span className="text-[10px] sm:text-xs text-text-tertiary uppercase tracking-wider mt-1 font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
