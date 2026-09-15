import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollBackdrop from "@/components/landing/ScrollBackdrop";
import HeroEnroll from "@/components/landing/HeroEnroll";
import { HERO } from "@/lib/constants";
import { RAFFLE } from "@/lib/raffle";

export const metadata: Metadata = {
  title: "The $200 Date Giveaway",
  description:
    "How Daisy Weekly's relaunch giveaway works: who can enter, how entries are earned, and how the winner is chosen.",
};

/**
 * Same build as the homepage: a floating bar over pinned photographs, a
 * full-screen opening with the enrol form, and a scalloped seam into the
 * chapter that carries the rules. The rules themselves are laid out the way
 * the FAQ is — heading parked on the left, numbered entries down the right —
 * so the two pages read as one site rather than a brochure and a contract.
 */

function EmailLink({ address }: { address: string }) {
  return (
    <a
      href={`mailto:${address}`}
      className="font-medium text-bloom underline-offset-4 transition-colors hover:text-bloom-soft hover:underline"
    >
      {address}
    </a>
  );
}

const RULES: { title: string; body: React.ReactNode }[] = [
  {
    title: "The prize",
    body: (
      <p>
        One winner receives {RAFFLE.prizeBlurb} — up to $200 CAD toward a date in Montreal,
        paid by us. We cover the bill directly or reimburse it; we do not hand out cash, and
        the prize cannot be exchanged for money or transferred to someone else.
      </p>
    ),
  },
  {
    title: "Who can enter",
    body: (
      <p>
        You must be 18 or older, currently enrolled at a university, college or CEGEP, and a
        resident of Quebec. One account per person. Daisy team members and their immediate
        families are not eligible.
      </p>
    ),
  },
  {
    title: "How to enter — free",
    body: (
      <>
        <p>
          Create a Daisy account and finish your profile. A profile counts once it has a
          verified phone number and a photo, which is the same bar we use before showing anyone
          to a match. That gives you <strong className="text-ivory">one entry</strong>.
        </p>
        <p>
          There is nothing to buy. Paid features on Daisy, such as rerolls, have no effect on
          the draw and do not earn entries.
        </p>
      </>
    ),
  },
  {
    title: "How to get more entries",
    body: (
      <>
        <p>
          Your dashboard has a personal invite link. For every{" "}
          <strong className="text-ivory">{RAFFLE.referralsPerEntry} friends</strong> who join
          through it and finish their own profile — verified number and photo — your name goes
          in <strong className="text-ivory">one more time</strong>.
        </p>
        <p>
          So {RAFFLE.referralsPerEntry} friends is two entries in total,{" "}
          {RAFFLE.referralsPerEntry * 2} is three, and so on. Your dashboard shows your current
          count and how many more friends you need for the next one. Friends who sign up but
          never finish their profile do not count.
        </p>
      </>
    ),
  },
  {
    title: "Closing date and the draw",
    body: (
      <>
        <p>
          Entries close on {RAFFLE.closesLabel}. The winner is selected at random from all
          entries shortly afterwards, so more entries means better odds, not certainty. Odds
          depend on how many people enter.
        </p>
        <p>
          We contact the winner by text on the number they verified. If we cannot reach them
          within 7 days, we draw again.
        </p>
      </>
    ),
  },
  {
    title: "Fair play",
    body: (
      <p>
        This only works if the referrals are real people. Duplicate accounts, fake profiles,
        throwaway numbers, and anything automated will be removed, along with the entries they
        earned. If we think an account is gaming the draw, we may disqualify it.
      </p>
    ),
  },
  {
    title: "Questions",
    body: (
      <p>
        Ask us at <EmailLink address="hi@cielpm.ai" />. This promotion is run by
        Daisy Weekly and is not sponsored or administered by Instagram, Facebook, or any other
        platform.
      </p>
    ),
  },
];

export default function GiveawayPage() {
  return (
    <>
      <Navbar tone="over" />
      {/* Pulled under the floating bar, as on the homepage, so the photograph
          runs behind the navbar instead of starting below it. */}
      <main className="-mt-[var(--nav-h)] bg-ink">
        {/* Opening chapter: the promise, and the same enrol form as the hero
            so nobody has to go back to the homepage to act on it. A date
            scene rather than the campus — the page is about the night out. */}
        <ScrollBackdrop
          image="/campus/group2-bg.jpg"
          baseInk={0.04}
          wash="linear-gradient(180deg, rgba(40,44,110,0.3) 0%, rgba(30,34,90,0.18) 50%, rgba(20,24,15,0.62) 100%)"
          seamBottom
          z={20}
        >
          <section className="section-full text-ivory">
            <div className="section-container relative z-10 w-full pt-[calc(var(--nav-h)+4rem)] pb-24 text-center">
              <p className="eyebrow text-bloom">The relaunch giveaway</p>
              <h1 className="display-hero mt-5 text-ivory drop-shadow-[0_2px_24px_rgba(20,24,15,0.45)]">
                Your next date is on us
              </h1>
              <p className="mx-auto mt-7 max-w-md text-base leading-relaxed text-ivory/75 sm:text-lg">
                To mark Daisy Weekly coming back, one member is getting {RAFFLE.prizeBlurb}.
                No catch, no purchase, nothing to buy.
              </p>

              <div className="mt-11">
                <HeroEnroll />
              </div>

              <p className="mt-6 text-[13px] text-ivory/45">
                Entries close {RAFFLE.closesLabel} &middot; {HERO.schoolsNote}
              </p>
            </div>
          </section>
        </ScrollBackdrop>

        {/* The rules, set like the FAQ: sticky heading left, entries right. */}
        <ScrollBackdrop
          image="/campus/group4-bg.jpg"
          baseInk={0.06}
          wash="linear-gradient(180deg, rgba(28,40,90,0.34) 0%, rgba(24,34,80,0.2) 50%, rgba(20,24,15,0.66) 100%)"
          z={10}
          className="-mt-[20px]"
        >
          <section className="relative text-ivory">
            <div className="section-container relative z-10 grid w-full gap-12 py-28 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="eyebrow mb-5 text-bloom">How it works</p>
                <h2 className="display-lg text-ivory">The rules, in plain words</h2>
              </div>

              <ol className="border-t border-ivory/20">
                {RULES.map((rule, i) => (
                  <li
                    key={rule.title}
                    className="reveal grid gap-x-8 gap-y-3 border-b border-ivory/20 py-8 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1fr)]"
                  >
                    <span
                      className="font-display text-[22px] leading-none text-bloom sm:pt-1.5"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-[26px] leading-tight text-ivory sm:text-[28px]">
                        {rule.title}
                      </h3>
                      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ivory/70">
                        {rule.body}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </ScrollBackdrop>
      </main>
      <Footer />
    </>
  );
}
