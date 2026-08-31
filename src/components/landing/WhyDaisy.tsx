import { WHY_DAISY } from "@/lib/constants";

/**
 * Opens the second chapter. Carries its argument in type rather than in cards
 * and icons, which keeps it quiet against the photograph behind it.
 */
export default function WhyDaisy() {
  return (
    <section className="section-full text-ivory">
      <div className="section-container relative z-10 w-full py-28">
        <div className="max-w-3xl">
          <p className="eyebrow text-bloom mb-6">Why Daisy</p>
          <h2 className="display-xl text-ivory reveal-blur">{WHY_DAISY.heading}</h2>
          <p className="mt-6 text-base sm:text-lg text-ivory/75 leading-relaxed max-w-xl">
            {WHY_DAISY.subheading}
          </p>
        </div>

        <dl className="mt-20 grid gap-x-14 gap-y-12 sm:grid-cols-2 max-w-5xl">
          {WHY_DAISY.points.map((point, i) => (
            <div key={point.title} className="reveal border-t border-ivory/20 pt-7">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-2xl text-bloom tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <dt className="font-display text-2xl text-ivory">{point.title}</dt>
              </div>
              <dd className="mt-3 text-[15px] leading-relaxed text-ivory/70">
                {point.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
