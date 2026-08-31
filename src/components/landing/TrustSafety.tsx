import { SAFETY } from "@/lib/constants";

/**
 * Third chapter, over the aquarium photograph. Three claims in a row, each a
 * cut-out sitting straight on the picture — no plate, no card. The old glass
 * cards are gone: at this point in the page the backdrop is the darkest it
 * gets, and a frosted panel over it read as a hole rather than a surface.
 *
 * Only the heading keeps a plate, matching `HowItWorks` so the two section
 * lockups read as a pair.
 */

/**
 * Every cut-out is 264x260 with its own transparent margin, so a single fixed
 * box plus `object-contain` bottom-aligns the three without per-image nudges.
 * 200px is the reference's size, measured at a 1512px viewport.
 */
const ART_BOX = 200;

export default function TrustSafety() {
  return (
    <section id="safety" className="section-full text-ivory">
      <div className="section-container relative z-10 w-full py-24">
        <h2 className="mx-auto w-fit bg-ink px-5 py-1.5">
          <span className="font-display text-[clamp(1.75rem,2.65vw,2.5rem)] leading-none text-ivory">
            {SAFETY.heading.lead}
          </span>
          <span className="font-display text-[clamp(1.75rem,2.65vw,2.5rem)] leading-none text-bloom">
            {SAFETY.heading.accent}
          </span>
        </h2>

        <ul className="mx-auto mt-16 grid gap-14 sm:grid-cols-3 sm:gap-8">
          {SAFETY.items.map((item) => (
            <li key={item.label} className="reveal text-center">
              <img
                src={item.art}
                alt=""
                width={264}
                height={260}
                loading="lazy"
                decoding="async"
                style={{ height: ART_BOX, width: ART_BOX }}
                className="reveal-late mx-auto object-contain"
              />

              <p className="mt-8 text-[22px] leading-none text-ivory/70">
                {item.label}
              </p>

              <h3 className="mt-4 font-display text-[clamp(1.75rem,2.9vw,2.75rem)] leading-[1.17] text-ivory">
                {item.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
