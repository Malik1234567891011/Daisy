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
import ScrollBackdrop from "@/components/landing/ScrollBackdrop";
import { FAQ_ITEMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Student Dating Montreal | One Match Every Wednesday — Daisy Weekly",
  description:
    "A smarter way to date in Montreal. One curated match every Wednesday for students at McGill, Concordia, UdeM, and 25+ CEGEPs. No swiping, no endless apps.",
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
        <Navbar tone="over" />
        {/* Slide the hero under the floating bar. The header is sticky, so it
            reserves its own height in flow; without this the hero starts
            below it instead of behind it. */}
        <main className="-mt-[var(--nav-h)] bg-ink">
          {/* Each chapter pins one photograph behind its sections and blurs it
              as you read past. Torn edges mark the hand-off between them. */}
          {/* This photograph already carries a blue grade, so it takes a much
              lighter wash than the untinted shots in the later chapters —
              multiplying the default over it crushes the image. */}
          {/* Chapter order follows the reference: campus first to say who
              this is for, then date scenes for the rest of the page. Each
              chapter tears its own bottom edge and the next is pulled up
              20px underneath, so the seam is made of the photograph below
              rather than a flat colour. Stacking descends so earlier
              chapters paint above later ones — without that the chapter
              below covers the edge instead of showing through it.

              All four photographs are already blue and dark, so the washes
              are far lighter than a raw daylight shot would need; multiplying
              a heavy indigo over them crushes the image. */}
          <ScrollBackdrop
            image="/campus/mcgill-campus.png"
            baseInk={0.02}
            wash="linear-gradient(180deg, rgba(46,50,120,0.16) 0%, rgba(34,38,96,0.12) 45%, rgba(20,24,15,0.58) 100%)"
            seamBottom
            z={40}
          >
            <Hero />
            <HowItWorks />
          </ScrollBackdrop>

          <ScrollBackdrop
            image="/campus/group2-bg.jpg"
            baseInk={0.04}
            wash="linear-gradient(180deg, rgba(40,44,110,0.3) 0%, rgba(30,34,90,0.18) 50%, rgba(20,24,15,0.62) 100%)"
            seamBottom
            z={30}
            className="-mt-[20px]"
          >
            <WhyDaisy />
          </ScrollBackdrop>

          <ScrollBackdrop
            image="/campus/group4-bg.jpg"
            baseInk={0.06}
            wash="linear-gradient(180deg, rgba(28,40,90,0.34) 0%, rgba(24,34,80,0.2) 50%, rgba(20,24,15,0.66) 100%)"
            seamBottom
            z={20}
            className="-mt-[20px]"
          >
            <TrustSafety />
            <FAQ />
          </ScrollBackdrop>

          <ScrollBackdrop
            image="/campus/group3-bg-moon2-mobile.webp"
            baseInk={0.05}
            wash="linear-gradient(180deg, rgba(34,40,104,0.3) 0%, rgba(26,32,84,0.2) 45%, rgba(20,24,15,0.7) 100%)"
            z={10}
            className="-mt-[20px]"
          >
            <FinalCTA />
          </ScrollBackdrop>

        </main>
        <Footer />
      </IntroAnimation>
    </>
  );
}
