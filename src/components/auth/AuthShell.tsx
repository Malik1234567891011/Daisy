"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthFrame from "@/components/auth/AuthFrame";
import PlateTitle from "@/components/ui/PlateTitle";

/**
 * The frame every account screen sits in: a soft campus photograph behind the
 * shared bezel-and-card (`AuthFrame`), with a back chevron, the plate title,
 * and a sign-up line on the photograph below the form.
 *
 * The card is deliberately portrait on the short sign-in screen: a tall
 * photograph with the form floating in its middle third.
 */

interface AuthShellProps {
  /** The boxed wordmark at the top of the card. A trailing second word is
   *  picked out in bloom, the way the homepage section lockups are set. */
  title: string;
  /** Circular chevron, top-left. Omit both and no button renders. */
  onBack?: () => void;
  backHref?: string;
  backLabel?: string;
  /** Sits on the photograph below the form — where the sign-up prompt goes. */
  footer?: React.ReactNode;
  width?: "sm" | "md";
  /** Extra classes for the card's inner column. */
  className?: string;
  children: React.ReactNode;
}

export default function AuthShell({
  title,
  onBack,
  backHref,
  backLabel = "Go back",
  footer,
  width = "sm",
  className,
  children,
}: AuthShellProps) {
  const backButtonClasses = cn(
    "inline-flex h-[52px] w-[52px] items-center justify-center rounded-full",
    /* Same glass as the homepage's on-dark pills: backdrop blur plus the
       inset highlights that give the surface an edge. */
    "liquid-glass bg-ivory/15 text-ivory",
    "transition-colors duration-200 hover:bg-ivory/25",
    "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
  );

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8">
      {/* Fixed, not absolute: the onboarding flow scrolls, and the photograph
          should stay put underneath it the way a wallpaper does. The file is
          already blurred, so nothing is filtered here. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-ink bg-cover bg-center"
        style={{ backgroundImage: "url('/campus/personal-page-bg.jpg')" }}
      />

      <AuthFrame
        width={width}
        /* Holds the portrait proportion on the short sign-in screen; the
           onboarding steps outgrow it and it stops mattering. */
        portrait={width === "sm"}
        className={cn("px-5 pt-6 sm:px-6", className)}
      >
        <div className="h-[52px]">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className={backButtonClasses}
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </button>
          ) : backHref ? (
            <Link href={backHref} aria-label={backLabel} className={backButtonClasses}>
              <ChevronLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </Link>
          ) : null}
        </div>

        <PlateTitle
          title={title}
          size={width === "sm" ? "lg" : "md"}
          className={width === "sm" ? "mt-12" : "mt-8"}
        />

        <div className={width === "sm" ? "mt-9" : "mt-6"}>{children}</div>

        {/* Pushes the sign-up line to the bottom of the photograph on the
            short screens, and simply follows the content on the long ones. */}
        <div className="flex-1" />

        {footer ? (
          <div className="pb-6 pt-8 text-center text-[15px] text-white/80">
            {footer}
          </div>
        ) : (
          <div className="pb-7" />
        )}
      </AuthFrame>
    </div>
  );
}
