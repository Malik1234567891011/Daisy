/**
 * The live reveal of the $200 date winners, shown over the dashboard.
 *
 * Everyone gets an SMS pointing at /dashboard. Anyone there before 11:58
 * watches the real countdown; anyone who opens it after 11:58 gets a short
 * five-second one so the reveal still lands. After `hideAfter` the overlay is
 * gone for good — delete this file and <GiveawayReveal /> once it has passed.
 *
 * The winner list stays on the server. The API only says whether *you* won,
 * and says nothing at all before `revealAt`.
 */

export const REVEAL = {
  /** 11:58am, Thursday Sept 24 2026, Montreal (EDT). */
  revealAt: "2026-09-24T15:58:00.000Z",
  /** End of Friday Sept 25 2026, Montreal (EDT). */
  hideAfter: "2026-09-26T04:00:00.000Z",
  /** How long before revealAt the overlay starts showing the countdown. */
  leadMs: 10 * 60 * 1000,
  /** Countdown for people who show up after revealAt. */
  lateCountdownSec: 5,
  instagram: "daisyweeklymtl",
} as const;

/** Navia and Tiffany, matched to each other on Sept 23. */
export const WINNER_IDS: readonly string[] = [
  "cmubr1g1i0004l604pa6xdtyr",
  "cmubs6pst0008l604ztren054",
];

export type RevealPhase = "early" | "countdown" | "live" | "off";

export function revealPhase(now: number = Date.now()): RevealPhase {
  const at = new Date(REVEAL.revealAt).getTime();
  if (now >= new Date(REVEAL.hideAfter).getTime()) return "off";
  if (now >= at) return "live";
  if (now >= at - REVEAL.leadMs) return "countdown";
  return "early";
}
