import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import WhyDaisy from "@/components/landing/WhyDaisy";
import TrustSafety from "@/components/landing/TrustSafety";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import IntroAnimation from "@/components/landing/IntroAnimation";
import { FAQ_ITEMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Daisy Weekly — One Match Every Wednesday | Student Dating Montreal",
  description:
    "Daisy Weekly is a weekly student matchmaking service in Montreal. Every Wednesday, get one thoughtful match — no swiping, no algorithms. For McGill, Concordia, UdeM, and CEGEP students.",
  alternates: { canonical: "/" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <IntroAnimation>
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <WhyDaisy />
          <TrustSafety />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </IntroAnimation>
    </>
  );
}
