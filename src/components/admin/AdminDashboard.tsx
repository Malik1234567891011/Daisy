"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { AdminData, AdminUser, BreakdownItem } from "@/lib/admin-stats";
import { pct } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";
import AdminShell from "./AdminShell";
import ProfileViewer from "./ProfileViewer";
import {
  DataTable,
  Panel,
  SectionHeading,
  Tag,
  Td,
  Th,
  formatDate,
  initialOf,
} from "./primitives";

/**
 * The operational view of the database. The server page fetches and shapes
 * the numbers; this only draws them, filters the grid, and hands one user at
 * a time to the viewer.
 */

type Filter = "all" | "verified" | "unverified" | "suspect" | "nophoto";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "verified", label: "Verified" },
  { id: "unverified", label: "Not verified" },
  { id: "suspect", label: "Suspect" },
  { id: "nophoto", label: "No photo" },
];

function matchesFilter(user: AdminUser, filter: Filter): boolean {
  switch (filter) {
    case "verified":
      return user.phoneVerified;
    case "unverified":
      return !user.phoneVerified;
    case "suspect":
      return user.suspect;
    case "nophoto":
      return !user.photoUrl;
    default:
      return true;
  }
}

function BreakdownPanel({
  title,
  items,
  labelWidth = "w-[7.5rem]",
  columns = false,
  className,
}: {
  title: string;
  items: BreakdownItem[];
  labelWidth?: string;
  /** Lay the list out in two columns on wide screens — for the long ones. */
  columns?: boolean;
  className?: string;
}) {
  // Bars are scaled to the largest entry so the top row always fills its
  // track; the percentage beside it is still the share of the verified pool.
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Panel className={className}>
      <h3 className="eyebrow text-bloom">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-[13px] text-ivory/45">Nothing yet.</p>
      ) : (
        <ul className={cn("mt-4", columns ? "grid gap-x-10 gap-y-2.5 lg:grid-cols-2" : "space-y-2.5")}>
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3 text-[13px]">
              <span className={cn("shrink-0 truncate text-ivory/80", labelWidth)} title={item.label}>
                {item.label}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full bg-bloom"
                  style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
                />
              </span>
              <span className="w-[4.75rem] shrink-0 text-right tabular-nums text-ivory/85">
                {item.count} <span className="text-ivory/45">· {item.pct}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function UserCard({ user, onOpen }: { user: AdminUser; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex w-full flex-col items-center rounded-[18px] border p-4 text-center",
        "bg-white/[0.06] backdrop-blur-sm transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:bg-white/[0.1]",
        "focus-visible:outline-2 focus-visible:outline-bloom focus-visible:outline-offset-2",
        user.suspect ? "border-bloom/35" : "border-white/10",
      )}
    >
      {user.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-20 w-20 rounded-full object-cover ring-2 ring-white/15"
        />
      ) : (
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.08] font-display text-[32px] text-ivory/50 ring-2 ring-white/10">
          {initialOf(user.firstName)}
        </span>
      )}
      <span className="mt-3 w-full truncate font-display text-[20px] leading-none text-ivory">
        {user.firstName || "?"}
        {user.age ? <span className="text-ivory/50">, {user.age}</span> : null}
      </span>
      <span className="mt-1.5 w-full truncate text-[12px] text-ivory/55">{user.school || "—"}</span>
      <span className="mt-2.5 flex flex-wrap justify-center gap-1">
        <Tag tone={user.phoneVerified ? "ok" : "bad"}>{user.phoneVerified ? "phone" : "no phone"}</Tag>
        {user.suspect ? <Tag tone="warn">suspect</Tag> : null}
      </span>
    </button>
  );
}

