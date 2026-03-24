"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import DaisyLogo from "@/components/layout/DaisyLogo";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const close = useCallback(() => setMenuOpen(false), []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border-light bg-ivory/90 backdrop-blur-md",
        "transition-shadow duration-300",
        scrolled && "shadow-sm"
      )}
    >
      <nav
        className="section-container flex h-16 items-center justify-between"
        aria-label="Main navigation"
      >
        <DaisyLogo size="md" />

        <ul className="hidden lg:flex items-center gap-8" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-text-secondary transition-colors duration-150 hover:text-charcoal"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions — changes based on auth state */}
        <div className="hidden lg:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
              <Button variant="primary" href="/dashboard" size="sm">
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" href="/login" size="sm">
                Sign in
              </Button>
              <Button variant="primary" href="/onboarding" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex lg:hidden items-center gap-2">
          {isLoggedIn ? (
            <Button variant="primary" href="/dashboard" size="sm">
              Dashboard
            </Button>
          ) : (
            <Button variant="primary" href="/onboarding" size="sm">
              Get started
            </Button>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-lg",
              "text-text-secondary hover:text-charcoal hover:bg-sage-pale/50",
              "transition-colors duration-150"
            )}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <div className="w-[18px] h-[14px] relative">
              <span
                className={cn(
                  "absolute left-0 w-full h-[1.5px] rounded-full bg-current",
                  "transition-all duration-300 ease-out",
                  menuOpen ? "top-[6px] rotate-45" : "top-0"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[6px] w-full h-[1.5px] rounded-full bg-current",
                  "transition-opacity duration-200",
                  menuOpen && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 w-full h-[1.5px] rounded-full bg-current",
                  "transition-all duration-300 ease-out",
                  menuOpen ? "top-[6px] -rotate-45" : "top-[12px]"
                )}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 bg-ivory lg:hidden",
          "transition-all duration-300 ease-out",
          menuOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2"
        )}
      >
        <nav className="flex h-full flex-col px-6 pt-8 pb-10">
          <ul className="flex flex-col gap-1" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className={cn(
                    "block rounded-lg px-3 py-3.5 text-lg text-text-secondary",
                    "transition-colors duration-150 hover:text-charcoal hover:bg-sage-pale/40"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-3">
            {isLoggedIn ? (
              <>
                <Button
                  variant="primary"
                  href="/dashboard"
                  size="lg"
                  className="w-full justify-center"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full justify-center"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  href="/onboarding"
                  size="lg"
                  className="w-full justify-center"
                >
                  Get started
                </Button>
                <Button
                  variant="ghost"
                  href="/login"
                  size="lg"
                  className="w-full justify-center"
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
