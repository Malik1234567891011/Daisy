"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthFrame from "@/components/auth/AuthFrame";
import PlateTitle from "@/components/ui/PlateTitle";
import { cn } from "@/lib/utils";

/**
 * The signed-in page chrome. Same ground as the sign-in and onboarding
 * screens — the blurred campus wallpaper with the frosted bezel and ink card
 * on it — with the landing page's floating navbar across the top, so the
 * dashboard reads as the room the front door opened onto.
 *
 * One column at every width. The card is the phone's shape, and on a desktop
 * it simply gets more photograph around it rather than a second column.
 */
export default function DashboardShell({
  title,
  backHref,
  backLabel = "Back to dashboard",
  children,
}: {
  /** Plate title at the top of the card. Omit while loading. */
  title?: string;
  /** Sub-pages get the same circular chevron the account screens use. */
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-ink">
      {/* Fixed so the wallpaper stays put as the card scrolls over it. The
          file is already blurred, so nothing is filtered here. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-ink bg-cover bg-center"
        style={{ backgroundImage: "url('/campus/personal-page-bg.jpg')" }}
      />

      <Navbar tone="dark" />

      {/* Pulled under the sticky bar the way the landing hero is, so the
          photograph runs behind the navbar rather than starting below it. */}
      <main className="-mt-[var(--nav-h)] flex flex-1 flex-col items-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[calc(var(--nav-h)+0.5rem)]">
        <AuthFrame width="lg" className="px-4 pb-6 pt-6 sm:px-6 sm:pb-7 sm:pt-7">
          {backHref && (
            <div className="mb-3 h-[48px]">
              <Link
                href={backHref}
                aria-label={backLabel}
                className={cn(
                  "inline-flex h-[48px] w-[48px] items-center justify-center rounded-full",
                  "liquid-glass bg-ivory/15 text-ivory transition-colors duration-200 hover:bg-ivory/25",
                  "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
                )}
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
          )}
          {title && <PlateTitle title={title} size="md" />}
          <div className="mt-6 flex flex-col gap-3.5 sm:gap-4">{children}</div>
        </AuthFrame>
      </main>

      <Footer />
    </div>
  );
}
