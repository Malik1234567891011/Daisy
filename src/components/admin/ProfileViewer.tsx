"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Trash2, X } from "lucide-react";
import type { AdminUser } from "@/lib/admin-stats";
import { hasNoFace } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";
import { GlassIconButton, Tag, formatDate, initialOf } from "./primitives";
import { parseIdealHangouts } from "@/lib/idealHangouts";

/**
 * One profile at a time, in the same portrait card the sign-in screen uses:
 * a frosted bezel, a photograph filling the top, and the facts on an ink slab
 * underneath. The card crops the photo to fit, so clicking it opens the whole
 * frame uncropped. Arrow keys page through the list; Escape closes.
 */

interface ProfileViewerProps {
  users: AdminUser[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

function Field({
  label,
  value,
  muted = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory/45">{label}</dt>
      <dd className={cn("mt-0.5 break-words text-[13px]", muted ? "text-ivory/40" : "text-ivory/90")}>
        {value}
      </dd>
    </div>
  );
}

export default function ProfileViewer({
  users,
  index,
  onIndexChange,
  onClose,
  onDeleted,
}: ProfileViewerProps) {
  const user = users[index];
  const [confirming, setConfirming] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Paging keeps the blown-up photo open — it is the fastest way to scan the
  // lot — but a profile with no photo has nothing to hold it open.
  useEffect(() => {
    if (!user?.photoUrl) setZoomed(false);
  }, [user?.photoUrl]);

  // A half-finished delete must not carry over to the next profile.
  useEffect(() => {
    setConfirming(false);
    setError("");
  }, [user?.id]);

  useEffect(() => {
    const count = users.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomed) setZoomed(false);
        else onClose();
      } else if (e.key === "ArrowLeft") onIndexChange((index - 1 + count) % count);
      else if (e.key === "ArrowRight") onIndexChange((index + 1) % count);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [index, users.length, onIndexChange, onClose, zoomed]);

  if (!user) return null;

  const count = users.length;
  const prev = () => onIndexChange((index - 1 + count) % count);
  const next = () => onIndexChange((index + 1) % count);

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }
      onDeleted(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
      setConfirming(false);
    }
  }

  const heading = user.firstName ?? "?";
  const referredBy = user.referredByName
    ? `${user.referredByName} (${user.referredBy})`
    : user.referredBy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${heading} — profile ${index + 1} of ${count}`}
        className={cn(
          "relative z-10 w-full max-w-[420px] rounded-[32px] border border-white/40 p-[15px]",
          "bg-white/15 backdrop-blur-xl",
          "shadow-[0_28px_80px_rgba(20,24,15,0.28),inset_0_1px_0_rgba(255,255,255,0.5)]",
        )}
      >
        <div className="flex h-[min(820px,calc(100dvh-4.5rem))] flex-col overflow-hidden rounded-[22px] bg-ink">
          {/* The photograph takes whatever height the facts leave it. */}
          <div className="relative min-h-0 flex-1 bg-ink-soft">
            {user.photoUrl ? (
              <button
                type="button"
                onClick={() => setZoomed(true)}
                aria-label={`See ${heading}'s photo uncropped`}
                className="absolute inset-0 block cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-display text-[140px] leading-none text-ivory/15">
                {initialOf(user.firstName)}
              </div>
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink via-ink/60 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/60 to-transparent"
            />

            <div className="absolute inset-x-3 top-3 flex items-center justify-between">
              <div className="flex gap-2">
                <GlassIconButton onClick={prev} aria-label="Previous profile" disabled={count < 2}>
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </GlassIconButton>
                <GlassIconButton onClick={next} aria-label="Next profile" disabled={count < 2}>
                  <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </GlassIconButton>
              </div>
              <div className="flex gap-2">
                {user.photoUrl ? (
                  <GlassIconButton onClick={() => setZoomed(true)} aria-label="See the photo uncropped">
                    <Maximize2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  </GlassIconButton>
                ) : null}
                <GlassIconButton onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </GlassIconButton>
              </div>
            </div>

            <div className="absolute inset-x-5 bottom-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <h2 className="font-display text-[38px] leading-none text-ivory">
                  {heading}
                  {user.age ? `, ${user.age}` : ""}
                </h2>
                {user.suspect ? <Tag tone="warn">suspect email</Tag> : null}
                {hasNoFace(user) ? <Tag tone="bad">no face</Tag> : null}
                {user.photoExplicit ? <Tag tone="bad">explicit</Tag> : null}
              </div>
              <p className="mt-2 truncate text-[13px] text-ivory/75">{user.email}</p>
              <p className="mt-0.5 truncate text-[13px] text-ivory/55">
                {[user.school, user.gender, user.genderPreference ? `into ${user.genderPreference}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          <div className="shrink-0 overflow-y-auto px-5 pb-5 pt-4">
            <div className="flex flex-wrap gap-1.5">
              <Tag tone={user.phoneVerified ? "ok" : "bad"}>
                {user.phoneVerified ? "phone verified" : "no phone"}
              </Tag>
              <Tag tone={user.onboardingComplete ? "ok" : "neutral"}>
                {user.onboardingComplete ? "onboarded" : "onboarding incomplete"}
              </Tag>
              {user.photoUrl ? null : <Tag tone="neutral">no photo</Tag>}
              {user.rerollCredits > 0 ? (
                <Tag tone="warn">
                  {user.rerollCredits} reroll credit{user.rerollCredits === 1 ? "" : "s"}
                </Tag>
              ) : null}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {/* The hero line truncates both of these; here they read in full. */}
              <Field label="School" value={user.school || "—"} muted={!user.school} />
              <Field label="Major" value={user.major || "—"} muted={!user.major} />
              <Field label="Intentions" value={user.intentions || "—"} muted={!user.intentions} />
              <Field label="Vibe" value={user.vibe || "—"} muted={!user.vibe} />
              <Field
                label="Hangout"
                value={parseIdealHangouts(user.idealHangout).join(", ") || "—"}
                muted={!user.idealHangout}
              />
              <Field
                label="Phone"
                value={user.phoneVerified && user.phoneNumber ? user.phoneNumber : "not verified"}
                muted={!user.phoneVerified}
              />
              <Field
                label="Referral code"
                value={user.referralCode ? <code className="text-[12px]">{user.referralCode}</code> : "—"}
                muted={!user.referralCode}
              />
              <Field label="Referred by" value={referredBy || "—"} muted={!referredBy} />
              <Field
                label="Photo check"
                value={
                  !user.photoUrl
                    ? "no photo"
                    : !user.photoCheckedAt
                      ? "not screened"
                      : `${hasNoFace(user) ? "no face" : "face"} — ${user.photoCheckReason || "no reason given"}`
                }
                muted={!user.photoCheckedAt}
                className="col-span-2"
              />
              <Field
                label="Interests"
                value={user.interests.length ? user.interests.join(", ") : "—"}
                muted={!user.interests.length}
                className="col-span-2"
              />
            </dl>

            <div className="mt-5 border-t border-white/10 pt-4">
              {confirming ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[13px] text-[#f0afaf]">
                    Delete {heading}? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={deleting}
                      className="h-9 rounded-full border border-white/12 bg-white/[0.06] px-4 text-[13px] text-ivory transition-colors hover:bg-white/[0.12] disabled:opacity-50"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="h-9 rounded-full bg-error px-4 text-[13px] font-semibold text-ivory transition-colors hover:bg-[#c95a5a] disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-error/40 bg-error/10 text-[13px] font-medium text-[#f0afaf] transition-colors hover:bg-error/20"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Delete user
                </button>
              )}
              {error ? (
                <p role="alert" className="mt-2 text-[13px] text-[#f0afaf]">
                  {error}
                </p>
              ) : null}
            </div>

            <p className="mt-4 text-center text-[12px] text-ivory/40">
              {index + 1} / {count} &middot; joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {zoomed && user.photoUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${heading} — full photo`}
          onClick={() => setZoomed(false)}
          className="absolute inset-0 z-20 flex cursor-zoom-out items-center justify-center bg-ink/95 p-4 backdrop-blur-md sm:p-10"
        >
          {/* Contained, not cropped: the whole frame, whatever shape it is. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.photoUrl}
            alt={`${heading}, full photo`}
            className="max-h-full max-w-full rounded-[18px] object-contain shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
          />
          <GlassIconButton
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(false);
            }}
            aria-label="Close the full photo"
            className="absolute right-4 top-4 sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </GlassIconButton>
          <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[12px] text-ivory/45">
            {heading} &middot; click anywhere or press Esc to go back
          </p>
        </div>
      ) : null}
    </div>
  );
}
