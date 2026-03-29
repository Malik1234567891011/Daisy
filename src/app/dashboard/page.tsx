"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  Users, Send, Sparkles, User, Settings, Mail, Heart, X,
  MapPin, Clock, Bell, Calendar,
} from "lucide-react";
import { INTENTIONS, VIBES, IDEAL_HANGOUTS } from "@/lib/constants";

/* ─── Types ─── */
type UserData = {
  id: string;
  email: string;
  firstName: string | null;
  school: string | null;
  referralCode: string | null;
  referralCount: number;
  onboardingComplete: boolean;
  createdAt: string;
};

type MatchPartner = {
  firstName: string | null;
  age: number | null;
  school: string | null;
  photoUrl: string | null;
  intentions: string | null;
  vibe: string | null;
  interests: string[];
  idealHangout: string | null;
  contactMethod?: string | null;
  contactValue?: string | null;
};

type MeetingSpot = {
  name: string;
  type: string;
  neighborhood: string;
  description: string | null;
};

type MatchData = {
  hasMatch: boolean;
  matchId?: string;
  status?: string;
  myDecision?: string;
  isMutual?: boolean;
  dropDate?: string;
  partner?: MatchPartner;
  suggestedSpot?: MeetingSpot | null;
};

/* ─── Helpers ─── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const FIRST_DROP = new Date("2026-04-08T18:00:00");

function getNextDropDate(): Date {
  const now = new Date();
  if (now < FIRST_DROP) return FIRST_DROP;
  const wed = new Date(now);
  wed.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7 || 7));
  wed.setHours(18, 0, 0, 0);
  if (wed <= now) wed.setDate(wed.getDate() + 7);
  return wed;
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

function getLabel(list: { value: string; label: string }[], val: string | null): string {
  if (!val) return "";
  return list.find((i) => i.value === val)?.label ?? val;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-3xl sm:text-4xl text-charcoal leading-none">{value}</span>
      <span className="text-xs text-text-tertiary mt-1.5 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-40" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-sage" />
    </span>
  );
}

/* ─── Waitlist Dashboard ─── */
function WaitlistDashboard({ user, loading }: { user: UserData | null; loading: boolean }) {
  const greeting = useMemo(() => getGreeting(), []);
  const nextDrop = useMemo(() => getNextDropDate(), []);
  const countdown = useCountdown(nextDrop);
  const isFirstDrop = nextDrop.getTime() === FIRST_DROP.getTime();
  const displayName = user?.firstName?.trim() || "friend";
  const referralLink = user?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding?ref=${user.referralCode}`
    : null;

  const wedLabel = nextDrop.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="section-container py-12 sm:py-16">
      {/* Header */}
      <section className="mb-10 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-3">
          <PulsingDot />
          <span className="text-xs font-medium text-sage uppercase tracking-widest">You&rsquo;re in</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          {loading ? <Skeleton variant="heading" className="h-9 max-w-xs sm:h-10 mx-auto sm:mx-0" /> : <>{greeting}, {displayName}</>}
        </h1>
        <p className="mt-1.5 text-text-secondary max-w-md">
          We&rsquo;ll text you as soon as your match is ready. Matches drop weekly on Wednesdays.
        </p>
      </section>

      {/* News banner */}
      <div className="rounded-xl border border-sage-light/30 bg-sage-pale/20 px-5 py-4 mb-6 flex items-start gap-3">
        <Bell className="w-4.5 h-4.5 text-sage mt-0.5 shrink-0" strokeWidth={1.8} />
        <div>
          <p className="text-sm font-medium text-charcoal">
            {isFirstDrop ? `First matches drop ${wedLabel}` : `Next match drop: ${wedLabel}`}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {isFirstDrop
              ? "After that, new matches every Wednesday. We\u2019ll text you when yours is ready."
              : "You\u2019ll get a text when yours is ready."}
          </p>
        </div>
      </div>

      {/* Countdown */}
      <Card className="mb-6 text-center py-10 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-pale/20 via-transparent to-butter-pale/15" aria-hidden="true" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Calendar className="w-4 h-4 text-text-tertiary" strokeWidth={1.6} />
            <p className="text-sm font-medium text-text-secondary">
              {isFirstDrop ? `First drop: ${wedLabel}` : `Next drop: ${wedLabel}`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <CountdownUnit value={countdown.days} label="days" />
            <span className="text-2xl text-border-light font-light -mt-4">:</span>
            <CountdownUnit value={countdown.hours} label="hrs" />
            <span className="text-2xl text-border-light font-light -mt-4">:</span>
            <CountdownUnit value={countdown.minutes} label="min" />
          </div>
        </div>
      </Card>

      {/* Status + Invite */}
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <Card className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-sage-pale/60 border border-sage-light/30">
            <Sparkles className="w-5 h-5 text-sage" strokeWidth={1.6} />
          </div>
          <div>
            <h2 className="font-display text-lg text-charcoal mb-1">You&rsquo;re in the first wave</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Early sign-ups get matched first. Your profile is in queue and looking great.
            </p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-butter-pale/70 border border-butter-light/40">
            <Users className="w-5 h-5 text-espresso" strokeWidth={1.6} />
          </div>
          <div>
            <h2 className="font-display text-lg text-charcoal mb-1">Want your match faster?</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Invite friends from your school. More people means better, faster matches.
            </p>
            {referralLink && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(referralLink)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-olive transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Copy invite link
                </button>
                <span className="text-xs text-text-tertiary">
                  {user?.referralCount ?? 0} referral{user?.referralCount === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <section className="mb-12">
        <h2 className="font-display text-lg text-charcoal mb-5">While you wait</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card hover variant="outlined" className="group">
            <Link href="/profile" className="block">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-pale/60 text-sage border border-sage-light/30">
                  <User className="w-[18px] h-[18px]" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-sm font-medium text-charcoal group-hover:text-olive transition-colors">Edit profile</p>
                  <p className="text-xs text-text-tertiary">Update your info</p>
                </div>
              </div>
            </Link>
          </Card>
          <Card hover variant="outlined" className="group">
            <Link href="/preferences" className="block">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-butter-pale/70 text-espresso border border-butter-light/40">
                  <Settings className="w-[18px] h-[18px]" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-sm font-medium text-charcoal group-hover:text-olive transition-colors">Preferences</p>
                  <p className="text-xs text-text-tertiary">Refine your criteria</p>
                </div>
              </div>
            </Link>
          </Card>
          <Card hover variant="outlined" className="group">
            <Link href="/profile#contact" className="block">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream/70 text-espresso border border-border-light/50">
                  <Mail className="w-[18px] h-[18px]" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-sm font-medium text-charcoal group-hover:text-olive transition-colors">Contact info</p>
                  <p className="text-xs text-text-tertiary">How your match reaches you</p>
                </div>
              </div>
            </Link>
          </Card>
        </div>
      </section>

      <AccountSection user={user} loading={loading} />
    </div>
  );
}

/* ─── Match Dashboard ─── */
function MatchDashboard({
  match,
  onDecision,
  deciding,
}: {
  match: MatchData;
  onDecision: (d: "INTERESTED" | "DECLINED") => void;
  deciding: boolean;
}) {
  const partner = match.partner!;
  const tags = [
    partner.intentions && getLabel(INTENTIONS, partner.intentions),
    partner.vibe && getLabel(VIBES, partner.vibe),
    partner.idealHangout && getLabel(IDEAL_HANGOUTS, partner.idealHangout),
  ].filter(Boolean);

  const alreadyDecided = match.myDecision === "INTERESTED";

  return (
    <div className="section-container py-12 sm:py-16">
      <section className="mb-8 text-center">
        <p className="text-sm font-medium text-sage uppercase tracking-widest mb-2">Your match is here</p>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          Someone picked for you
        </h1>
      </section>

      {/* Match card */}
      <Card className="max-w-sm mx-auto mb-8 overflow-hidden">
        {partner.photoUrl ? (
          <div className="w-full aspect-[4/5] bg-cream overflow-hidden rounded-t-xl -mt-6 -mx-6 sm:-mt-7 sm:-mx-7 mb-5" style={{ width: "calc(100% + 3rem)" }}>
            <img src={partner.photoUrl} alt={partner.firstName ?? "Match"} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full aspect-square bg-cream flex items-center justify-center rounded-t-xl -mt-6 -mx-6 sm:-mt-7 sm:-mx-7 mb-5" style={{ width: "calc(100% + 3rem)" }}>
            <User className="w-16 h-16 text-text-tertiary/30" />
          </div>
        )}

        <h2 className="font-display text-2xl text-charcoal">
          {partner.firstName}{partner.age ? `, ${partner.age}` : ""}
        </h2>
        {partner.school && (
          <p className="text-sm text-text-secondary mt-0.5">{partner.school}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tags.map((tag) => (
              <span key={tag} className="text-xs bg-sage-pale/50 text-sage border border-sage-light/30 rounded-full px-3 py-1 font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {!alreadyDecided ? (
          <div className="flex gap-3 mt-6">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => onDecision("DECLINED")}
              disabled={deciding}
              className="flex-1"
            >
              <X className="w-4 h-4" />
              Not for me
            </Button>
            <Button
              size="lg"
              onClick={() => onDecision("INTERESTED")}
              disabled={deciding}
              className="flex-1"
            >
              <Heart className="w-4 h-4" />
              Interested
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-xl bg-sage-pale/30 border border-sage-light/30 px-4 py-3 text-center">
            <p className="text-sm font-medium text-sage">You said you&rsquo;re interested</p>
            <p className="text-xs text-text-tertiary mt-1">Waiting to see if they feel the same&hellip;</p>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─── Mutual Match Dashboard ─── */
function MutualDashboard({ match }: { match: MatchData }) {
  const partner = match.partner!;
  const spot = match.suggestedSpot;

  return (
    <div className="section-container py-12 sm:py-16">
      <section className="mb-8 text-center">
        <p className="text-sm font-medium text-sage uppercase tracking-widest mb-2">It&rsquo;s mutual</p>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          You matched with {partner.firstName}
        </h1>
        <p className="text-text-secondary mt-1.5">You both said yes. Here&rsquo;s how to connect.</p>
      </section>

      {/* Partner card with contact revealed */}
      <Card className="max-w-sm mx-auto mb-6">
        <div className="flex items-center gap-4 mb-4">
          {partner.photoUrl ? (
            <img src={partner.photoUrl} alt={partner.firstName ?? ""} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center">
              <User className="w-8 h-8 text-text-tertiary/30" />
            </div>
          )}
          <div>
            <h2 className="font-display text-xl text-charcoal">
              {partner.firstName}{partner.age ? `, ${partner.age}` : ""}
            </h2>
            {partner.school && <p className="text-sm text-text-secondary">{partner.school}</p>}
          </div>
        </div>

        {partner.contactMethod && partner.contactValue && (
          <div className="rounded-xl bg-sage-pale/30 border border-sage-light/30 px-4 py-3 mb-4">
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Reach out via {partner.contactMethod}</p>
            <p className="text-base font-medium text-charcoal">{partner.contactValue}</p>
          </div>
        )}
      </Card>

      {/* Meeting spot suggestion */}
      {spot && (
        <Card className="max-w-sm mx-auto mb-8">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-butter-pale/70 border border-butter-light/40">
              <MapPin className="w-4.5 h-4.5 text-espresso" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Suggested first spot</p>
              <h3 className="font-display text-lg text-charcoal">{spot.name}</h3>
              <p className="text-sm text-text-secondary">{spot.neighborhood}</p>
              {spot.description && (
                <p className="text-sm text-text-tertiary mt-1 leading-relaxed">{spot.description}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="max-w-sm mx-auto text-center">
        <p className="text-sm text-text-tertiary">
          Take it from here. Be kind, be yourself, and have fun.
        </p>
      </div>
    </div>
  );
}

/* ─── Account Section ─── */
function AccountSection({ user, loading }: { user: UserData | null; loading: boolean }) {
  return (
    <section>
      <h2 className="font-display text-lg text-charcoal mb-5">Account</h2>
      <Card variant="outlined">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm text-text-tertiary">Email</p>
            {loading || !user ? (
              <Skeleton className="mt-1 h-5 max-w-xs" />
            ) : (
              <p className="text-text-primary">{user.email}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border-light">
            <Button variant="ghost" size="sm" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </Button>
          </div>
          <button
            type="button"
            className={cn(
              "self-start text-sm text-error hover:underline underline-offset-4",
              "transition-colors duration-150 hover:text-error/80",
            )}
          >
            Delete account
          </button>
        </div>
      </Card>
    </section>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const { status } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") setLoading(false);
      return;
    }

    let cancelled = false;

    Promise.all([
      fetch("/api/user").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/match").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([userData, matchData]) => {
        if (cancelled) return;
        setUser(userData);
        setMatch(matchData);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [status]);

  const handleDecision = useCallback(
    async (decision: "INTERESTED" | "DECLINED") => {
      if (!match?.matchId) return;
      setDeciding(true);

      try {
        const res = await fetch("/api/match/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.matchId, decision }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Refresh match state
        const refreshed = await fetch("/api/match").then((r) => r.json());
        setMatch(refreshed);
      } catch {
        // Silently handle for now
      } finally {
        setDeciding(false);
      }
    },
    [match],
  );

  const isLoading = status === "loading" || loading;

  // Determine dashboard state
  const hasMatch = match?.hasMatch === true;
  const isMutual = match?.isMutual === true;
  const isDeclined = match?.status === "DECLINED";

  return (
    <div className="flex min-h-dvh flex-col bg-ivory bg-grain">
      <Navbar />
      <main className="flex-1">
        {isLoading ? (
          <div className="section-container py-16">
            <Skeleton variant="heading" className="h-10 max-w-xs mb-4" />
            <Skeleton className="h-5 max-w-sm mb-8" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : isMutual ? (
          <MutualDashboard match={match!} />
        ) : hasMatch && !isDeclined ? (
          <MatchDashboard match={match!} onDecision={handleDecision} deciding={deciding} />
        ) : (
          <WaitlistDashboard user={user} loading={isLoading} />
        )}
      </main>
      <Footer />
    </div>
  );
}
