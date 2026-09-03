import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Best Dating Apps for Students in Montreal (2026)",
  description:
    "A real comparison of dating apps for Montreal students in 2026 — Tinder, Bumble, Hinge, and Daisy Weekly. Which one actually works for campus dating?",
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
                <span>6 min read</span>
              </div>
              <h1 className="font-display text-3xl lg:text-4xl text-charcoal leading-tight">
                Best Dating Apps for Students in Montreal (2026)
              </h1>
            </header>

            <div className="prose-daisy">
              <p>
                If you&apos;re a student in Montreal, you&apos;ve probably tried at least one dating app. Maybe
                all of them. And if you&apos;re reading this, none of them have worked the way you wanted.
                That&apos;s not your fault — most dating apps weren&apos;t designed with students in mind.
              </p>

              <p>
                Montreal is home to over 200,000 post-secondary students spread across McGill,
                Concordia, Université de Montréal, UQAM, HEC, and dozens of CEGEPs. The dating pool
                is massive, which should make things easier. But the paradox of choice is real, and most
                apps amplify it rather than solve it.
              </p>

              <p>
                Here&apos;s an honest breakdown of what&apos;s available in 2026 — what works, what
                doesn&apos;t, and which app actually fits your life as a student.
              </p>

              <h2>Tinder</h2>

              <p>
                Still the most downloaded dating app in Montreal. Tinder&apos;s strength is its sheer
                volume — everyone is on it, which means the widest possible pool. But that&apos;s also
                its biggest weakness. There&apos;s no student verification, no filtering by school, and
                the experience is overwhelmingly swipe-based. For students specifically, Tinder often
                feels more like a game than a genuine way to meet someone.
              </p>

              <p>
                <strong>Best for:</strong> Casual connections, high volume.
                <br />
                <strong>Worst for:</strong> Finding someone intentional, avoiding non-students.
              </p>

              <h2>Bumble</h2>

              <p>
                Bumble&apos;s core differentiator — women message first — is meaningful. The app also
                has Bumble BFF and Bumble Bizz, though most students ignore these. The quality of
                conversations tends to be slightly higher than Tinder, but the fundamental mechanic is
                still swiping. There&apos;s no campus-specific features, and matches expire after 24
                hours, which can feel stressful during midterms.
              </p>

              <p>
                <strong>Best for:</strong> Women who want more control over first contact.
                <br />
                <strong>Worst for:</strong> Anyone who doesn&apos;t want to manage yet another app
                during a busy semester.
              </p>

              <h2>Hinge</h2>

              <p>
                Hinge markets itself as &ldquo;designed to be deleted,&rdquo; and it does encourage
                more thoughtful interactions than Tinder or Bumble. Prompts replace bio text, and you
                can like specific parts of someone&apos;s profile. For Montreal students, the experience
                is better — but still general-purpose. You&apos;ll encounter people of all ages and
                backgrounds, which may or may not be what you want.
              </p>

              <p>
                <strong>Best for:</strong> More intentional conversations, profile depth.
                <br />
                <strong>Worst for:</strong> Students looking specifically for other students.
              </p>

              <h2>Daisy Weekly</h2>

              <p>
                Full disclosure: this is us. But here&apos;s why we built Daisy specifically for this
                list.{" "}
                <Link href="/" className="text-sage hover:text-olive underline underline-offset-4">
                  Daisy Weekly
                </Link>{" "}
                is the only dating option in Montreal built exclusively for students. Every member is
                verified through their school. There&apos;s no swiping — you get one match every
                Wednesday, chosen based on your preferences, interests, and campus.
              </p>

              <p>
                The weekly cadence is intentional. Instead of spending 30 minutes a day swiping, you
                spend 2 minutes once a week deciding about one person. If you&apos;re both interested,
                Daisy reveals how to connect and suggests a place to meet — usually a café or spot near
                both of your campuses.
              </p>

              <p>
                <strong>Best for:</strong> Students who want campus-specific matching without the noise.
                <br />
                <strong>Worst for:</strong> People who want unlimited options (that&apos;s kind of the
                point).
              </p>

              <h2>The Bottom Line for Montreal Students</h2>

              <p>
                No dating app is perfect. Tinder gives you volume. Bumble gives women more control.
                Hinge gives you depth. But if you specifically want to meet other verified students in
                Montreal — without the endless swiping, without the algorithm games — that&apos;s
                exactly what{" "}
                <Link href="/onboarding" className="text-sage hover:text-olive underline underline-offset-4">
                  Daisy Weekly was built for
                </Link>.
              </p>

              <p>
                Whatever you choose, the key is intention. The apps that work best are the ones you use
                with a clear sense of what you&apos;re looking for. Montreal has no shortage of
                interesting people — the hard part is cutting through the noise to find them.
              </p>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
