import { clsx, type ClassValue } from "clsx";
import { randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function nanoid(size = 8): string {
  return randomBytes(size).toString("base64url").slice(0, size);
}

export function formatAge(age: number | null): string {
  if (!age) return "";
  return `${age} years old`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
