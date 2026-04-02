/** DB/API store comma-separated ethnicity labels (same as profile ethnicity). */

export function parseEthnicityPreference(raw: string | null | undefined): string[] {
  if (raw == null || !String(raw).trim()) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stringifyEthnicityPreference(values: string[]): string | undefined {
  const cleaned = values.map((s) => s.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(",") : undefined;
}
