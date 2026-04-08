import { createHash, randomBytes } from "crypto";

export function generatePasswordResetRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
