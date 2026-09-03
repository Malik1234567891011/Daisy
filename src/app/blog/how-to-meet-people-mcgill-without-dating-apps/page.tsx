import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "How to Meet People at McGill Without Dating Apps",
  description:
    "Practical ways to meet people at McGill University and across Montreal campuses — from clubs and study spots to weekly matchmaking services like Daisy.",
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
                How to Meet People at McGill Without Dating Apps
              </h1>
            </header>

            <div className="prose-daisy">
              <p>
                McGill University has over 40,000 students. Concordia adds another 46,000. Between
                lectures, libraries, downtown Montreal, and campus events, you&apos;re surrounded by
                interesting people every day. So why does meeting someone feel so hard?
              </p>

              <p>
                Part of it is logistics — everyone is busy, social circles calcify quickly, and
                approaching strangers has become socially fraught. But the bigger problem is that
                dating apps have trained us to outsource the entire process to a screen. The irony
                is that you&apos;re more likely to find a genuine connection by looking up from your
                phone.
              </p>

              <p>
                Here are some real, practical ways to meet people at McGill and across Montreal
                campuses — no swiping required.
              </p>

              <h2>1. Student Clubs and SSMU Activities</h2>

              <p>
                McGill has over 250 student clubs. That&apos;s not a typo. From niche academic
                societies to recreational sports to cultural organizations, there&apos;s a group for
                virtually every interest. The key advantage of clubs is context — you&apos;re meeting
                people around a shared activity, which eliminates the awkwardness of cold
                introductions.
              </p>

              <p>
                Don&apos;t join a club to find a date. Join one because you&apos;re genuinely
                interested. The connections that form naturally around shared passions are always more
                meaningful than forced ones. Some particularly social clubs include the Outing Club,
                debate societies, music ensembles, and the various cultural associations.
              </p>

              <h2>2. Study Spots and Third Places</h2>

              <p>
                There&apos;s a concept in sociology called &ldquo;third places&rdquo; — spaces that
                aren&apos;t your home or your workplace where community naturally forms. For students,
                these are cafés, libraries, and campus lounges. McGill&apos;s McLennan Library, the
                SSMU building, and Arts café are all places where people tend to be open to
                conversation.
              </p>

              <p>
                Off campus, Montreal&apos;s café culture is unmatched. Crew Collective, Pikolo,
                Dispatch Coffee, and dozens of spots in the Plateau and Mile End are filled with
                students during the week. Becoming a regular somewhere creates the kind of organic
                familiarity that apps can never replicate.
              </p>

              <h2>3. Intramural Sports and Fitness Classes</h2>

              <p>
                McGill&apos;s intramural sports program is one of the best in Canada. Whether
                it&apos;s soccer, basketball, volleyball, or ultimate frisbee, intramurals bring
                together students from different faculties who might never cross paths otherwise. The
                teams are casual enough that you don&apos;t need to be an athlete, but competitive
                enough that bonds form quickly.
              </p>

              <p>
                Similarly, the McGill gym and fitness classes at places like the Y or studios in the
                Plateau create recurring, low-pressure environments for meeting people. Consistency is
                the secret — showing up to the same class every week builds natural rapport.
              </p>

              <h2>4. Events, Parties, and Social Gatherings</h2>

              <p>
                This one seems obvious, but it&apos;s worth stating: going out works. Faculty
                parties, residence events, bar nights on Saint-Laurent, and house parties are still
                where most college students meet. The challenge is that these environments can feel
                chaotic and alcohol-dependent, which isn&apos;t everyone&apos;s style.
              </p>

              <p>
                If loud social events aren&apos;t your thing, look for smaller gatherings — dinner
                parties, game nights, or faculty mixers. The social pressure is lower, conversations
                go deeper, and you&apos;re more likely to actually remember the people you meet.
              </p>

              <h2>5. Through Friends (Still the #1 Method)</h2>

              <p>
                Despite the rise of apps, the most common way people end up in relationships is still
                through mutual friends. Your existing social network is your greatest asset. Tell your
                friends you&apos;re open to meeting someone. Accept invitations. Say yes to the group
                hangout even when you&apos;d rather stay home. The best connections often come from
                the least expected introductions.
              </p>

              <h2>6. Structured Matchmaking</h2>

              <p>
                Sometimes you want to meet someone outside your existing circles but don&apos;t want
                to download another dating app. That&apos;s the gap that services like{" "}
                <Link href="/" className="text-sage hover:text-olive underline underline-offset-4">
                  Daisy Weekly
                </Link>{" "}
                fill. Instead of swiping, you get one curated match every Wednesday — another verified
                student from a Montreal campus, chosen based on your actual preferences and interests.
              </p>

              <p>
                It&apos;s essentially what a mutual friend would do — introduce you to someone they
                think you&apos;d get along with — but at scale, and with the privacy of not having to
                ask anyone. If you&apos;re both interested, Daisy even suggests where to meet: a café
                near campus, a park between your schools, a quiet spot in the Plateau.
              </p>

              <h2>The Real Secret</h2>

              <p>
                Meeting people isn&apos;t about having the right app or being at the right party.
                It&apos;s about putting yourself in environments where connection can happen naturally.
                For McGill students — and Concordia, UdeM, and CEGEP students across Montreal — the
                city itself is the best dating app there is.
              </p>

              <p>
                But if you want a little help narrowing things down,{" "}
                <Link href="/onboarding" className="text-sage hover:text-olive underline underline-offset-4">
                  Daisy is here for that
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
