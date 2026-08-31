"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
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
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ivory/45 mb-5">
        {heading}
      </h3>
      <ul className="flex flex-col gap-3" role="list">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-ivory/70 transition-colors duration-200 hover:text-ivory"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeleteAccountLink() {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleting(false);
      setConfirm(false);
    }
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-xs text-ivory/45 hover:text-error transition-colors"
      >
        Delete account
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-error">Delete?</span>
      <button
        type="button"
        disabled={deleting}
        onClick={handleDelete}
        className="text-xs text-error font-medium underline underline-offset-2 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Yes"}
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => setConfirm(false)}
        className="text-xs text-ivory/45 hover:text-ivory"
      >
        No
      </button>
    </span>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink border-t border-ivory/10" role="contentinfo">
      <div className="section-container py-16 lg:py-20">
        <div
          className={cn(
            "grid gap-12",
            "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
          )}
        >
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <DaisyLogo size="md" className="mb-5" />
            <p className="text-sm leading-relaxed text-ivory/70 max-w-xs">
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
          <p className="text-xs text-ivory/45 tracking-wide">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
            <span className="mx-1.5">&middot;</span>
            <DeleteAccountLink />
          </p>
        </div>
      </div>
    </footer>
  );
}
