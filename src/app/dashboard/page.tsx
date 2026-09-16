"use client";

import { useEffect, useMemo, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  Users, Send, Sparkles, User, Settings, Mail, Heart, X,
  MapPin, Bell, Ticket, Check, Share2, AtSign, Phone, Copy,
  type LucideIcon,
} from "lucide-react";
import ProfilePhotoPicker from "@/components/profile/ProfilePhotoPicker";
import DashboardShell from "@/components/dashboard/DashboardShell";
import RerollTeaser from "@/components/dashboard/RerollTeaser";
import LikeBurst from "@/components/dashboard/LikeBurst";
import Confetti from "@/components/dashboard/Confetti";
import {
  Panel, PANEL_INSET, Eyebrow, PanelTitle, Muted, TextLink, Pill, IconTile,
  ActionRow, Notice, Tag, Countdown,
} from "@/components/dashboard/primitives";
import { INTENTIONS, VIBES, IDEAL_HANGOUTS } from "@/lib/constants";
import { parseIdealHangouts } from "@/lib/idealHangouts";
import { RAFFLE, isOpen, type RaffleStanding } from "@/lib/raffle";

/**
 * Relaunch draw standing.
 *
 * Leads with the entry count because that is the number people came for, then
 * shows the gap to the next one — a bare total gives no reason to act, and the
 * remainder is the whole point of the referral link sitting beside it.
 */
