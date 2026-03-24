"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

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
    <div className="h-2 w-full rounded-full bg-cream" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full bg-sage transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-40" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage" />
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();
  const greeting = useMemo(() => getGreeting(), []);
  const [user, setUser] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setUserLoading(true);
    setUserError(false);

    fetch("/api/user")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!res.ok) {
          throw new Error("Failed to load user");
        }
        return res.json() as Promise<UserData>;
      })
      .then((data) => {
        if (cancelled || data === null) return;
        setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUserError(true);
      })
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const sessionOrUserLoading = status === "loading" || (status === "authenticated" && userLoading);
  const profileCompletion = user ? calculateProfileCompletion(user) : 0;
  const displayName = user?.firstName?.trim() || "friend";

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      <Navbar />

      <main className="flex-1">
        <div className="section-container py-10 sm:py-14">
          {/* Welcome */}
          <section className="mb-10">
            <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
              {sessionOrUserLoading ? (
                <Skeleton variant="heading" className="h-9 max-w-xs sm:h-10" />
              ) : userError ? (
                "Welcome back"
              ) : (
                <>Welcome back, {displayName}</>
              )}
            </h1>
            <p className="mt-1 text-text-secondary">
              {greeting} — here&rsquo;s where things stand.
            </p>
          </section>

          {/* Primary cards grid */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Profile completion */}
            <Card>
              {sessionOrUserLoading ? (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1 space-y-2 pr-4">
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-14 shrink-0" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                  <div className="mt-4">
                    <Skeleton className="h-4 w-44" />
                  </div>
                </>
              ) : userError || !user ? (
                <p className="text-sm text-text-secondary">We couldn&rsquo;t load your profile. Try refreshing the page.</p>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-display text-lg text-charcoal">Your profile</h2>
                      <p className="mt-0.5 text-sm text-text-secondary">
                        Profile {profileCompletion}% complete
                      </p>
                    </div>
                    <span className="text-2xl font-display text-sage">
                      {profileCompletion}%
                    </span>
                  </div>
                  <ProgressBar value={profileCompletion} />
                  {profileCompletion < 100 && (
                    <div className="mt-4">
                      <Button variant="link" href="/profile">
                        Complete your profile &rarr;
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Match status */}
            <Card>
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-display text-lg text-charcoal">Your match</h2>
                <Badge variant="sage">
                  <span className="flex items-center gap-1.5">
                    <PulsingDot />
                    Active
                  </span>
                </Badge>
              </div>
              <p className="text-text-secondary leading-relaxed">
                We&rsquo;re reviewing profiles and looking for someone great for you.
                Sit tight — good things are on the way.
              </p>
              <p className="mt-3 text-sm text-text-tertiary">
                This usually takes 1–7 days
              </p>
            </Card>
          </div>

          {/* Quick actions */}
          <section className="mb-10">
            <h2 className="font-display text-lg text-charcoal mb-4">Quick actions</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card hover variant="outlined" className="group">
                <Link href="/profile" className="block">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-pale text-olive">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
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
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-butter-pale text-espresso">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-charcoal group-hover:text-olive transition-colors">Update preferences</p>
                      <p className="text-xs text-text-tertiary">Refine your match criteria</p>
                    </div>
                  </div>
                </Link>
              </Card>

              <Card hover variant="outlined" className="group">
                <Link href="/profile#contact" className="block">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-espresso">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-charcoal group-hover:text-olive transition-colors">Contact settings</p>
                      <p className="text-xs text-text-tertiary">How your match reaches you</p>
                    </div>
                  </div>
                </Link>
              </Card>
            </div>
          </section>

          {/* Account section */}
          <section>
            <h2 className="font-display text-lg text-charcoal mb-4">Account</h2>
            <Card variant="outlined">
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-sm text-text-tertiary">Email</p>
                  {sessionOrUserLoading ? (
                    <Skeleton className="mt-1 h-5 max-w-xs" />
                  ) : userError || !user ? (
                    <p className="text-text-primary">—</p>
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
      </main>

      <Footer />
    </div>
  );
}
