"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import DaisyLogo from "@/components/layout/DaisyLogo";
import Button from "@/components/ui/Button";

interface NavbarProps {
  /**
   * "over" floats the bar transparently on the landing hero for the whole
   * scroll — it never takes a background, and only the call to action changes.
   * Every other page has a light background and wants "solid" from the first
   * pixel.
   *
   * "dark" is for the signed-in screens, which sit on the ink wallpaper:
   * transparent at the top like "over", but it fills in with frosted ink once
   * scrolled so card text never collides with the logo.
   */
  tone?: "solid" | "over" | "dark";
}

export default function Navbar({ tone = "solid" }: NavbarProps) {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overlay = tone === "over";
  const dark = tone === "dark";
  const onDark = overlay || dark;
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  // Variants, not className overrides: `cn` is plain clsx, so an override
  // like `bg-ivory` would sit alongside the variant's `bg-sage` and lose to
  // stylesheet order.
  const ghostVariant = onDark ? "onDarkQuiet" : "ghost";
  // Over the hero the CTA is glass; past the first screen it fills in solid
  // with accent text. That swap is the only thing marking scroll progress,
  // since the bar itself never takes a background.
  const solidVariant = overlay
    ? scrolled ? "onDarkAccent" : "onDark"
    : dark ? "onDark" : "primary";

  // On phones the primary action is withheld until you have scrolled — the
  // hero already carries a full-width enrol form, so a second competing call
  // to action at the top is noise. There is no hamburger: the nav links live
  // in the footer, and a menu holding three anchor links isn't worth the
  // scroll lock, focus trap and overlay it costs.
  const showMobileCta = !overlay || scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500 ease-out",
        overlay
          // border-b-0, not a transparent border: a transparent border still
          // occupies a pixel of flow, which left a hairline of page
          // background showing above the hero.
          ? "bg-transparent border-b-0"
          : dark
            ? scrolled
              ? "bg-ink/75 backdrop-blur-xl border-b border-ivory/10"
              : "bg-transparent border-b-0"
            : scrolled
            ? "bg-ivory/80 backdrop-blur-xl border-b border-border-light/60 shadow-sm"
            : "bg-ivory/80 backdrop-blur-xl border-b border-transparent",
      )}
    >
      {/* Scrim, overlay mode only. The bar never takes a background, so
          section content scrolls directly under it — headings were colliding
          with the nav links and both became unreadable. A short gradient
          darkens whatever passes beneath without reading as a bar. */}
      {overlay && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[calc(var(--nav-h)+2.25rem)] bg-gradient-to-b from-ink/55 via-ink/25 to-transparent"
          aria-hidden="true"
        />
      )}

      <nav
        className="section-container relative flex h-[var(--nav-h)] items-center justify-between"
        aria-label="Main navigation"
      >
        <DaisyLogo size="md" tone={onDark ? "light" : "dark"} />

        <ul className="hidden lg:flex items-center gap-9" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "relative text-[13px] tracking-wide transition-colors duration-200",
                  onDark
                    ? "text-ivory/75 hover:text-ivory"
                    : "text-text-secondary hover:text-charcoal",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-2.5">
          {isLoggedIn ? (
            <>
              <Button
                variant={ghostVariant}
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </Button>
              <Button variant={solidVariant} href="/dashboard" size="sm">
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button variant={ghostVariant} href="/login" size="sm">
                Sign in
              </Button>
              <Button variant={solidVariant} href="/onboarding" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isLoggedIn ? (
            /* A "Dashboard" button on the dashboard itself goes nowhere, so
               that page gets the other thing the desktop bar offers. */
            onDashboard ? (
              <Button
                variant={ghostVariant}
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </Button>
            ) : (
              <Button variant={solidVariant} href="/dashboard" size="sm">
                Dashboard
              </Button>
            )
          ) : (
            <>
              <Button variant={ghostVariant} href="/login" size="sm">
                Sign in
              </Button>
              {showMobileCta && (
                <Button variant={solidVariant} href="/onboarding" size="sm">
                  Get started
                </Button>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