function RaffleCard({
  standing,
  loading,
}: {
  standing?: RaffleStanding;
  loading: boolean;
}) {
  const entries = standing?.entries ?? 0;
  const entered = entries > 0;
  const toNext = standing?.toNextEntry ?? RAFFLE.referralsPerEntry;
  const got = standing ? standing.qualifiedReferrals % RAFFLE.referralsPerEntry : 0;

  return (
    <Panel className="flex items-start gap-4">
      <IconTile icon={Ticket} tone="bloom" />
      <div className="min-w-0 flex-1">
        <PanelTitle className="text-[20px]">
          {entered ? "You’re in the draw" : "Finish your profile to enter"}
        </PanelTitle>

        {loading ? (
          <Skeleton className="mt-2 h-4 w-40" />
        ) : entered ? (
          <>
            <Muted className="mt-1.5">
              Your name is in{" "}
              <span className="font-medium text-ivory">
                {entries} time{entries === 1 ? "" : "s"}
              </span>{" "}
              for {RAFFLE.prizeBlurb}.
            </Muted>

            <div className="mt-3.5">
              <div className="mb-1.5 flex items-center justify-between text-[12px] text-white/50">
                <span>
                  {toNext} more friend{toNext === 1 ? "" : "s"} for another entry
                </span>
                <span aria-hidden="true">
                  {got}/{RAFFLE.referralsPerEntry}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={got}
                aria-valuemin={0}
                aria-valuemax={RAFFLE.referralsPerEntry}
                aria-label="Progress toward your next draw entry"
              >
                <div
                  className="h-full rounded-full bg-bloom transition-[width] duration-500"
                  style={{ width: `${(got / RAFFLE.referralsPerEntry) * 100}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <Muted className="mt-1.5">
            Verify your number and add a photo, and you’re entered for {RAFFLE.prizeBlurb}.
          </Muted>
        )}

        <p className="mt-3 text-[12px] text-white/50">
          Entries close {RAFFLE.closesLabel}.{" "}
          <TextLink href={RAFFLE.rulesHref}>How it works</TextLink>
        </p>
      </div>
    </Panel>
  );
}

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
  rerollCredits: number;
  createdAt: string;
  genderPreference?: string | null;
  raffle?: RaffleStanding;
};

type MatchPartner = {
  firstName: string | null;
  age: number | null;
  school: string | null;
  major?: string | null;
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
  address?: string | null;
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
  closedMatch?: { youDeclined: boolean; reason?: ClosedReason };
};

type ClosedReason = "you-declined" | "they-declined" | "rerolled";

type RerollProps = {
  genderPreference: string | null | undefined;
  seed?: string;
  onReroll: () => void;
  rerolling: boolean;
  rerollError: string | null;
  hasRerollCredit: boolean;
};

/* ─── Helpers ─── */
const FIRST_DROP = new Date("2026-04-08T18:00:00");

function getNextDropDate(): Date {
  const now = new Date();
  if (now < FIRST_DROP) return FIRST_DROP;
  const wed = new Date(now);
  // No `|| 7` here: on a Wednesday the offset is legitimately 0, and 0 is
  // falsy, so that guard used to skip the whole of drop day and count down
  // to the following week. The check below already rolls forward once 6pm
  // has actually passed.
  wed.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7));
  wed.setHours(18, 0, 0, 0);
  if (wed <= now) wed.setDate(wed.getDate() + 7);
  return wed;
}

function useCountdown(target: Date, everyMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
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

/* ─── Match closed (calm retention, not rejection drama) ─── */
const CLOSED_COPY: Record<ClosedReason, string> = {
  "you-declined": "You passed on this one.",
  "they-declined": "They weren’t interested this time.",
  // Their partner paid to swap. Nobody needs to hear that.
  rerolled: "This one didn’t pan out.",
};

function MatchClosedDashboard({
  reason,
  ...reroll
}: {
  reason: ClosedReason;
} & RerollProps) {
  const nextDrop = useMemo(() => getNextDropDate(), []);
  const c = useCountdown(nextDrop, 1000);

  return (
    <>
      <Panel className="text-center">
        <PanelTitle>This match didn&rsquo;t work out</PanelTitle>
        <Muted className="mt-2">
          {CLOSED_COPY[reason]}{" "}
          <span className="text-white/45">
            No worries &mdash; you&rsquo;ll get a new match next Wednesday.
          </span>
        </Muted>

        <p className="mt-6 text-[12px] uppercase tracking-[0.16em] text-white/50">Next match in</p>
        <Countdown
          className="mt-3"
          units={[
            { value: c.days, label: "days" },
            { value: c.hours, label: "hrs", pad: true },
            { value: c.minutes, label: "min", pad: true },
            { value: c.seconds, label: "sec", pad: true },
          ]}
        />
      </Panel>

      {/* The person who just passed is the one most likely to pay for a
          new match. Keep the offer in front of them. */}
      <RerollTeaser context="closed" {...reroll} />
    </>
  );
}

/* ─── Invite ─── */
function InviteCard({ user, raffleOpen }: { user: UserData | null; raffleOpen: boolean }) {
  const referralLink = user?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding?ref=${user.referralCode}`
    : null;
  const [copied, setCopied] = useState(false);
  // The share sheet is the natural way to send a link from a phone. Read
  // through a store so the server snapshot (false) and the first client
  // render agree, then the real value lands on hydration.
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

  const handleShare = useCallback(async () => {
    if (!referralLink) return;
    if (canShare) {
      try {
        await navigator.share({
          title: "Daisy Weekly",
          text: "One match every Wednesday. Join me on Daisy:",
          url: referralLink,
        });
        return;
      } catch {
        // Dismissed, or unsupported after all — fall through to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; nothing sensible to show.
    }
  }, [referralLink, canShare]);

  return (
    <Panel>
      <div className="flex items-start gap-3.5">
        <IconTile icon={Users} tone="bloom" />
        <div className="min-w-0 flex-1">
          <PanelTitle className="text-[20px]">
            {raffleOpen ? "Invite friends, get more entries" : "Want your match faster?"}
          </PanelTitle>
          <Muted className="mt-1.5">
            {raffleOpen
              ? `Every ${RAFFLE.referralsPerEntry} friends who join and finish their profile puts your name in one more time.`
              : "Invite friends from your school. More people means better, faster matches."}
          </Muted>
        </div>
      </div>
      {referralLink && (
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Pill tone="glass" onClick={handleShare} className="w-full sm:w-auto sm:min-w-[200px]">
            {copied ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                Copied!
              </>
            ) : canShare ? (
              <>
                <Share2 className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Share invite link
              </>
            ) : (
              <>
                <Send className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Copy invite link
              </>
            )}
          </Pill>
          <span className="text-center text-[13px] text-white/50 sm:text-left">
            {user?.referralCount ?? 0} referral{user?.referralCount === 1 ? "" : "s"} so far
          </span>
        </div>
      )}
    </Panel>
  );
}

/* ─── No match yet: the countdown to Wednesday ─── */
function StatusPanel() {
  const nextDrop = useMemo(() => getNextDropDate(), []);
  const c = useCountdown(nextDrop, 60_000);
  const isFirstDrop = nextDrop.getTime() === FIRST_DROP.getTime();
  const wedLabel = nextDrop.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
      <Panel className="text-center">
        <Eyebrow live className="justify-center">You&rsquo;re in</Eyebrow>
        <PanelTitle className="mt-3">
          {isFirstDrop ? "First matches drop" : "Next match drops"}
          <br />
          <span className="text-bloom">{wedLabel}</span>
        </PanelTitle>
        <Muted className="mx-auto mt-2 max-w-xs">
          {isFirstDrop
            ? "After that, new matches every Wednesday. We’ll text you when yours is ready."
            : "We’ll text you as soon as yours is ready."}
        </Muted>

        <Countdown
          className="mt-6"
          units={[
            { value: c.days, label: "days" },
            { value: c.hours, label: "hrs", pad: true },
            { value: c.minutes, label: "min", pad: true },
          ]}
        />

        <Notice icon={Bell} className="mt-6 text-left">
          Matches drop Wednesdays at 6pm. Keep your number verified so the text reaches you.
        </Notice>
      </Panel>
  );
}

/* ─── The everyday sections: always under whatever the match is doing ─── */
function EverydaySections({
  user,
  loading,
  onPhotoUploaded,
  heading,
}: {
  user: UserData | null;
  loading: boolean;
  onPhotoUploaded: (url: string) => void;
  /** Title of the quick-links panel, tuned to the match state above it. */
  heading: string;
}) {
  const raffleOpen = isOpen();

  return (
    <>
      {/* A quiet rule between the match and the rest, so the two don't read
          as one long list. */}
      <div className="my-1 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/12" />
        <span className="eyebrow text-white/45">Your account</span>
        <span className="h-px flex-1 bg-white/12" />
      </div>

      {/* Profile photo */}
      <Panel>
        <ProfilePhotoPicker
          photoUrl={user?.photoUrl ?? null}
          onUploaded={onPhotoUploaded}
          disabled={loading || !user}
          variant="compact"
        />
      </Panel>

      {raffleOpen ? (
        <RaffleCard standing={user?.raffle} loading={loading} />
      ) : (
        <Panel className="flex items-start gap-4">
          <IconTile icon={Sparkles} />
          <div className="min-w-0 flex-1">
            <PanelTitle className="text-[20px]">You&rsquo;re in the first wave</PanelTitle>
            <Muted className="mt-1.5">
              Early sign-ups get matched first. Your profile is in queue and looking great.
            </Muted>
          </div>
        </Panel>
      )}

      <InviteCard user={user} raffleOpen={raffleOpen} />

      {/* Quick actions */}
      <Panel>
        <PanelTitle className="text-[20px]">{heading}</PanelTitle>
        <div className="mt-4 flex flex-col gap-2.5">
          <ActionRow href="/profile" icon={User} title="Edit profile" subtitle="Update your info" />
          <ActionRow
            href="/preferences"
            icon={Settings}
            tone="bloom"
            title="Preferences"
            subtitle="Refine your criteria"
          />
          <ActionRow
            href="/profile/contact"
            icon={Mail}
            title="Contact info"
            subtitle="How your match reaches you"
          />
        </div>
      </Panel>

      <AccountSection user={user} loading={loading} />
    </>
  );
}

/* ─── Match Dashboard ─── */
function MatchDashboard({
  match,
  onDecision,
  deciding,
}: {
  match: MatchData;
  /** Resolves true once the server has the decision, false if it failed. */
  onDecision: (d: "INTERESTED" | "DECLINED") => Promise<boolean>;
  deciding: boolean;
}) {
  const partner = match.partner!;
  // "Not for me" is one tap from losing the week, so it asks once.
  const [confirmPass, setConfirmPass] = useState(false);
  // The yes is shown the instant it is tapped — the burst plays while the
  // request is in flight — and only rolled back if the server says no.
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(false), 1400);
    return () => clearTimeout(t);
  }, [burst]);

  async function handleInterested() {
    setLiked(true);
    setBurst(true);
    const ok = await onDecision("INTERESTED");
    if (!ok) {
      setLiked(false);
      setBurst(false);
    }
  }
  const tags = [
    partner.intentions && getLabel(INTENTIONS, partner.intentions),
    partner.vibe && getLabel(VIBES, partner.vibe),
    ...parseIdealHangouts(partner.idealHangout).map((h) =>
      getLabel(IDEAL_HANGOUTS, h),
    ),
  ].filter(Boolean);

  const waiting = liked || match.myDecision === "INTERESTED";
  const name = partner.firstName ?? "them";

  return (
    <>
      <p className="-mt-2 text-center text-[14px] text-white/70">
        {waiting ? `You said yes. Now it\u2019s ${name}\u2019s turn.` : "Someone picked for you."}
      </p>

      {/* Match card. The photograph runs to the panel's edges. */}
      <Panel flush className="relative overflow-hidden">
        {waiting && (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/60 px-3 py-1.5 text-[12px] font-semibold text-ivory backdrop-blur-md">
            <Heart className="h-3.5 w-3.5 text-bloom" fill="currentColor" strokeWidth={0} aria-hidden="true" />
            Liked
          </span>
        )}

        {/* The burst sits on the photograph, not the whole card, so the heart
            blooms over their face rather than over the seam below it. */}
        {partner.photoUrl ? (
          <div className="relative aspect-[4/5] max-h-[520px] w-full bg-ink-soft">
            <img
              src={partner.photoUrl}
              alt={partner.firstName ?? "Match"}
              className="h-full w-full object-cover"
            />
            {burst && <LikeBurst />}
          </div>
        ) : (
          <div className="relative flex aspect-square max-h-[360px] w-full items-center justify-center bg-ink-soft">
            <User className="h-16 w-16 text-white/20" aria-hidden="true" />
            {burst && <LikeBurst />}
          </div>
        )}

        <div className={PANEL_INSET}>
          <PanelTitle className="text-[28px]">
            {partner.firstName}{partner.age ? `, ${partner.age}` : ""}
          </PanelTitle>
          {partner.school && (
            <p className="mt-0.5 text-[14px] text-white/60">{partner.school}</p>
          )}

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}

          {waiting ? (
            /* Waiting on their answer. Reads as a state, not an alert: a
               breathing heart, who we're waiting on, and what happens next. */
            <div className="mt-6 rounded-[16px] border border-sage-light/25 bg-sage/15 px-4 py-5 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bloom/15">
                <Heart
                  className="like-waiting-heart h-6 w-6 text-bloom"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
              </span>
              <p className="mt-3 font-display text-[22px] leading-tight text-ivory">
                Waiting on {name}
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/65">
                They have until Wednesday to answer. We&rsquo;ll text you the moment they do.
              </p>
              <Eyebrow live className="mt-4 justify-center">
                Your yes is in
              </Eyebrow>
            </div>
          ) : confirmPass ? (
            <div className="mt-6 rounded-[14px] border border-white/12 bg-white/[0.05] px-4 py-3.5">
              <p className="text-[14px] leading-relaxed text-ivory">
                Pass on {partner.firstName ?? "this match"}? You won&rsquo;t get
                another match until Wednesday unless you reroll.
              </p>
              {/* Side by side only once both labels fit without clipping. */}
              <div className="mt-3.5 flex flex-col gap-2.5 min-[400px]:flex-row">
                <Pill
                  onClick={() => onDecision("DECLINED")}
                  disabled={deciding}
                  className="min-w-0 min-[400px]:flex-1"
                >
                  Yes, pass
                </Pill>
                <Pill
                  tone="glass"
                  onClick={() => setConfirmPass(false)}
                  disabled={deciding}
                  className="min-w-0 min-[400px]:flex-1"
                >
                  Cancel
                </Pill>
              </div>
            </div>
          ) : (
            /* Stacked on the narrowest phones, where two pills side by side
               clip their labels; the yes lands on top either way. */
            <div className="mt-6 flex flex-col gap-2.5 min-[400px]:flex-row-reverse">
              <Pill
                onClick={handleInterested}
                disabled={deciding}
                className="min-w-0 min-[400px]:flex-1 px-3"
              >
                <Heart className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Interested
              </Pill>
              <Pill
                tone="glass"
                onClick={() => setConfirmPass(true)}
                disabled={deciding}
                className="min-w-0 min-[400px]:flex-1 px-3"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Not for me
              </Pill>
            </div>
          )}
        </div>
      </Panel>

    </>
  );
}