export default function AdminDashboard({
  data,
  generatedAt,
}: {
  data: AdminData;
  generatedAt: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.users.filter((u) => {
      if (!matchesFilter(u, filter)) return false;
      if (!q) return true;
      return [u.firstName, u.email, u.school, u.referralCode, u.phoneNumber].some((v) =>
        v?.toLowerCase().includes(q),
      );
    });
  }, [data.users, query, filter]);

  function openUser(id: string) {
    const i = visible.findIndex((u) => u.id === id);
    if (i >= 0) {
      setViewerIndex(i);
      return;
    }
    // Reached from a table while the grid is filtered down: widen the grid so
    // the viewer's prev/next walk the whole list.
    setQuery("");
    setFilter("all");
    setViewerIndex(data.users.findIndex((u) => u.id === id));
  }

  const closeViewer = useCallback(() => setViewerIndex(null), []);
  const handleDeleted = useCallback(() => {
    setViewerIndex(null);
    router.refresh();
  }, [router]);

  const { totals } = data;
  const stats: { label: string; value: number; sub?: number; tone?: "warn" | "bad" }[] = [
    { label: "Signups", value: totals.total },
    { label: "Phone verified", value: totals.verified, sub: pct(totals.verified, totals.total) },
    { label: "Onboarded", value: totals.onboarded, sub: pct(totals.onboarded, totals.total) },
    { label: "With photo", value: totals.withPhoto, sub: pct(totals.withPhoto, totals.total) },
    { label: "Suspect emails", value: totals.suspect, tone: totals.suspect ? "bad" : undefined },
    { label: "Drop-offs", value: totals.dropoffs, sub: pct(totals.dropoffs, totals.total) },
  ];

  const suspects = data.users.filter((u) => u.suspect);

  return (
    <AdminShell>
      <div className="pt-6 sm:pt-10">
        {/* Same boxed lockup as the homepage section headings and the auth
            card: type on an ink plate, last word in bloom. */}
        <h1 className="w-fit bg-ink px-5 py-1.5">
          <span className="font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-none text-ivory">
            Daisy{" "}
          </span>
          <span className="font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-none text-bloom">
            Admin
          </span>
        </h1>
        <p className="mt-4 text-[15px] text-ivory/60">
          Live data &middot; as of {formatDate(generatedAt)}
        </p>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="border-t border-ivory/20 pt-4">
            <dt className="eyebrow text-ivory/55">{s.label}</dt>
            <dd className="mt-2 flex items-baseline gap-2">
              <span
                className={cn(
                  "font-display text-[40px] leading-none tabular-nums",
                  s.tone === "bad" ? "text-[#f0afaf]" : s.tone === "warn" ? "text-bloom" : "text-ivory",
                )}
              >
                {s.value}
              </span>
              {s.sub !== undefined ? (
                <span className="text-[13px] text-ivory/50">{s.sub}%</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Verified pool"
          title="Who is here"
          aside={`${totals.verified} phone-verified accounts`}
        />
        {/* items-start: a four-row panel next to a thirteen-row one should end
            where its list ends, not stretch to match and carry dead space. */}
        <div className="mt-6 grid gap-4 md:grid-cols-3 md:items-start">
          <BreakdownPanel title="Gender" items={data.gender} />
          <BreakdownPanel title="Looking for" items={data.lookingFor} />
          <BreakdownPanel title="Age" items={data.ages} labelWidth="w-10" />
        </div>
        <BreakdownPanel
          title="Schools"
          items={data.schools}
          labelWidth="w-[12rem]"
          columns
          className="mt-4"
        />
      </section>

      <section className="mt-14 space-y-4">
        <Panel>
          <SectionHeading eyebrow="Growth" title="Top referrers" aside={`${data.referrers.length} codes used`} />
          <div className="mt-5">
            {data.referrers.length === 0 ? (
              <p className="text-[13px] text-ivory/45">No referrals yet.</p>
            ) : (
              <DataTable
                head={
                  <>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Code</Th>
                    <Th className="text-right">Verified</Th>
                    <Th className="pr-0 text-right">Total</Th>
                  </>
                }
              >
                {data.referrers.map((r) => (
                  <tr key={r.code}>
                    <Td className="font-medium text-ivory">{r.name}</Td>
                    <Td className="text-ivory/70">{r.email}</Td>
                    <Td>
                      <code className="text-[12px] text-ivory/70">{r.code}</code>
                    </Td>
                    <Td className="text-right">
                      <Tag tone="ok">{r.verified}</Tag>
                    </Td>
                    <Td className="pr-0 text-right tabular-nums">{r.total}</Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Needs a look"
            title="Suspect emails"
            aside={suspects.length ? "Not a school domain we know" : undefined}
          />
          <div className="mt-5">
            {suspects.length === 0 ? (
              <p className="text-[13px] text-ivory/45">Every address is on a known school domain.</p>
            ) : (
              <DataTable
                head={
                  <>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>School</Th>
                    <Th className="pr-0 text-right">Phone</Th>
                  </>
                }
              >
                {suspects.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openUser(u.id)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.04]"
                  >
                    <Td className="font-medium text-ivory">{u.firstName || "?"}</Td>
                    <Td className="text-ivory/70">{u.email}</Td>
                    <Td className="text-ivory/70">{u.school || "—"}</Td>
                    <Td className="pr-0 text-right">
                      <Tag tone={u.phoneVerified ? "ok" : "bad"}>{u.phoneVerified ? "yes" : "no"}</Tag>
                    </Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        </Panel>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Everyone"
          title={`All users (${data.users.length})`}
          aside="Open a card to page through profiles"
        />

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search users</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/45"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, school, code, phone"
              className={cn(
                "h-11 w-full rounded-full border border-white/12 bg-white/[0.08] pl-11 pr-4",
                "text-[14px] text-ivory placeholder:text-white/40",
                "transition-colors duration-200 focus:border-sage-light/70 focus:bg-white/[0.12] focus:outline-none",
              )}
            />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter users">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "h-9 rounded-full px-4 text-[13px] font-medium transition-colors duration-200",
                    active
                      ? "bg-ivory text-ink"
                      : "liquid-glass bg-ivory/10 text-ivory/85 hover:bg-ivory/20 hover:text-ivory",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-[13px] text-ivory/45">
          Showing {visible.length} of {data.users.length}
        </p>

        {visible.length === 0 ? (
          <p className="mt-10 text-center text-[15px] text-ivory/50">No one matches that.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" role="list">
            {visible.map((u) => (
              <li key={u.id}>
                <UserCard user={u} onOpen={() => openUser(u.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {viewerIndex !== null && visible[viewerIndex] ? (
        <ProfileViewer
          users={visible}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={closeViewer}
          onDeleted={handleDeleted}
        />
      ) : null}
    </AdminShell>
  );
}
