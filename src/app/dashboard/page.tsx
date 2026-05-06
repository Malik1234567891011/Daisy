"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  MapPin, Bell, Calendar,
} from "lucide-react";
import ProfilePhotoPicker from "@/components/profile/ProfilePhotoPicker";
import { INTENTIONS, VIBES, IDEAL_HANGOUTS } from "@/lib/constants";

/* ─── Types ─── */
type UserData = {
  id: string;
  email: string;
  firstName: string | null;
  school: string | null;
  referralCode: string | null;
  referralCount: number;
  phoneVerified: boolean;
  onboardingComplete: boolean;
  photoUrl: string | null;
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
  closedMatch?: { youDeclined: boolean };
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

function useSecondsCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
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

function CountdownUnitSm({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3rem]">
      <span className="font-display text-2xl sm:text-3xl text-charcoal leading-none tabular-nums">
        {value}
      </span>
      <span className="text-[10px] text-text-tertiary mt-1 uppercase tracking-widest">{label}</span>
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

/* ─── Match closed (calm retention, not rejection drama) ─── */
function MatchClosedDashboard({
  youDeclined,
  onBackToDashboard,
}: {
  youDeclined: boolean;
  onBackToDashboard: () => void;
}) {
  const nextDrop = useMemo(() => getNextDropDate(), []);
  const countdown = useSecondsCountdown(nextDrop);

  return (
    <div className="section-container py-12 sm:py-16 max-w-lg mx-auto">
      <section className="text-center sm:text-left mb-10">
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal text-balance">
          this match didn&rsquo;t work out
        </h1>
        <p className="mt-4 text-text-secondary leading-relaxed text-[15px] sm:text-base">
          {youDeclined ? (
            <>
              You passed on this one.
              <br />
              <span className="text-text-tertiary">
                no worries &mdash; you&rsquo;ll get a new match next wednesday.
              </span>
            </>
          ) : (
            <>
              they weren&rsquo;t interested this time.
              <br />
              <span className="text-text-tertiary">
                no worries &mdash; you&rsquo;ll get a new match next wednesday.
              </span>
            </>
          )}
        </p>
      </section>

      <Card className="mb-8 text-center py-8 sm:py-10 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-sage-pale/15 via-transparent to-butter-pale/10"
          aria-hidden="true"
        />
        <div className="relative z-10 px-2">
          <p className="text-sm font-medium text-text-secondary mb-5">next match in:</p>
          <div className="flex items-start justify-center gap-3 sm:gap-5 flex-wrap">
            <CountdownUnitSm value={countdown.days} label="days" />
            <span className="text-xl text-border-light font-light pt-1" aria-hidden="true">
              :
            </span>
            <CountdownUnitSm value={countdown.hours} label="hrs" />
            <span className="text-xl text-border-light font-light pt-1" aria-hidden="true">
              :
            </span>
            <CountdownUnitSm value={countdown.minutes} label="min" />
            <span className="text-xl text-border-light font-light pt-1" aria-hidden="true">
              :
            </span>
            <CountdownUnitSm value={countdown.seconds} label="sec" />
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto sm:min-w-[200px]"
          onClick={onBackToDashboard}
        >
          Back to dashboard
        </Button>
        <Button variant="ghost" size="lg" className="w-full sm:w-auto sm:min-w-[200px]" href="/profile">
          Edit your profile
        </Button>
      </div>
    </div>
  );
}

/* ─── Waitlist Dashboard ─── */
function WaitlistDashboard({
  user,
  loading,
  onPhotoUploaded,
}: {
  user: UserData | null;
  loading: boolean;
  onPhotoUploaded: (url: string) => void;
}) {
  const greeting = useMemo(() => getGreeting(), []);
  const nextDrop = useMemo(() => getNextDropDate(), []);
  const countdown = useCountdown(nextDrop);
  const isFirstDrop = nextDrop.getTime() === FIRST_DROP.getTime();
  const displayName = user?.firstName?.trim() || "friend";
  const referralLink = user?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding?ref=${user.referralCode}`
    : null;
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

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

      {/* Profile photo */}
      <Card className="mb-6">
        <ProfilePhotoPicker
          photoUrl={user?.photoUrl ?? null}
          onUploaded={onPhotoUploaded}
          disabled={loading || !user}
          variant="compact"
        />
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
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-olive transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Copy invite link
                    </>
                  )}
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

      <p className="max-w-sm mx-auto mt-8 text-center text-xs text-text-tertiary">
        <Link href="/profile#photo" className="font-medium text-sage hover:text-olive underline-offset-4 hover:underline">
          Update your profile photo
        </Link>
      </p>
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
        <p className="mt-6 text-xs text-text-tertiary">
          <Link href="/profile#photo" className="font-medium text-sage hover:text-olive underline-offset-4 hover:underline">
            Update your profile photo
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─── Account Section ─── */
function AccountSection({ user, loading }: { user: UserData | null; loading: boolean }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
      alert("Something went wrong. Please try again.");
    }
  }

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
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={cn(
                "self-start text-sm text-error hover:underline underline-offset-4",
                "transition-colors duration-150 hover:text-error/80",
              )}
            >
              Delete account
            </button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-error/20 bg-error/5 p-3">
              <p className="text-sm text-error font-medium">
                Are you sure? This permanently deletes your account and all data.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="rounded-md bg-error px-3 py-1.5 text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md border border-border-light px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-dim"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [matchClosedCalmDismissed, setMatchClosedCalmDismissed] = useState(false);

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
        if (userData && !userData.phoneVerified) {
          router.replace("/verify-phone");
          return;
        }
        setUser(userData);
        setMatch(matchData);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [status, router]);

  useEffect(() => {
    if (!match?.closedMatch) setMatchClosedCalmDismissed(false);
  }, [match?.closedMatch]);

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
  const showClosedMatch = !hasMatch && match?.closedMatch;
  const showMatchClosedCalm = showClosedMatch && !matchClosedCalmDismissed;

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
        ) : hasMatch ? (
          <MatchDashboard match={match!} onDecision={handleDecision} deciding={deciding} />
        ) : showMatchClosedCalm ? (
          <MatchClosedDashboard
            youDeclined={match!.closedMatch!.youDeclined}
            onBackToDashboard={() => setMatchClosedCalmDismissed(true)}
          />
        ) : (
          <WaitlistDashboard
            user={user}
            loading={isLoading}
            onPhotoUploaded={(url) =>
              setUser((prev) => (prev ? { ...prev, photoUrl: url } : null))
            }
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
