import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOContent from "@/components/landing/SEOContent";

export const metadata: Metadata = {
  title: "About — Student Matchmaking in Montreal",
  description:
    "Learn how Daisy Weekly works. Weekly student matchmaking for McGill, Concordia, UdeM, and 25+ CEGEPs in Montreal. No swiping — one match every Wednesday.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ivory bg-grain">
        <SEOContent />
      </main>
      <Footer />
    </>
  );
}
