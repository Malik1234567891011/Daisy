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
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary mb-5">
        {heading}
      </h3>
      <ul className="flex flex-col gap-3" role="list">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-text-secondary transition-colors duration-200 hover:text-charcoal"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ivory-warm border-t border-border-light/60" role="contentinfo">
      <div className="section-container py-16 lg:py-20">
        <div
          className={cn(
            "grid gap-12",
            "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
          )}
        >
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <DaisyLogo size="md" className="mb-5" />
            <p className="text-sm leading-relaxed text-text-secondary max-w-xs">
              {FOOTER.tagline}
            </p>
          </div>

          <FooterColumn heading="Product" links={FOOTER.links.product} />
          <FooterColumn heading="Legal" links={FOOTER.links.legal} />
          <FooterColumn heading="Connect" links={FOOTER.links.connect} />
        </div>
      </div>

      <div className="border-t border-border-light/50">
        <div className="section-container flex items-center justify-center py-7">
          <p className="text-xs text-text-tertiary tracking-wide">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
