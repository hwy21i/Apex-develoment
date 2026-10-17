/**
 * Simple in-memory sliding-window rate limiter for sensitive endpoints.
 * Protects against credential stuffing and brute-force attacks.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 1 minute)
  max?: number;      // Maximum allowed attempts in window (default: 10)
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const windowMs = options.windowMs ?? 60 * 1000;
  const max = options.max ?? 10;
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || now > existing.resetTime) {
    const record: RateLimitRecord = { count: 1, resetTime: now + windowMs };
    store.set(key, record);
    return { allowed: true, remaining: max - 1, resetTime: record.resetTime };
  }

  existing.count += 1;

  if (existing.count > max) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
  }

  return { allowed: true, remaining: max - existing.count, resetTime: existing.resetTime };
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "127.0.0.1"
  );
}

