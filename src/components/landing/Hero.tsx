import { HERO } from "@/lib/constants";
import HeroEnroll from "@/components/landing/HeroEnroll";
import SchoolMarquee from "@/components/landing/SchoolMarquee";

/**
 * Opening section. Transparent by design — the photograph, wash and dither
 * come from the ScrollBackdrop chapter this sits inside, so the image stays
 * pinned and softens as the reader moves past it.
 *
 * Content is pushed to the top and bottom rather than centred, so the
 * photograph carries the middle of the frame. Centring everything buried the
 * couple behind the enrol card and left dead grass underneath.
 */
export default function Hero() {
  return (
    <section className="section-full text-ivory">
      {/* Darkens the top for the headline and the lower third for the form,
          leaving the middle clear so the photograph breathes.
          It must land on zero at 100%: the hero and How It Works share one
          backdrop, so a scrim that stops at any visible opacity draws a hard
          line across the chapter exactly where the hero ends. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,18,42,0.55) 0%, rgba(16,18,42,0.12) 38%, rgba(16,18,42,0.34) 84%, rgba(16,18,42,0) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="section-container relative z-10 flex min-h-dvh w-full flex-col justify-between pt-[calc(var(--nav-h)+1.5rem)] pb-10 text-center">
        <div>
          {/* Lines stagger rather than arriving together — the second line
              lands as the first settles, which reads as one sentence being
              spoken instead of a block appearing. */}
          <h1 className="display-hero text-ivory drop-shadow-[0_2px_24px_rgba(20,24,15,0.45)]">
            {HERO.headlineLines.map((line, i) => (
              <span
                key={line}
                className="enter block"
                style={{ "--enter-delay": `${i * 140}ms` } as React.CSSProperties}
              >
                {line}
              </span>
            ))}
          </h1>

          <div
            className="enter mt-5 space-y-1 text-ivory/90"
            style={{
              fontSize: "clamp(1rem, 1.31vw, 1.5rem)",
              lineHeight: 1.25,
              "--enter-delay": "320ms",
            } as React.CSSProperties}
          >
            <p>{HERO.enrollNote}</p>
            <p>Join {HERO.studentCount} MTL students</p>
          </div>
        </div>

        <div>
          {/* Social proof as texture — a moving band of institutional weight
              rather than a list you stop and read. */}
          <div
            className="enter"
            style={{ "--enter-delay": "460ms" } as React.CSSProperties}
          >
            <SchoolMarquee />
            <p className="mt-2.5 text-[15px] text-ivory/60">{HERO.schoolsNote}</p>
          </div>

          <div
            className="enter mt-6"
            style={{ "--enter-delay": "600ms" } as React.CSSProperties}
          >
            <HeroEnroll />
          </div>
        </div>
      </div>
    </section>
  );
}
