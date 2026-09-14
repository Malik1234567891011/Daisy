import { IDEAL_HANGOUTS } from "@/lib/constants";

/**
 * Ideal hangout is a multi-select stored in one `idealHangout` column as a
 * comma-separated list of IDEAL_HANGOUTS values — the same shape `ethnicity`
 * uses (see lib/ethnicityPreference.ts), and for the same reason: the column
 * started life single-valued and rows already hold a bare value like
 * "coffee", which parses as a one-item list without touching the database.
 */

export function parseIdealHangouts(raw: string | null | undefined): string[] {
  if (raw == null || !String(raw).trim()) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stringifyIdealHangouts(values: string[]): string {
  return values.map((s) => s.trim()).filter(Boolean).join(",");
}

const VALID_HANGOUTS = new Set(IDEAL_HANGOUTS.map((o) => o.value));

/**
 * Parse anything a client sent and keep only current IDEAL_HANGOUTS values,
 * so a hand-rolled request can't write labels the ranking will never match on.
 */
export function sanitizeIdealHangouts(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return parseIdealHangouts(raw).filter((v) => VALID_HANGOUTS.has(v));
}
