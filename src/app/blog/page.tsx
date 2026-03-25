import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Blog — Student Dating Tips & Montreal Campus Life",
  description:
    "Articles about student dating in Montreal, campus life, and why weekly matchmaking is replacing dating apps for McGill, Concordia, and CEGEP students.",
};

const articles = [
  {
    slug: "best-dating-apps-students-montreal-2026",
    title: "Best Dating Apps for Students in Montreal (2026)",
    excerpt:
      "We compared every dating option available to Montreal students — from Tinder to Daisy Weekly — so you don't have to.",
    date: "March 2026",
    readTime: "6 min read",
  },
  {
    slug: "why-swiping-is-broken",
    title: "Why Swiping Is Broken for Our Generation",
    excerpt:
      "The psychology behind why dating apps leave you feeling worse, and what the research says about a better approach.",
    date: "March 2026",
    readTime: "5 min read",
  },
  {
    slug: "how-to-meet-people-mcgill-without-dating-apps",
    title: "How to Meet People at McGill Without Dating Apps",
    excerpt:
      "Practical, non-cringe ways to actually meet someone on campus — from clubs to coffee shops to weekly matchmaking.",
    date: "March 2026",
    readTime: "5 min read",
  },
];

export default function BlogIndex() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ivory bg-grain">
        <div className="section-container py-20 lg:py-28">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-display text-3xl lg:text-4xl text-charcoal mb-3">
              The Daisy Blog
            </h1>
            <p className="text-text-secondary text-lg mb-14">
              Thoughts on student dating, campus life, and building real connections in Montreal.
            </p>

            <div className="space-y-6">
              {articles.map((article) => (
                <Link key={article.slug} href={`/blog/${article.slug}`} className="block group">
                  <Card hover className="p-7 lg:p-8 transition-all duration-200">
                    <div className="flex items-center gap-3 text-xs text-text-tertiary mb-3">
                      <time>{article.date}</time>
                      <span aria-hidden="true">&middot;</span>
                      <span>{article.readTime}</span>
                    </div>
                    <h2 className="font-display text-xl text-charcoal group-hover:text-sage transition-colors duration-200 mb-2">
                      {article.title}
                    </h2>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {article.excerpt}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
