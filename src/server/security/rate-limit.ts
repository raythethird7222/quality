import { headers } from "next/headers";
import { RateLimitError } from "@/server/security/errors";

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export async function enforceRateLimit(
  keyPrefix: string,
  limit: number,
  windowMs: number
) {
  cleanupStaleEntries();

  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "local";
  const key = `${keyPrefix}:${forwardedFor.split(",")[0]?.trim() ?? "local"}`;
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new RateLimitError();
  }

  current.count += 1;
  store.set(key, current);
}
