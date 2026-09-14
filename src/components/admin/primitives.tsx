import { cn } from "@/lib/utils";

/**
 * The small vocabulary the admin screens are built from. Everything sits on
 * the dark photographic ground the landing page and the auth card use, so
 * these are drawn for ink rather than ivory — the site-wide Card, Badge and
 * Input are all white-fill components and would read as holes here.
 */

/** Near-opaque ink slab, the same surface as the sign-in form panel. */
export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-white/10 bg-[rgba(17,21,14,0.82)]",
        "p-5 backdrop-blur-md sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

/** Eyebrow over a Spencer heading — the landing page's section lockup. */
export function SectionHeading({
  eyebrow,
  title,
  aside,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div>
        {eyebrow ? <p className="eyebrow mb-2 text-bloom">{eyebrow}</p> : null}
        <h2 className="font-display text-[26px] leading-none text-ivory sm:text-[30px]">{title}</h2>
      </div>
      {aside ? <div className="text-[13px] text-ivory/55">{aside}</div> : null}
    </div>
  );
}

type Tone = "ok" | "bad" | "warn" | "neutral";

const toneClasses: Record<Tone, string> = {
  ok: "border-sage-light/25 bg-sage-light/15 text-[#c6d4ba]",
  bad: "border-error/30 bg-error/15 text-[#f0afaf]",
  warn: "border-bloom/30 bg-bloom/15 text-bloom",
  neutral: "border-white/10 bg-white/[0.06] text-ivory/70",
};

/** Pill label. Tone carries the meaning; text stays short. */
export function Tag({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5",
        "text-[11px] font-medium tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Round glass control — the auth card's back chevron, reused for paging. */
export function GlassIconButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full",
        "liquid-glass bg-ivory/15 text-ivory transition-colors duration-200 hover:bg-ivory/25",
        "focus-visible:outline-2 focus-visible:outline-ivory focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Dark table styling shared by the referrer and suspect lists. */
export function DataTable({
  head,
  children,
  className,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6", className)}>
      <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory/45">
            {head}
          </tr>
        </thead>
        <tbody className="text-ivory/85">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <th className={cn("py-3 pr-4 font-semibold", className)}>{children}</th>;
}

export function Td({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <td className={cn("border-b border-white/[0.06] py-3 pr-4 align-middle", className)}>{children}</td>;
}

export function initialOf(name: string | null | undefined): string {
  return (name?.trim()[0] ?? "?").toUpperCase();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
