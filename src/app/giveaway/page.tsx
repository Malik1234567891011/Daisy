import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { RAFFLE } from "@/lib/raffle";

export const metadata: Metadata = {
  title: "The $200 Date Giveaway",
  description:
    "How Daisy Weekly's relaunch giveaway works: who can enter, how entries are earned, and how the winner is chosen.",
};

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-8", className)}>
      <h2 className="font-body text-lg font-semibold text-text-primary mb-3">
        {title}
      </h2>
      <div className="space-y-3 text-text-secondary leading-relaxed font-body">
        {children}
      </div>
    </section>
  );
}

export default function GiveawayPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-ivory font-body">
        <div className="section-container py-10 md:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8">
              <Button href="/" variant="ghost" size="sm" className="-ml-2">
                ← Back to home
              </Button>
            </div>

            <header className="mb-10 border-b border-border-light pb-8">
              <h1 className="font-display text-3xl text-charcoal tracking-tight">
                Your next date is on us
              </h1>
              <p className="mt-3 text-text-secondary leading-relaxed">
                To mark Daisy Weekly coming back, one member is getting {RAFFLE.prizeBlurb}.
                Here is exactly how it works — no catch, no purchase, nothing to buy.
              </p>
            </header>

            <div className="pb-8">
              <Section title="The prize">
                <p>
                  One winner receives {RAFFLE.prizeBlurb} — up to $200 CAD toward a date in
                  Montreal, paid by us. We cover the bill directly or reimburse it; we do not
                  hand out cash, and the prize cannot be exchanged for money or transferred to
                  someone else.
                </p>
              </Section>

              <Section title="Who can enter">
                <p>
                  You must be 18 or older, currently enrolled at a university, college or CEGEP,
                  and a resident of Quebec. One account per person. Daisy team members and their
                  immediate families are not eligible.
                </p>
              </Section>

              <Section title="How to enter — free">
                <p>
                  Create a Daisy account and finish your profile. A profile counts once it has a
                  verified phone number and a photo, which is the same bar we use before showing
                  anyone to a match. That gives you <strong>one entry</strong>.
                </p>
                <p>
                  There is nothing to buy. Paid features on Daisy, such as rerolls, have no effect
                  on the draw and do not earn entries.
                </p>
              </Section>

              <Section title="How to get more entries">
                <p>
                  Your dashboard has a personal invite link. For every{" "}
                  <strong>{RAFFLE.referralsPerEntry} friends</strong> who join through it and
                  finish their own profile — verified number and photo — your name goes in{" "}
                  <strong>one more time</strong>.
                </p>
                <p>
                  So {RAFFLE.referralsPerEntry} friends is two entries in total,{" "}
                  {RAFFLE.referralsPerEntry * 2} is three, and so on. Your dashboard shows your
                  current count and how many more friends you need for the next one. Friends who
                  sign up but never finish their profile do not count.
                </p>
              </Section>

              <Section title="Closing date and the draw">
                <p>
                  Entries close on {RAFFLE.closesLabel}. The winner is selected at random from all
                  entries shortly afterwards, so more entries means better odds, not certainty.
                  Odds depend on how many people enter.
                </p>
                <p>
                  We contact the winner by text on the number they verified. If we cannot reach
                  them within 7 days, we draw again.
                </p>
              </Section>

              <Section title="Fair play">
                <p>
                  This only works if the referrals are real people. Duplicate accounts, fake
                  profiles, throwaway numbers, and anything automated will be removed, along with
                  the entries they earned. If we think an account is gaming the draw, we may
                  disqualify it.
                </p>
              </Section>

              <Section title="Questions" className="mb-0">
                <p>
                  Ask us at{" "}
                  <a
                    href="mailto:malik.shourbaji@gmail.com"
                    className="font-medium text-sage underline-offset-4 hover:underline"
                  >
                    malik.shourbaji@gmail.com
                  </a>
                  . This promotion is run by Daisy Weekly and is not sponsored or administered by
                  Instagram, Facebook, or any other platform.
                </p>
              </Section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
