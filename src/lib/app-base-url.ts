/**
 * Absolute origin for links in emails (password reset, etc.).
 * Set AUTH_URL or NEXTAUTH_URL in production (e.g. https://daisy.example.com).
 */
export function getAppBaseUrl(): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
