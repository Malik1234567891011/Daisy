import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import WhyDaisy from "@/components/landing/WhyDaisy";
import TrustSafety from "@/components/landing/TrustSafety";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import IntroAnimation from "@/components/landing/IntroAnimation";

export default function Home() {
  return (
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
  );
}
