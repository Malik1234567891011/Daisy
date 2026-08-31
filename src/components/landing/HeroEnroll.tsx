"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HERO } from "@/lib/constants";

/**
 * Email-first entry point. Capturing the address here rather than dropping
 * people straight into onboarding means the first screen they see is already
 * filled in — one less thing to type, and a committed first step.
 */
export default function HeroEnroll() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    // Deliberately not validating here. Onboarding owns that, and rejecting
    // someone at the hero is a bad first impression; an empty field just
    // sends them to the normal start.
    router.push(trimmed ? `/onboarding?email=${encodeURIComponent(trimmed)}` : "/onboarding");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass mx-auto w-full max-w-[400px] rounded-[32px] p-4 shadow-2xl"
    >
      <label htmlFor="hero-email" className="sr-only">
        School email address
      </label>
      <input
        id="hero-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={HERO.enrollPlaceholder}
        className="mx-auto block h-[46px] w-[calc(100%-2rem)] rounded-[20px] bg-ink/25 px-4 text-center text-sm text-ivory placeholder:text-ivory/60 outline-none transition focus:bg-ink/40"
      />
      <button
        type="submit"
        className="mt-4 h-12 w-full rounded-[28px] bg-ivory text-base font-bold text-ink transition-colors duration-200 hover:bg-bloom-soft active:scale-[0.99]"
      >
        {HERO.enrollCta}
      </button>
    </form>
  );
}
