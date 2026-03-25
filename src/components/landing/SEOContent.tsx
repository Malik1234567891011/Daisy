import Link from "next/link";
import { SEO_CONTENT } from "@/lib/constants";

export default function SEOContent() {
  return (
    <section className="py-24 lg:py-32 bg-ivory bg-grain">
      <div className="section-container">
        <div className="max-w-2xl mx-auto space-y-20">
          {/* Student Dating in Montreal */}
          <article>
            <h2 className="font-display text-2xl lg:text-3xl text-charcoal mb-6">
              {SEO_CONTENT.studentDating.heading}
            </h2>
            {SEO_CONTENT.studentDating.paragraphs.map((p, i) => (
              <p key={i} className="text-text-secondary text-[15px] leading-relaxed mb-4 last:mb-0">
                {p}
              </p>
            ))}
          </article>

          {/* Why Weekly Matchmaking Works */}
          <article>
            <h2 className="font-display text-2xl lg:text-3xl text-charcoal mb-6">
              {SEO_CONTENT.whyWeekly.heading}
            </h2>
            {SEO_CONTENT.whyWeekly.paragraphs.map((p, i) => (
              <p key={i} className="text-text-secondary text-[15px] leading-relaxed mb-4 last:mb-0">
                {p}
              </p>
            ))}
          </article>

          {/* Who It's For */}
          <article>
            <h2 className="font-display text-2xl lg:text-3xl text-charcoal mb-8">
              {SEO_CONTENT.whoItsFor.heading}
            </h2>
            <div className="space-y-8">
              {SEO_CONTENT.whoItsFor.items.map((item, i) => (
                <div key={i}>
                  <h3 className="font-display text-lg text-charcoal mb-2">
                    {item.subtitle}
                  </h3>
                  <p className="text-text-secondary text-[15px] leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </article>

          {/* Why Daisy Is Different */}
          <article>
            <h2 className="font-display text-2xl lg:text-3xl text-charcoal mb-6">
              {SEO_CONTENT.whyDifferent.heading}
            </h2>
            {SEO_CONTENT.whyDifferent.paragraphs.map((p, i) => (
              <p key={i} className="text-text-secondary text-[15px] leading-relaxed mb-4 last:mb-0">
                {p}
              </p>
            ))}
            <div className="mt-8 pt-8 border-t border-border-light/50">
              <p className="text-text-secondary text-sm leading-relaxed">
                Daisy Weekly is available for students at{" "}
                <strong className="text-charcoal font-medium">McGill University</strong>,{" "}
                <strong className="text-charcoal font-medium">Concordia University</strong>,{" "}
                <strong className="text-charcoal font-medium">Université de Montréal</strong>,{" "}
                <strong className="text-charcoal font-medium">UQAM</strong>,{" "}
                <strong className="text-charcoal font-medium">HEC Montréal</strong>,{" "}
                and 25+ CEGEPs across the greater Montreal area.{" "}
                <Link href="/onboarding" className="text-sage hover:text-olive underline underline-offset-4 transition-colors">
                  Sign up now
                </Link>{" "}
                to get matched this Wednesday.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
