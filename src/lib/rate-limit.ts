import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

type Window = "10 m" | "15 m" | "1 h";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(limit: number, window: Window) {
  const key = `${limit}:${window}`;
  const cached = limiterCache.get(key);
  if (cached) return cached;
  if (!redis) return null;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: "rl:daisy",
  });
  limiterCache.set(key, limiter);
  return limiter;
}

export function getRequestIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export async function checkRateLimit(opts: {
  keyPrefix: string;
  identifier: string;
  limit: number;
  window: Window;
}) {
  const limiter = getLimiter(opts.limit, opts.window);
  if (!limiter) {
    return { limited: false, reason: "no-redis" as const };
  }

  const key = `${opts.keyPrefix}:${opts.identifier}`;
  const res = await limiter.limit(key);
  return {
    limited: !res.success,
    remaining: res.remaining,
    reset: res.reset,
    reason: "ok" as const,
  };
}
