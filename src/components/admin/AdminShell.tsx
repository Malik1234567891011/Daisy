"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import DaisyLogo from "@/components/layout/DaisyLogo";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Frame for the admin area: the auth card's soft campus photograph pinned
 * behind everything, the landing page's dither and grain over it, and a
 * floating bar with the wordmark and two glass pills. There is no student
 * navigation here — the only ways out are refresh and sign out.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  function refresh() {
    setRefreshing(true);
    router.refresh();
    // router.refresh() gives no completion signal; the spin is just enough
    // feedback that the click landed.
    window.setTimeout(() => setRefreshing(false), 900);
  }

  async function signOut() {
    setLeaving(true);
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col text-ivory">
      {/* Wallpaper, not a section background: it stays put while the long
          user grid scrolls over it. The file is pre-blurred. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-ink bg-cover bg-center"
        style={{ backgroundImage: "url('/campus/personal-page-bg.jpg')" }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(20,24,15,0.5)_0%,rgba(20,24,15,0.62)_50%,rgba(20,24,15,0.78)_100%)]"
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-halftone opacity-70" />
      <div aria-hidden className="fixed inset-0 -z-10 bg-grain opacity-60" />

      <header className="sticky top-0 z-40">
        {/* The bar has no fill of its own, so a short scrim keeps content
            legible as it slides underneath — same trick as the landing nav. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[calc(var(--nav-h)+2.5rem)] bg-gradient-to-b from-ink/80 via-ink/40 to-transparent"
        />
        <nav
          className="section-container relative flex h-[var(--nav-h)] items-center justify-between"
          aria-label="Admin navigation"
        >
          <div className="flex items-center gap-3">
            <DaisyLogo size="md" tone="light" />
            <span className="eyebrow hidden text-bloom sm:inline">Admin</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="onDarkQuiet" size="sm" onClick={refresh} disabled={refreshing}>
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="onDarkQuiet" size="sm" onClick={signOut} disabled={leaving}>
              <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </nav>
      </header>

      <main className="section-container relative flex-1 pb-24">{children}</main>
    </div>
  );
}
