interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Retrieve cached value if available. Returns null if not cached.
 * Supports Stale-While-Revalidate (returns stale data immediately while fresh is fetched).
 */
export function getCached<T = unknown>(key: string): T | null {
  const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (mem) {
    return mem.data;
  }

  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(`apex_swr_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        memoryCache.set(key, parsed as CacheEntry<unknown>);
        return parsed.data;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return null;
}

/**
 * Check if the cache entry is still within its fresh TTL window.
 */
export function isCacheFresh(key: string): boolean {
  const mem = memoryCache.get(key);
  if (!mem) return false;
  return Date.now() - mem.timestamp < mem.ttlMs;
}

/**
 * Store data in memory and sessionStorage.
 */
export function setCached<T = unknown>(key: string, data: T, ttlMs: number = 60_000): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttlMs,
  };
  memoryCache.set(key, entry as CacheEntry<unknown>);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`apex_swr_${key}`, JSON.stringify(entry));
    } catch {
      // Storage quota or privacy restriction
    }
  }
}

/**
 * Invalidate cache by key or matching prefix.
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        const toRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith("apex_swr_")) {
            toRemove.push(k);
          }
        }
        toRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {}
    }
    return;
  }

  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefix)) {
      memoryCache.delete(k);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(`apex_swr_${prefix}`)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }
}
