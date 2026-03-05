import { NextRequest, NextResponse } from "next/server";
import { SYMBOLS, TIMEFRAMES, CANDLE_LIMIT } from "@/lib/config";
import { fetchOHLCV } from "@/lib/binance/client";
import { ema, rsi, volumeRatio, priceRange, macd } from "@/lib/indicators";
import { isRateLimited } from "@/lib/rateLimit";

function round(v: number, d: number) {
  return Math.round(v * 10 ** d) / 10 ** d;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const timeframe = searchParams.get("timeframe");

  if (!symbol || !SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: `Invalid symbol. Valid: ${SYMBOLS.join(", ")}` }, { status: 400 });
  }
  if (!timeframe || !TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json({ error: `Invalid timeframe. Valid: ${TIMEFRAMES.join(", ")}` }, { status: 400 });
  }

  const candles = await fetchOHLCV(symbol, timeframe);
  const now = Date.now();

  const last = candles[candles.length - 1];         // current (forming) candle
  const prev = candles[candles.length - 2];         // last closed candle

  // Candle progress
  const timeframeDurationMs = last.openTime - candles[candles.length - 2].openTime;
  const elapsedMs = now - last.openTime;
  const progressPct = Math.min(100, Math.round((elapsedMs / timeframeDurationMs) * 100));

  // Compute all indicators on full array (same as production)
  const closes = candles.map((c) => c.close);
  const ema20  = round(ema(closes, 20),  2);
  const ema50  = round(ema(closes, 50),  2);
  const ema200 = round(ema(closes, 200), 2);
  const rsi14  = round(rsi(closes, 14),  1);
  const volRat = volumeRatio(candles, 20, now);
  const range  = priceRange(candles);
  const macdResult = macd(closes);

  // 24h change
  const target24h = last.openTime - 24 * 60 * 60 * 1000;
  const idx24h = candles.findIndex((c) => c.openTime >= target24h);
  const close24hAgo = idx24h > 0 ? candles[idx24h].close : candles[0].close;
  const priceChangePct = round(((last.close - close24hAgo) / close24hAgo) * 100, 2);

  // Warnings
  const warnings: string[] = [];
  if (candles.length < 500) {
    warnings.push(
      `EMA(200) seeded from ${candles.length} candles — may diverge from TradingView. ` +
      `Set DEFAULT_LIMIT >= 500 for better accuracy.`
    );
  }
  if (progressPct < 80) {
    warnings.push(
      `Current candle is ${progressPct}% complete — volumeRatioPct, RSI, and MACD will change at close.`
    );
  }
  if (idx24h === -1 || idx24h === 0) {
    warnings.push(
      `Not enough history to compute a true 24h change — using oldest available candle as reference.`
    );
  }

  return NextResponse.json({
    symbol,
    timeframe,
    candleCount: candles.length,
    configuredLimit: CANDLE_LIMIT,

    lastClosed: {
      openTime:  new Date(prev.openTime).toISOString(),
      closeTime: new Date(prev.closeTime).toISOString(),
      open:      round(prev.open,  2),
      high:      round(prev.high,  2),
      low:       round(prev.low,   2),
      close:     round(prev.close, 2),
      volume:    round(prev.volume, 4),
    },

    current: {
      openTime:    new Date(last.openTime).toISOString(),
      closeTime:   new Date(last.closeTime).toISOString(),
      open:        round(last.open,  2),
      high:        round(last.high,  2),
      low:         round(last.low,   2),
      close:       round(last.close, 2),
      volume:      round(last.volume, 4),
      progressPct,
    },

    computed: {
      ema20,
      ema50,
      ema200,
      rsi14,
      volumeRatioPct:   Math.round(volRat * 100),
      macdLine:         round(macdResult.macdLine,    2),
      macdSignal:       round(macdResult.signalLine,  2),
      macdHistogram:    round(macdResult.histogram,   2),
      pricePositionPct: Math.round(range.pricePositionPct),
      rangeHigh:        round(range.high, 2),
      rangeLow:         round(range.low,  2),
      priceChangePct24h: priceChangePct,
    },

    howToVerify: [
      `1. Open TradingView → ${symbol} → ${timeframe}`,
      "2. Add indicators: EMA(20), EMA(50), EMA(200), RSI(14), MACD(12,26,9), Volume MA(20)",
      "3. Compare 'lastClosed' candle OHLCV and 'computed' values above",
      "4. EMA(200) may differ slightly due to seed history depth (see warnings)",
    ],

    warnings,
  });
}
