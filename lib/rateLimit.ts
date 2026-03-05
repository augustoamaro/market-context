// Sliding-window rate limiter — in-memory, per-IP
// Works for self-hosted (next start). On Vercel edge/serverless each instance
// has its own memory, so this provides best-effort protection.

const windows = new Map<string, number[]>();

// Periodically prune stale entries to avoid unbounded growth
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, times] of windows) {
    const trimmed = times.filter((t) => t > cutoff);
    if (trimmed.length === 0) windows.delete(key);
    else windows.set(key, trimmed);
  }
}, 60_000);

export function isRateLimited(
  ip: string,
  limit = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const times = (windows.get(ip) ?? []).filter((t) => t > cutoff);
  times.push(now);
  windows.set(ip, times);
  return times.length > limit;
}
