"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { Users, Send, Clock, Sparkles, User, Settings, Mail } from "lucide-react";

type UserData = {
  id: string;
  email: string;
  firstName: string | null;
  school: string | null;
  major: string | null;
  age: number | null;
  ethnicity: string | null;
  schoolPreference: string | null;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  majorPreference: string | null;
  ethnicityPreference: string | null;
  contactMethod: string | null;
  contactValue: string | null;
  onboardingComplete: boolean;
  createdAt: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getNextDropDate(): Date {
  const now = new Date();
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
  nextFriday.setHours(18, 0, 0, 0);
  if (nextFriday <= now) {
    nextFriday.setDate(nextFriday.getDate() + 7);
  }
  return nextFriday;
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  return { days, hours, minutes };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-3xl sm:text-4xl text-charcoal leading-none">
        {value}
      </span>
      <span className="text-xs text-text-tertiary mt-1.5 uppercase tracking-widest">
        {label}
      </span>
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

function calculateProfileCompletion(user: UserData): number {
  let pct = 0;
  if (user.firstName?.trim()) pct += 20;
  if (user.school?.trim()) pct += 20;
  if (user.major?.trim()) pct += 20;
  if (user.age != null) pct += 20;
  if (user.contactMethod?.trim() && user.contactValue?.trim()) pct += 20;
  return pct;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-cream-dark/30" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full bg-sage transition-all duration-700 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/* ─── Waitlist Dashboard ─── */
function WaitlistDashboard({ user, loading, error }: { user: UserData | null; loading: boolean; error: boolean }) {
  const greeting = useMemo(() => getGreeting(), []);
  const nextDrop = useMemo(() => getNextDropDate(), []);
  const countdown = useCountdown(nextDrop);
  const displayName = user?.firstName?.trim() || "friend";
  const profileCompletion = user ? calculateProfileCompletion(user) : 0;

  return (
    <div className="section-container py-12 sm:py-16">
      {/* Header */}
      <section className="mb-12 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-3">
          <PulsingDot />
          <span className="text-xs font-medium text-sage uppercase tracking-widest">Active</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          {loading ? (
            <Skeleton variant="heading" className="h-9 max-w-xs sm:h-10 mx-auto sm:mx-0" />
          ) : error ? (
            "You're in, Daisy"
          ) : (
            <>{greeting}, {displayName}</>
          )}
        </h1>
        <p className="mt-1.5 text-text-secondary">
          We&rsquo;re preparing your first match. Sit tight.
        </p>
      </section>

      {/* Countdown card */}
      <Card className="mb-6 text-center py-10 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-pale/20 via-transparent to-butter-pale/15" aria-hidden="true" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-text-secondary mb-6">Next matches drop in</p>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <CountdownUnit value={countdown.days} label="days" />
            <span className="text-2xl text-border-light font-light -mt-4">:</span>
            <CountdownUnit value={countdown.hours} label="hrs" />
            <span className="text-2xl text-border-light font-light -mt-4">:</span>
            <CountdownUnit value={countdown.minutes} label="min" />
          </div>
          <p className="mt-6 text-sm text-text-tertiary">
            Every Friday at 6 PM
          </p>
        </div>
      </Card>

      {/* Status + Invite row */}
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        {/* Status */}
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

        {/* Invite friends */}
        <Card className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-butter-pale/70 border border-butter-light/40">
            <Users className="w-5 h-5 text-espresso" strokeWidth={1.6} />
          </div>
          <div>
            <h2 className="font-display text-lg text-charcoal mb-1">Want your match faster?</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Invite friends from your school. More people means better, faster matches.
            </p>
            <Button variant="secondary" size="sm">
              <Send className="w-3.5 h-3.5" />
              Invite 2 friends
            </Button>
          </div>
        </Card>
      </div>

      {/* Profile completion */}
      {!loading && !error && user && profileCompletion < 100 && (
        <Card className="mb-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display text-lg text-charcoal">Your profile</h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                {profileCompletion}% complete — a complete profile gets better matches
              </p>
            </div>
            <span className="text-2xl font-display text-sage">
              {profileCompletion}%
            </span>
          </div>
          <ProgressBar value={profileCompletion} />
          <div className="mt-4">
            <Button variant="link" href="/profile">
              Complete your profile &rarr;
            </Button>
          </div>
        </Card>
      )}

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

      {/* Account */}
      <section>
        <h2 className="font-display text-lg text-charcoal mb-5">Account</h2>
        <Card variant="outlined">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm text-text-tertiary">Email</p>
              {loading ? (
                <Skeleton className="mt-1 h-5 max-w-xs" />
              ) : error || !user ? (
                <p className="text-text-primary">&mdash;</p>
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
                "transition-colors duration-150 hover:text-error/80"
              )}
            >
              Delete account
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const { status } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") setUserLoading(false);
      return;
    }

    let cancelled = false;
    setUserLoading(true);
    setUserError(false);

    fetch("/api/user")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load user");
        return res.json() as Promise<UserData>;
      })
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUserError(true);
      })
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });

    return () => { cancelled = true; };
  }, [status]);

  const isLoading = status === "loading" || userLoading;

  // TODO: when matching is implemented, check user.hasMatch or similar
  const hasMatch = false;

  return (
    <div className="flex min-h-dvh flex-col bg-ivory bg-grain">
      <Navbar />

      <main className="flex-1">
        {hasMatch ? (
          <div className="section-container py-16 text-center">
            <p>Matched dashboard coming soon</p>
          </div>
        ) : (
          <WaitlistDashboard user={user} loading={isLoading} error={userError} />
        )}
      </main>

      <Footer />
    </div>
  );
}
