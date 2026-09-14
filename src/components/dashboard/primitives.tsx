"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTH_PANEL_SURFACE } from "@/components/auth/AuthPanel";

/**
 * The dashboard's vocabulary, drawn for the ink card the way the onboarding
 * controls are: dark slabs, ivory type, one white pill per screen, glass for
 * everything secondary.
 *
 * Everything here is sized for a thumb first. Rows and pills are 48px or
 * taller, body copy never drops under 14px, and nothing depends on hover.
 */

/* ─── Surfaces ─── */

/** The onboarding form slab, with the dashboard's denser spacing. `flush`
 *  drops the padding so a photograph can run to the edges. */
export function Panel({
  flush = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return (
    <div
      className={cn(
        AUTH_PANEL_SURFACE,
        /* `.auth-dark` re-points the light-ground utilities the shared
           pieces (photo picker, skeletons) use, so they invert for free. */
        "auth-dark",
        !flush && "px-4 py-5 sm:px-5 sm:py-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Padding for a `flush` panel's text region. */
export const PANEL_INSET = "px-4 py-5 sm:px-5 sm:py-6";

/* ─── Type ─── */

export function Eyebrow({
  children,
  live = false,
  className,
}: {
  children: React.ReactNode;
  /** A pulsing dot in front — the "something is happening" marker. */
  live?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("eyebrow flex items-center gap-2.5 text-sage-light", className)}>
      {live && (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-light opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-light" />
        </span>
      )}
      {children}
    </p>
  );
}

export function PanelTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <Tag className={cn("font-display text-[24px] leading-tight text-ivory", className)}>
      {children}
    </Tag>
  );
}

export function Muted({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("text-[14px] leading-relaxed text-white/60", className)}>{children}</p>;
}

export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-sage-light underline-offset-4 transition-colors hover:text-ivory hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* ─── Controls ─── */

type PillTone = "solid" | "glass";
type PillSize = "md" | "sm";

const PILL_TONE: Record<PillTone, string> = {
  /* The white pill: the one thing on a screen that moves you on. Written as
     arbitrary values because `.auth-dark` (on every Panel) re-points the
     plain `bg-ivory` / `text-olive` utilities to translucent dark fills. */
  solid: "bg-[var(--color-ivory)] font-bold text-[var(--color-olive)] hover:bg-[var(--color-bloom-soft)]",
  /* Same glass as the homepage's on-dark buttons. */
  glass: "liquid-glass bg-ivory/10 font-medium text-ivory hover:bg-ivory/20",
};

const PILL_SIZE: Record<PillSize, string> = {
  md: "h-12 px-5 text-[15px]",
  sm: "h-10 px-4 text-[14px]",
};

type PillBase = {
  tone?: PillTone;
  size?: PillSize;
  className?: string;
  children: React.ReactNode;
};

type PillAsLink = PillBase & { href: string };
type PillAsButton = PillBase &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof PillBase> & { href?: undefined };

export function Pill(props: PillAsLink | PillAsButton) {
  const { tone = "solid", size = "md", className, children, href, ...rest } = props;
  const classes = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full select-none",
    "transition-all duration-200 ease-out active:scale-[0.99]",
    "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    PILL_TONE[tone],
    PILL_SIZE[size],
    className,
  );

  if (href) {
    // Only in-app routes go through next/link. Anything else — https://,
    // sms:, mailto: — is a plain anchor, opened in a new tab when it's a
    // web address.
    if (!href.startsWith("/")) {
      const web = /^https?:/i.test(href);
      return (
        <a
          href={href}
          className={classes}
          {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as PillAsButton)}>
      {children}
    </button>
  );
}

export function IconTile({
  icon: Icon,
  tone = "sage",
  className,
}: {
  icon: LucideIcon;
  tone?: "sage" | "bloom";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07]",
        className,
      )}
      aria-hidden="true"
    >
      <Icon
        className={cn("h-5 w-5", tone === "bloom" ? "text-bloom" : "text-sage-light")}
        strokeWidth={1.7}
      />
    </span>
  );
}