/* ─── Mutual Match Dashboard ─── */

/* One piece of artwork per spot type. The database only knows four. */
const SPOT_ART: Record<string, string> = {
  cafe: "/spots/cafe.webp",
  park: "/spots/park.webp",
  food: "/spots/food.webp",
  bar: "/spots/bar.webp",
};
const SPOT_LABEL: Record<string, string> = {
  cafe: "Coffee",
  park: "A walk",
  food: "Food",
  bar: "Drinks",
};

const CONTACT_LABEL: Record<string, string> = {
  instagram: "Instagram",
  phone: "Phone",
  email: "Email",
};
const CONTACT_ICON: Record<string, LucideIcon> = {
  instagram: AtSign,
  phone: Phone,
  email: Mail,
};

/** The one-tap way to reach them, for whichever handle they gave. */
function contactLink(method: string, value: string): { href: string; label: string } | null {
  const v = value.trim();
  if (!v) return null;
  if (method === "instagram") {
    const handle = v
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/[/?].*$/, "");
    return handle ? { href: `https://instagram.com/${handle}`, label: "Open Instagram" } : null;
  }
  if (method === "phone") return { href: `sms:${v.replace(/[^\d+]/g, "")}`, label: "Send a text" };
  if (method === "email") return { href: `mailto:${v}`, label: "Send an email" };
  return null;
}

