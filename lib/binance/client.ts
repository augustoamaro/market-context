import { BINANCE_BASE_URL, CACHE_TTL_MS, CANDLE_LIMIT } from "@/lib/config";
import { RawKline, OHLCV } from "./types";

interface CacheEntry {
  data: OHLCV[];
  expiresAt: number;
}

// Module-level cache (survives across requests in the same process)
const cache = new Map<string, CacheEntry>();

function parseKline(raw: RawKline): OHLCV {
  return {
    openTime: raw[0],
    open:     parseFloat(raw[1]),
    high:     parseFloat(raw[2]),
    low:      parseFloat(raw[3]),
    close:    parseFloat(raw[4]),
    volume:   parseFloat(raw[5]),
    closeTime: raw[6],
  };
}

export async function fetchOHLCV(
  symbol: string,
  interval: string,
  limit: number = CANDLE_LIMIT
): Promise<OHLCV[]> {
  const key = `${symbol}:${interval}`;
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const url = new URL(`${BINANCE_BASE_URL}/api/v3/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 }, // disable Next.js fetch cache
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Binance API error: ${res.status} ${res.statusText}`);
  }

  const raw: RawKline[] = await res.json();
  const data = raw.map(parseKline);

  cache.set(key, { data, expiresAt: now + CACHE_TTL_MS });

  return data;
}