/** A full-width tappable row: icon, label, hint, chevron. */
export function ActionRow({
  href,
  icon,
  tone,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  tone?: "sage" | "bloom";
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[64px] items-center gap-3.5 rounded-[14px] border border-white/10 bg-white/[0.05] px-3.5 py-3",
        "transition-colors duration-200 hover:bg-white/[0.09] active:bg-white/[0.12]",
        "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
      )}
    >
      <IconTile icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-ivory">{title}</span>
        <span className="block text-[13px] text-white/55">{subtitle}</span>
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-white/35 transition-colors group-hover:text-white/70"
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </Link>
  );
}

/** A soft sage notice, matching the sign-in page's status banner. */
export function Notice({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[14px] border border-sage-light/25 bg-sage/15 px-4 py-3.5",
        className,
      )}
      role="status"
    >
      {Icon && (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sage-light" strokeWidth={1.8} aria-hidden="true" />
      )}
      <div className="min-w-0 text-[14px] leading-relaxed text-ivory">{children}</div>
    </div>
  );
}

/** Rounded tag, as on the match card. */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/12 bg-white/[0.07] px-3 py-1 text-[12px] font-medium text-ivory/85">
      {children}
    </span>
  );
}

/* ─── Countdown ─── */

export type CountdownUnit = { value: number; label: string; pad?: boolean };

export function Countdown({ units, className }: { units: CountdownUnit[]; className?: string }) {
  return (
    <div className={cn("flex items-start justify-center gap-2 sm:gap-5", className)}>
      {units.map((u, i) => (
        <Fragment key={u.label}>
          {i > 0 && (
            <span
              className="pt-1 font-display text-[26px] leading-none text-white/25 sm:text-[32px]"
              aria-hidden="true"
            >
              :
            </span>
          )}
          <div className="flex min-w-[2.75rem] flex-col items-center sm:min-w-[3.5rem]">
            <span className="font-display text-[36px] leading-none text-ivory tabular-nums sm:text-[48px]">
              {u.pad ? String(u.value).padStart(2, "0") : u.value}
            </span>
            <span className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/50">
              {u.label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/* ─── Forms (the account pages) ─── */

/** A labelled block in a settings form: title, one-line hint, then the control. */
export function Field({
  label,
  hint,
  optional = false,
  error,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[15px] font-medium text-ivory">
        {label}
        {optional && <span className="font-normal text-white/45"> (optional)</span>}
      </p>
      {hint && <p className="mt-0.5 text-[13px] text-white/55">{hint}</p>}
      <div className="mt-3">{children}</div>
      {error && (
        <p className="mt-2 text-[13px] text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** One-of choice as a row of pills, the shape the onboarding steps use. */
export function ChoicePills<T extends string>({
  options,
  value,
  onChange,
  disabled,
  label,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-center text-[14px] leading-snug transition-all duration-200",
              "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
              "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
              on
                ? "border-[var(--color-ivory)] bg-[var(--color-ivory)] font-semibold text-[var(--color-olive)]"
                : "border-white/12 bg-white/[0.06] font-medium text-white/80 hover:bg-white/[0.11]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Any-of choice as chips. Same pill, toggled. */
export function ToggleChips({
  options,
  selected,
  onToggle,
  disabled,
  label,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label={label} aria-multiselectable="true">
      {options.map((opt) => {
        const on = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={on}
            disabled={disabled}
            onClick={() => onToggle(opt.value)}
            className={cn(
              /* min-height, not height: a long label wraps and the chip grows with it. */
              "inline-flex min-h-10 items-center rounded-full border px-3.5 py-2 text-center text-[14px] leading-snug transition-all duration-200",
              "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
              "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
              on
                ? "border-sage-light/70 bg-sage/30 font-medium text-ivory"
                : "border-white/12 bg-white/[0.05] text-white/75 hover:bg-white/[0.1]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Status line above a form: saved, loading, or failed. */
export function FormStatus({
  kind,
  children,
}: {
  kind: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[14px] border px-4 py-3 text-[14px]",
        kind === "success" && "border-sage-light/30 bg-sage/15 text-ivory",
        kind === "error" && "border-error/30 bg-error/10 text-[#f0afaf]",
        kind === "info" && "border-white/10 bg-white/[0.05] text-white/70",
      )}
    >
      {children}
    </div>
  );
}
