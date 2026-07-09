import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory fixed-window rate limiter, keyed by client IP + bucket
 * name. Good enough as a basic abuse guard for a single-instance deployment.
 * (For multi-instance production, swap the Map for Redis/Upstash.)
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Periodically drop expired buckets so the map doesn't grow forever. */
function sweep(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Best-effort client IP (behind a proxy/Vercel, x-forwarded-for is set). */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when ok = false). */
  retryAfter: number;
}

/** Count a hit for `key` and report whether it is within `limit` per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Rate-limit an incoming request. Returns a 429 response when the limit is
 * exceeded, or null when the request may proceed.
 */
export function enforceRateLimit(
  req: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const res = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs);
  if (res.ok) return null;
  return NextResponse.json(
    { ok: false, error: "tooManyRequests" },
    { status: 429, headers: { "Retry-After": String(res.retryAfter) } }
  );
}