function MutualDashboard({ match }: { match: MatchData }) {
  const partner = match.partner!;
  const spot = match.suggestedSpot;
  const name = partner.firstName ?? "your match";

  // A few seconds of confetti on arrival, then the page settles.
  const [celebrate, setCelebrate] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setCelebrate(false), 3600);
    return () => clearTimeout(t);
  }, []);

  const [copied, setCopied] = useState(false);
  const copyContact = useCallback(async () => {
    if (!partner.contactValue) return;
    try {
      await navigator.clipboard.writeText(partner.contactValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked; the handle is on screen anyway.
    }
  }, [partner.contactValue]);

  const method = partner.contactMethod ?? "";
  const link = partner.contactValue ? contactLink(method, partner.contactValue) : null;
  const ContactIcon = CONTACT_ICON[method] ?? Mail;

  const hangouts = parseIdealHangouts(partner.idealHangout).map((h) => getLabel(IDEAL_HANGOUTS, h));
  const facts = [
    partner.intentions ? { label: "Looking for", value: getLabel(INTENTIONS, partner.intentions) } : null,
    partner.vibe ? { label: "Social energy", value: getLabel(VIBES, partner.vibe) } : null,
    hangouts.length ? { label: "Ideal hangout", value: hangouts.join(" · ") } : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  const mapsHref = spot
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${spot.name}, ${spot.address ?? spot.neighborhood}, Montréal`,
      )}`
    : null;

  return (
    <>
      <p className="-mt-2 text-center text-[14px] text-white/70">
        You both said yes. Go say hi.
      </p>

      {/* Hero: their photograph, full-bleed, with the name set into it. */}
      <Panel flush className="relative overflow-hidden">
        {celebrate && <Confetti />}

        <div className="relative aspect-[4/5] max-h-[520px] w-full bg-ink-soft">
          {partner.photoUrl ? (
            <img src={partner.photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-16 w-16 text-white/20" aria-hidden="true" />
            </div>
          )}
          <div
            className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[rgba(17,21,14,0.96)] via-[rgba(17,21,14,0.5)] to-transparent"
            aria-hidden="true"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-bloom px-3 py-1.5 text-[12px] font-bold text-ink shadow-[0_6px_20px_rgba(232,199,126,0.35)]">
            <Heart className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
            It&rsquo;s a match
          </span>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h2 className="font-display text-[36px] leading-none text-ivory">
              {partner.firstName}{partner.age ? `, ${partner.age}` : ""}
            </h2>
            {(partner.major || partner.school) && (
              <p className="mt-2 text-[14px] text-white/75">
                {[partner.major, partner.school].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className={PANEL_INSET}>
          <Eyebrow>Say hi</Eyebrow>
          {partner.contactValue ? (
            <>
              <div className="mt-3 flex items-center gap-3.5">
                <IconTile icon={ContactIcon} tone="bloom" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] uppercase tracking-[0.14em] text-white/50">
                    {CONTACT_LABEL[method] ?? "Contact"}
                  </p>
                  <p className="break-words text-[17px] font-medium leading-tight text-ivory">
                    {partner.contactValue}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyContact}
                  aria-label={copied ? "Copied" : "Copy"}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full liquid-glass bg-ivory/10 text-ivory transition-colors hover:bg-ivory/20"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-bloom" strokeWidth={2.2} aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  )}
                </button>
              </div>
              {link && (
                <Pill href={link.href} className="mt-4 w-full">
                  <ContactIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  {link.label}
                </Pill>
              )}
            </>
          ) : (
            <Muted className="mt-2">We&rsquo;ll text you both how to reach each other.</Muted>
          )}
        </div>
      </Panel>

      {/* Who they are, beyond the photo. */}
      {(facts.length > 0 || partner.interests.length > 0) && (
        <Panel>
          <Eyebrow>About {name}</Eyebrow>
          {facts.length > 0 && (
            <dl className="mt-2 divide-y divide-white/10">
              {facts.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="shrink-0 text-[13px] text-white/55">{f.label}</dt>
                  <dd className="text-right text-[15px] text-ivory">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {partner.interests.length > 0 && (
            <div className={facts.length > 0 ? "mt-3 border-t border-white/10 pt-4" : "mt-3"}>
              <p className="mb-2.5 text-[13px] text-white/55">Into</p>
              <div className="flex flex-wrap gap-1.5">
                {partner.interests.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* The first date, as a place rather than a line of text. */}
      {spot && (
        <Panel flush className="overflow-hidden">
          <div className="relative aspect-[16/10] w-full bg-ink-soft">
            <img
              src={SPOT_ART[spot.type] ?? SPOT_ART.cafe}
              alt=""
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[rgba(17,21,14,0.96)] via-[rgba(17,21,14,0.45)] to-transparent"
              aria-hidden="true"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/60 px-3 py-1.5 text-[12px] font-semibold text-ivory backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-bloom" strokeWidth={2} aria-hidden="true" />
              {SPOT_LABEL[spot.type] ?? "Date spot"} · {spot.neighborhood}
            </span>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <Eyebrow>Your first date</Eyebrow>
              <h3 className="mt-1.5 font-display text-[30px] leading-none text-ivory">{spot.name}</h3>
            </div>
          </div>
          <div className={PANEL_INSET}>
            {spot.description && <Muted className="text-[15px] text-white/75">{spot.description}</Muted>}
            {spot.address && <p className="mt-2 text-[13px] text-white/50">{spot.address}</p>}
            {mapsHref && (
              <Pill tone="glass" href={mapsHref} className="mt-4 w-full">
                <MapPin className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Open in Maps
              </Pill>
            )}
          </div>
        </Panel>
      )}

      <Muted className="text-center">Take it from here. Be kind, be yourself, and have fun.</Muted>
    </>
  );
}

/* ─── Account Section ─── */
function AccountSection({ user, loading }: { user: UserData | null; loading: boolean }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
      setDeleteError("Something went wrong. Please try again.");
    }
  }

  return (
    <Panel>
      <PanelTitle className="text-[20px]">Account</PanelTitle>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-white/50">Email</p>
          {loading || !user ? (
            <Skeleton className="mt-1.5 h-5 max-w-xs" />
          ) : (
            <p className="mt-0.5 break-all text-[15px] text-ivory">{user.email}</p>
          )}
        </div>

        <div className="border-t border-white/10 pt-4">
          <Pill
            tone="glass"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full sm:w-auto sm:min-w-[160px]"
          >
            Sign out
          </Pill>
        </div>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className={cn(
              "self-start py-1 text-[13px] text-error/90 underline-offset-4",
              "transition-colors duration-150 hover:text-error hover:underline",
            )}
          >
            Delete account
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-[14px] border border-error/30 bg-error/10 px-4 py-3.5">
            <p className="text-[14px] leading-relaxed text-ivory">
              Are you sure? This permanently deletes your account and all data.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-error px-4 text-[14px] font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50 sm:flex-none"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <Pill
                tone="glass"
                size="sm"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Pill>
            </div>
          </div>
        )}
        {deleteError && (
          <p className="text-[13px] text-error" role="alert">
            {deleteError}
          </p>
        )}
      </div>
    </Panel>
  );
}

/* ─── Loading ─── */
function LoadingDashboard() {
  return (
    <>
      <Panel className="flex flex-col items-center py-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton variant="heading" className="mt-4 h-7 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full" />
        <div className="mt-7 flex gap-6">
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-12 w-12" />
        </div>
      </Panel>
      <Panel className="flex items-center gap-4">
        <Skeleton variant="avatar" className="h-24 w-24 shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-4 w-48 max-w-full" />
        </div>
      </Panel>
      <Panel>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </Panel>
    </>
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
  const [rerolling, setRerolling] = useState(false);
  const [rerollError, setRerollError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      // Coming back from Stripe. Spend the credit before reading the match,
      // so the dashboard never flashes the match they just paid to replace.
      const params = new URLSearchParams(window.location.search);
      const rerollParam = params.get("reroll");
      if (rerollParam) {
        const sessionId = params.get("session_id");
        window.history.replaceState({}, "", "/dashboard");

        if (rerollParam === "success") {
          setRerolling(true);
          try {
            const res = await fetch("/api/reroll", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sessionId ? { sessionId } : {}),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              if (!cancelled) {
                setRerollError(data.error ?? "Couldn't reroll. Please try again.");
              }
            }
          } catch {
            if (!cancelled) setRerollError("Couldn't reroll. Please try again.");
          } finally {
            if (!cancelled) setRerolling(false);
          }
        }
      }

      const [userData, matchData] = await Promise.all([
        fetch("/api/user").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/match").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (cancelled) return;
      if (userData && !userData.phoneVerified) {
        router.replace("/verify-phone");
        return;
      }
      setUser(userData);
      setMatch(matchData);
    }

    load()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [status, router]);

  const handleDecision = useCallback(
    async (decision: "INTERESTED" | "DECLINED"): Promise<boolean> => {
      if (!match?.matchId) return false;
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
        return true;
      } catch {
        return false;
      } finally {
        setDeciding(false);
      }
    },
    [match],
  );

  const handleReroll = useCallback(async () => {
    setRerollError(null);
    setRerolling(true);
    let navigatingToStripe = false;

    async function spendCredit(): Promise<void> {
      const res = await fetch("/api/reroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRerollError(data.error ?? "Couldn't reroll. Please try again.");
        return;
      }
      const [userData, matchData] = await Promise.all([
        fetch("/api/user").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/match").then((r) => (r.ok ? r.json() : null)),
      ]);
      setUser(userData);
      setMatch(matchData);
    }

    try {
      // Already bought one and never spent it (empty pool, closed tab).
      if ((user?.rerollCredits ?? 0) > 0) {
        await spendCredit();
        return;
      }

      const res = await fetch("/api/reroll/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRerollError(data.error ?? "Couldn't start checkout. Please try again.");
        return;
      }
      if (data.alreadyPaid) {
        await spendCredit();
        return;
      }
      if (data.url) {
        navigatingToStripe = true;
        window.location.href = data.url;
        return;
      }
      setRerollError("Couldn't start checkout. Please try again.");
    } catch {
      setRerollError("Couldn't reroll. Please try again.");
    } finally {
      if (!navigatingToStripe) setRerolling(false);
    }
  }, [user]);

  const isLoading = status === "loading" || loading;

  // Determine dashboard state
  const hasMatch = match?.hasMatch === true;
  const isMutual = match?.isMutual === true;
  const showClosedMatch = !hasMatch && !!match?.closedMatch;

  const rerollProps: RerollProps = {
    genderPreference: user?.genderPreference,
    seed: user?.id,
    onReroll: handleReroll,
    rerolling,
    rerollError,
    hasRerollCredit: (user?.rerollCredits ?? 0) > 0,
  };

  // The plate at the top of the card. Kept to two or three short words so it
  // never outgrows a phone-width card.
  const title = isLoading
    ? undefined
    : isMutual
      ? "It’s mutual"
      : hasMatch
        ? "Your match"
        : showClosedMatch
          ? "Next Wednesday"
          : `Hi ${user?.firstName?.trim() || "there"}`;

  return (
    <DashboardShell title={title}>
      {isLoading ? (
        <LoadingDashboard />
      ) : (
        <>
          {/* Whatever the match is doing sits on top and stays there: a
              live match to answer, one you're waiting on, one that closed
              (with the reroll), or the countdown to the next drop. */}
          {isMutual ? (
            <MutualDashboard match={match!} />
          ) : hasMatch ? (
            <MatchDashboard match={match!} onDecision={handleDecision} deciding={deciding} />
          ) : showClosedMatch ? (
            <MatchClosedDashboard
              reason={
                match!.closedMatch!.reason ??
                (match!.closedMatch!.youDeclined ? "you-declined" : "they-declined")
              }
              {...rerollProps}
            />
          ) : (
            <StatusPanel />
          )}

          {/* And the rest of the dashboard is always underneath. */}
          <EverydaySections
            user={user}
            loading={isLoading}
            heading={isMutual ? "Your profile" : "While you wait"}
            onPhotoUploaded={(url) =>
              setUser((prev) => (prev ? { ...prev, photoUrl: url } : null))
            }
          />
        </>
      )}
    </DashboardShell>
  );
}
