import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { REVEAL, WINNER_IDS, revealPhase } from "@/lib/giveawayReveal";

/**
 * Whether the signed-in user won, but only once the reveal has happened.
 * Before revealAt the answer is withheld so nobody can read it off the network
 * tab. `serverNow` lets the client correct for a phone clock that is off.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const phase = revealPhase(now);
  const body: Record<string, unknown> = {
    phase,
    revealAt: REVEAL.revealAt,
    serverNow: now,
  };
  if (phase === "live") body.won = WINNER_IDS.includes(session.user.id);

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
