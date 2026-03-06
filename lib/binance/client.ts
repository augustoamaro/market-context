import { BINANCE_BASE_URL, BINANCE_API_KEY, CACHE_TTL_MS, CANDLE_LIMIT } from "@/lib/config";
import { RawKline, OHLCV } from "./types";

interface CacheEntry {
  data: OHLCV[];
  expiresAt: number;
}

export interface Ticker24hEntry {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
}

interface TickerCacheEntry {
  data: Ticker24hEntry;
  expiresAt: number;
}

// Module-level cache (survives across requests in the same process)
const cache = new Map<string, CacheEntry>();
const tickerCache = new Map<string, TickerCacheEntry>();

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

  const headers: Record<string, string> = {};
  if (BINANCE_API_KEY) headers["X-MBX-APIKEY"] = BINANCE_API_KEY;

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 }, // disable Next.js fetch cache
    signal: AbortSignal.timeout(10_000),
    headers,
  });

  if (!res.ok) {
    throw new Error(`Binance API error: ${res.status} ${res.statusText}`);
  }

  const raw: RawKline[] = await res.json();
  const data = raw.map(parseKline);

  cache.set(key, { data, expiresAt: now + CACHE_TTL_MS });

  return data;
}

export async function fetchTicker24h(
  symbols: string[]
): Promise<Record<string, Ticker24hEntry>> {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase())));
  const now = Date.now();
  const result: Record<string, Ticker24hEntry> = {};
  const missing: string[] = [];

  for (const symbol of uniqueSymbols) {
    const cached = tickerCache.get(symbol);
    if (cached && cached.expiresAt > now) {
      result[symbol] = cached.data;
    } else {
      missing.push(symbol);
    }
  }

  if (missing.length > 0) {
    const url = new URL(`${BINANCE_BASE_URL}/api/v3/ticker/24hr`);
    url.searchParams.set("symbols", JSON.stringify(missing));

    const headers: Record<string, string> = {};
    if (BINANCE_API_KEY) headers["X-MBX-APIKEY"] = BINANCE_API_KEY;

    const res = await fetch(url.toString(), {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8_000),
      headers,
    });

    if (!res.ok) {
      throw new Error(`Binance ticker error: ${res.status} ${res.statusText}`);
    }

    const data: Ticker24hEntry[] = await res.json();
    for (const entry of data) {
      tickerCache.set(entry.symbol, { data: entry, expiresAt: now + CACHE_TTL_MS });
      result[entry.symbol] = entry;
    }
  }

  return result;
}
