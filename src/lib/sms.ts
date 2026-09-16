import twilio from "twilio";
import { prisma } from "@/lib/db";

/**
 * Transactional texts: a new match landed, a match went mutual. The Wednesday
 * broadcast lives in wednesdayBroadcastSms.ts because it batches and dedupes.
 *
 * Every send goes through sendSmsToUser so consent is checked in exactly one
 * place — no verified number, or consent withdrawn, means no text.
 */

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  if (!_client) _client = twilio(sid, token);
  return _client;
}

export function getSiteBase(): string {
  return (
    process.env.BROADCAST_SITE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "https://www.daisyweekly.com"
  ).replace(/\/$/, "");
}

export function getSupportEmail(): string {
  return process.env.BROADCAST_SUPPORT_EMAIL || "hello@joindaisy.com";
}

export function newMatchBody(alongsideExisting = false): string {
  // Someone who already has a match needs to be told this is a second one,
  // or they open the dashboard, see the match they already knew about, and
  // assume the text was a duplicate.
  const lead = alongsideExisting
    ? "Daisy 🌼 someone rerolled and you got a second match."
    : "Daisy 🌼 someone rerolled and you got a match.";
  return lead + "\nOpen your dashboard to see them.\n\n" + `👉 ${getSiteBase()}/dashboard`;
}

export function mutualBody(partnerName: string | null): string {
  const who = partnerName?.trim() || "your match";
  return (
    `Daisy 🌼 it's mutual with ${who}!\n` +
    "Their contact info is on your dashboard.\n\n" +
    `👉 ${getSiteBase()}/dashboard`
  );
}

/**
 * Best effort. True when Twilio accepted the message. Never throws: a failed
 * text must not undo the match or decision that triggered it.
 */
export async function sendSmsToUser(userId: string, body: string): Promise<boolean> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  const client = getClient();
  if (!client || !from) {
    console.warn("sms: Twilio env missing, skipping text to", userId);
    return false;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, phoneVerified: true, smsConsent: true },
    });
    if (!user?.phoneNumber || !user.phoneVerified || !user.smsConsent) return false;
    await client.messages.create({ to: user.phoneNumber, from, body });
    return true;
  } catch (error) {
    console.error("sms: send failed for", userId, error);
    return false;
  }
}

export function notifyNewMatch(userId: string, alongsideExisting = false): Promise<boolean> {
  return sendSmsToUser(userId, newMatchBody(alongsideExisting));
}

export function notifyMutual(userId: string, partnerName: string | null): Promise<boolean> {
  return sendSmsToUser(userId, mutualBody(partnerName));
}
