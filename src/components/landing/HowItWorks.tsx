import { HOW_IT_WORKS } from "@/lib/constants";

/**
 * Second beat of the opening chapter. Shares the hero's pinned photograph,
 * which by this point has blurred out, so the steps read against soft colour.
 *
 * The four steps zigzag down an 860px track: each step is a full-width row
 * holding one 450px block, pushed left or right. The two positions overlap by
 * 40px horizontally, and every step after the first is pulled up 40px, so the
 * column reads as a single staggered ribbon rather than two separate lists.
 *
 * Badges and step artwork are cut-out WebP with alpha, so they drop straight
 * onto the backdrop with no plate behind them.
 */

/** Natural size of each cut-out, declared so the list can't reflow on decode. */
const STEP_ART = [
  { src: "/howitworks/how_it_works_1.webp", width: 1170, height: 336 },
  { src: "/howitworks/how_it_works_2.webp", width: 1170, height: 444 },
  { src: "/howitworks/how_it_works_3.webp", width: 1170, height: 360 },
  { src: "/howitworks/how_it_works_4.webp", width: 1170, height: 423 },
];

/**
 * Which side each step sits on, and the 40px lift that interleaves it with the
 * step above. Below md the track is narrower than the stagger needs, so every
 * step centres and the lift is dropped — the row gap takes over instead.
 *
 * Written out in full because Tailwind only sees class names it can read
 * literally; building these by interpolation would compile to nothing.
 */
const PLACEMENT = [
  "md:justify-start",
  "md:-mt-10 md:justify-end",
  "md:-mt-10 md:justify-start",
  "md:-mt-10 md:justify-end",
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-full text-ivory">
      <div className="section-container relative z-10 w-full py-24">
        {/* Boxed lockup with the last word in accent — the reference sets this
            as flat artwork; type keeps it responsive and translatable. */}
        <h2 className="mx-auto w-fit bg-ink px-5 py-1.5">
          <span className="font-display text-[clamp(2rem,4.4vw,3.5rem)] leading-none text-ivory">
            How Daisy{" "}
          </span>
          <span className="font-display text-[clamp(2rem,4.4vw,3.5rem)] leading-none text-bloom">
            works
          </span>
        </h2>

        {/* gap rather than space-y: the md negative margins have to win, and a
            space-y utility would outrank them on specificity. */}
        <ol className="mx-auto mt-14 flex w-full max-w-[860px] flex-col gap-14 md:mt-[88px] md:gap-0">
          {HOW_IT_WORKS.steps.map((step, i) => {
            const art = STEP_ART[i];

            return (
              <li
                key={step.number}
                className={`reveal flex justify-center ${PLACEMENT[i]}`}
              >
                <div className="w-full max-w-[450px] text-center">
                  {/* Baseline, not centre: centring the badge on the line box
                      drops it ~2.5px below the cap band, because the box
                      reserves descender space the heading's capitals never
                      use. Sitting it on the baseline makes the 28px badge read
                      as one more capital beside the 27px caps. */}
                  <div className="flex items-baseline justify-center gap-[2px]">
                    <img
                      src={`/howitworks/number_${i + 1}.webp`}
                      alt=""
                      aria-hidden="true"
                      width={45}
                      height={63}
                      loading="lazy"
                      decoding="async"
                      className="h-7 w-7 shrink-0 object-contain"
                    />
                    <h3 className="font-display text-[36px] leading-[1.17] text-ivory">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-[15px] leading-[1.17] text-ivory">
                    {step.description}
                  </p>

                  {/* Generated for Daisy, not borrowed. Ratios differ per step,
                      so each carries its own width/height. */}
                  <img
                    src={art.src}
                    alt=""
                    width={art.width}
                    height={art.height}
                    loading="lazy"
                    decoding="async"
                    className="reveal-late mt-3 w-full"
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
