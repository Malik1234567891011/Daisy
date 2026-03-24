import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_NAME, FOOTER } from "@/lib/constants";
import DaisyLogo from "@/components/layout/DaisyLogo";

interface FooterColumnProps {
  heading: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}

function FooterColumn({ heading, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="font-body text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4">
        {heading}
      </h3>
      <ul className="flex flex-col gap-2.5" role="list">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-text-secondary transition-colors duration-150 hover:text-charcoal"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FloralDivider({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="8"
      viewBox="0 0 32 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <line x1="0" y1="4" x2="11" y2="4" stroke="var(--color-border)" strokeWidth="1" />
      <ellipse cx="16" cy="3" rx="1.4" ry="2.6" fill="var(--color-sage-light)" transform="rotate(0 16 4)" />
      <ellipse cx="16" cy="3" rx="1.4" ry="2.6" fill="var(--color-sage-light)" transform="rotate(60 16 4)" />
      <ellipse cx="16" cy="3" rx="1.4" ry="2.6" fill="var(--color-sage-light)" transform="rotate(120 16 4)" />
      <circle cx="16" cy="4" r="1.2" fill="var(--color-butter)" />
      <line x1="21" y1="4" x2="32" y2="4" stroke="var(--color-border)" strokeWidth="1" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ivory-warm border-t border-border-light" role="contentinfo">
      {/* ── Main section ── */}
      <div className="section-container py-16">
        <div
          className={cn(
            "grid gap-10",
            "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <DaisyLogo size="md" className="mb-4" />
            <p className="text-sm leading-relaxed text-text-secondary max-w-xs">
              {FOOTER.tagline}
            </p>
          </div>

          {/* Link columns */}
          <FooterColumn heading="Product" links={FOOTER.links.product} />
          <FooterColumn heading="Legal" links={FOOTER.links.legal} />
          <FooterColumn heading="Connect" links={FOOTER.links.connect} />
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border-light">
        <div className="section-container flex flex-col items-center gap-3 py-6">
          <FloralDivider className="opacity-60" />
          <p className="text-xs text-text-tertiary">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
