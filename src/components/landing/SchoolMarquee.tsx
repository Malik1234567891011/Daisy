import { HERO } from "@/lib/constants";

/**
 * Continuously scrolling row of school wordmarks.
 *
 * The track is built from two identical halves and travels exactly -50%, so
 * the second half arrives where the first began and the loop never visibly
 * resets.
 *
 * Each half repeats the school list several times because seven names only
 * span ~800px — narrower than the viewport, which would open a gap mid-loop.
 * Repeating to roughly 2400px covers everything up to an ultrawide display.
 * Only the first list is exposed to assistive tech; the rest are decorative
 * duplicates.
 */
const REPEATS_PER_HALF = 3;

export default function SchoolMarquee() {
  const half = Array.from({ length: REPEATS_PER_HALF }, (_, i) => i);

  return (
    /* 400px window, centred — the same width as the enrol form, matching the
       reference. The names run past a narrow aperture rather than spanning
       the viewport. */
    <div className="marquee mx-auto w-full max-w-[400px]">
      <div className="marquee-track">
        {[0, 1].flatMap((copy) =>
          half.map((rep) => (
          <ul
            key={`${copy}-${rep}`}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 || rep > 0 || undefined}
          >
            {HERO.schools.map((school) => (
              <li
                key={school}
                className="px-4 font-display text-[32px] leading-none tracking-tight text-ivory/80"
              >
                {school}
              </li>
            ))}
          </ul>
          )),
        )}
      </div>
    </div>
  );
}
