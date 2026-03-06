import { NextRequest, NextResponse } from "next/server";
import { fetchTicker24h } from "@/lib/binance/client";
import { buildMarketContext } from "@/lib/services/marketContext";
import { SYMBOLS, TIMEFRAMES } from "@/lib/config";
import { isRateLimited } from "@/lib/rateLimit";
import { ContextBatchError, MarketContext } from "@/types/market";

function parseTickerPriceChangePct(
  tickers: Record<string, { priceChangePercent: string }>,
  symbol: string
): number | undefined {
  const raw = tickers[symbol]?.priceChangePercent;
  if (raw === undefined) return undefined;

  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const timeframe = searchParams.get("timeframe");

  if (!timeframe || !TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json(
      { error: `Invalid timeframe. Valid: ${TIMEFRAMES.join(", ")}` },
      { status: 400 }
    );
  }

  // Batch mode: ?symbols=BTCUSDT,ETHUSDT&timeframe=4h
  const symbolsParam = searchParams.get("symbols");
  if (symbolsParam) {
    const includeMeta = searchParams.get("includeMeta") === "1";
    const requested = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
    const invalid = requested.filter((s) => !SYMBOLS.includes(s));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid symbols: ${invalid.join(", ")}. Valid: ${SYMBOLS.join(", ")}` },
        { status: 400 }
      );
    }
    // Process in chunks of 50 to avoid overwhelming Binance on cold start
    const CHUNK_SIZE = 50;
    const results: MarketContext[] = [];
    const errors: ContextBatchError[] = [];

    for (let i = 0; i < requested.length; i += CHUNK_SIZE) {
      const chunk = requested.slice(i, i + CHUNK_SIZE);
      let tickers: Record<string, { priceChangePercent: string }> = {};

      try {
        tickers = await fetchTicker24h(chunk);
      } catch {
        tickers = {};
      }

      const settled = await Promise.allSettled(
        chunk.map((symbol) =>
          buildMarketContext(symbol, timeframe, {
            priceChangePct24h: parseTickerPriceChangePct(tickers, symbol),
          })
        )
      );

      settled.forEach((entry, index) => {
        const symbol = chunk[index];
        if (entry.status === "fulfilled") {
          results.push(entry.value);
          return;
        }

        const message = entry.reason instanceof Error ? entry.reason.message : "Unknown error";
        errors.push({ symbol, error: message });
      });
    }

    if (!includeMeta) {
      return NextResponse.json(results);
    }

    return NextResponse.json({
      timeframe,
      results,
      errors,
      requestedCount: requested.length,
      fulfilledCount: results.length,
      failedCount: errors.length,
    });
  }

  // Single mode: ?symbol=BTCUSDT&timeframe=4h
  const symbol = searchParams.get("symbol")?.toUpperCase();
  if (!symbol || !SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: `Invalid symbol. Valid: ${SYMBOLS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    let tickers: Record<string, { priceChangePercent: string }> = {};

    try {
      tickers = await fetchTicker24h([symbol]);
    } catch {
      tickers = {};
    }

    const ctx = await buildMarketContext(symbol, timeframe, {
      priceChangePct24h: parseTickerPriceChangePct(tickers, symbol),
    });
    return NextResponse.json(ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
