import { FINAL_CTA, HERO } from "@/lib/constants";
import HeroEnroll from "@/components/landing/HeroEnroll";

/**
 * Closing panel. Reuses the hero's enrol form on purpose — someone who read
 * the whole page shouldn't have to scroll back up to act, and a second
 * identical control is a familiar one rather than a new decision.
 */
export default function FinalCTA() {
  return (
    <section className="section-full text-ivory">
      <div className="section-container relative z-10 w-full py-24 text-center">
        <h2 className="display-hero text-ivory reveal-blur">{FINAL_CTA.heading}</h2>
        <p className="mt-7 text-base sm:text-lg text-ivory/75 max-w-md mx-auto leading-relaxed">
          {FINAL_CTA.subheading}
        </p>

        <div className="mt-11">
          <HeroEnroll />
        </div>

        <p className="mt-6 text-[13px] text-ivory/45">
          {HERO.schoolsNote} &middot; Join {HERO.studentCount} MTL students
        </p>
      </div>
    </section>
  );
}
