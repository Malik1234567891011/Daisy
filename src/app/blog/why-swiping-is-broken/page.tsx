import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Why Swiping Is Broken for Our Generation",
  description:
    "The psychology behind dating app fatigue. Why swiping leaves students feeling worse, and what research says about better alternatives like weekly matchmaking.",
};

export default function Article() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ivory bg-grain">
        <article className="section-container py-20 lg:py-28">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/blog"
              className="text-sm text-text-tertiary hover:text-sage transition-colors mb-8 inline-block"
            >
              &larr; Back to blog
            </Link>

            <header className="mb-12">
              <div className="flex items-center gap-3 text-xs text-text-tertiary mb-4">
                <time dateTime="2026-03">March 2026</time>
                <span aria-hidden="true">&middot;</span>
                <span>5 min read</span>
              </div>
              <h1 className="font-display text-3xl lg:text-4xl text-charcoal leading-tight">
                Why Swiping Is Broken for Our Generation
              </h1>
            </header>

            <div className="prose-daisy">
              <p>
                The average dating app user spends 90 minutes per day swiping. Over 10 hours a week
                &mdash; more time than most students spend on homework. And yet, the overwhelming
                majority of those swipes lead nowhere. No conversation, no date, no connection.
              </p>

              <p>
                Something is clearly broken. But to understand what, you have to understand how
                swiping actually works &mdash; not as a dating tool, but as a business model.
              </p>

              <h2>The Attention Trap of Dating Apps</h2>

              <p>
                Dating apps are built around one core metric: keeping you engaged. The same pattern
                shows up everywhere &mdash; endless feeds, streaks, nudges, and constant prompts to stay
                active. The longer you swipe, the less likely you are to step back and make an
                intentional choice about one real person.
              </p>

              <p>
                This creates a fundamental misalignment. An app that gets you off the app quickly is
                treated as less successful than one that keeps you returning every day. The incentive
                structure is designed to keep you searching, not finding.
              </p>

              <h2>The Paradox of Choice</h2>

              <p>
                Psychologist Barry Schwartz famously described the paradox of choice: when presented
                with too many options, people become less satisfied with whatever they choose, and
                often fail to choose at all. Dating apps are the ultimate expression of this paradox.
              </p>

              <p>
                When you can swipe through hundreds of profiles in an hour, each individual person
                becomes disposable. There is always someone else. The result is a culture of
                non-commitment &mdash; not because people do not want connection, but because the
                architecture of these apps discourages it.
              </p>

              <p>
                For students, this effect is amplified. You are already managing classes,
                extracurriculars, part-time jobs, and a social life. Adding an app that demands daily
                attention and delivers inconsistent results is not just ineffective &mdash; it is
                exhausting.
              </p>

              <h2>What the Research Says About Less Choice</h2>

              <p>
                Study after study shows that constrained choice leads to better outcomes. A Columbia
                University experiment found that people offered 6 options were 10 times more likely to
                make a choice than those offered 24. In dating terms: fewer, better options lead to
                more meaningful decisions.
              </p>

              <p>
                This is the principle behind weekly matchmaking. When you receive one match per week
                instead of an infinite feed, you actually engage with that person. You read their
                profile carefully. You consider compatibility rather than surface-level attraction. And
                if you meet up, you arrive with intention rather than obligation.
              </p>

              <h2>Swiping Fatigue Is Real</h2>

              <p>
                The term &ldquo;swiping fatigue&rdquo; has entered common vocabulary for a reason. A
                2024 survey found that 78% of Gen Z dating app users reported feeling &ldquo;burned
                out&rdquo; by the experience. The repetitive motion of swiping, the ghosting, the
                shallow conversations that go nowhere &mdash; it accumulates into genuine emotional
                exhaustion.
              </p>

              <p>
                What is interesting is that this fatigue does not reduce the desire for
                connection. People still want to meet someone. They just do not want to go through
                the current process to do it. The demand for an alternative is not theoretical &mdash;
                it is the most common thing students say when asked about their dating lives.
              </p>

              <h2>A Different Model</h2>

              <p>
                The solution is not to build a better swiping app. It is to eliminate swiping
                entirely. That is the approach behind services like{" "}
                <Link href="/" className="text-sage hover:text-olive underline underline-offset-4">
                  Daisy Weekly
                </Link>, which replaces infinite choice with a single, curated match each week.
              </p>

              <p>
                The mechanics are simple: fill out your profile once, then wait for Wednesday. Every
                week at 6 PM, you receive one match &mdash; someone chosen based on shared preferences,
                interests, and campus proximity. If you are both interested, you connect. If not,
                next week brings someone new.
              </p>

              <p>
                It is not revolutionary technology. It is a return to how dating used to feel:
                intentional, low-pressure, and focused on actual compatibility rather than who has the
                best photos. For students in Montreal juggling everything else in their lives, that
                simplicity is the entire point.
              </p>

              <p>
                Swiping culture is not going to fix itself. But you can opt out.{" "}
                <Link href="/onboarding" className="text-sage hover:text-olive underline underline-offset-4">
                  Try something different
                </Link>.
              </p>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
