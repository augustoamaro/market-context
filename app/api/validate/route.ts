import { NextRequest, NextResponse } from "next/server";
import { fetchTicker24h } from "@/lib/binance/client";
import { SYMBOLS, TIMEFRAMES, CANDLE_LIMIT } from "@/lib/config";
import { fetchOHLCV } from "@/lib/binance/client";
import { candleProgressPct, splitClosedAndFormingCandles } from "@/lib/candles";
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

  const rawCandles = await fetchOHLCV(symbol, timeframe);
  const now = Date.now();
  const { closed: candles, forming } = splitClosedAndFormingCandles(rawCandles, now);

  if (candles.length < 201) {
    return NextResponse.json(
      { error: `Not enough candles for ${symbol}/${timeframe}: got ${candles.length}` },
      { status: 500 }
    );
  }

  const lastClosed = candles[candles.length - 1];
  const progressPct =
    forming === null
      ? 100
      : candleProgressPct(forming, lastClosed, now);

  // Compute the production signal inputs on confirmed candles only.
  const closes = candles.map((c) => c.close);
  const ema20  = round(ema(closes, 20),  2);
  const ema50  = round(ema(closes, 50),  2);
  const ema200 = round(ema(closes, 200), 2);
  const rsi14  = round(rsi(closes, 14),  1);
  const volRat = volumeRatio(candles, 20);
  const range  = priceRange(candles);
  const macdResult = macd(closes);

  // 24h change anchored on the latest confirmed close.
  const target24h = lastClosed.closeTime - 24 * 60 * 60 * 1000;
  const idx24h = candles.findIndex((c) => c.closeTime >= target24h);
  const close24hAgo = idx24h > 0 ? candles[idx24h].close : candles[0].close;
  const fallbackPriceChangePct = round(((lastClosed.close - close24hAgo) / close24hAgo) * 100, 2);
  let priceChangePct = fallbackPriceChangePct;
  let priceChangeSource = "confirmed_candles_fallback";

  try {
    const tickers = await fetchTicker24h([symbol]);
    const tickerValue = Number.parseFloat(tickers[symbol]?.priceChangePercent ?? "");
    if (Number.isFinite(tickerValue)) {
      priceChangePct = round(tickerValue, 2);
      priceChangeSource = "ticker_24h";
    }
  } catch {
    priceChangePct = fallbackPriceChangePct;
  }

  // Warnings
  const warnings: string[] = [];
  if (candles.length < 500) {
    warnings.push(
      `EMA(200) seeded from ${candles.length} candles — may diverge from TradingView. ` +
      `Set DEFAULT_LIMIT >= 500 for better accuracy.`
    );
  }
  if (forming && progressPct < 100) {
    warnings.push(
      `Current candle is ${progressPct}% complete — production signals ignore it and only use confirmed candles.`
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
    mode: "confirmed",
    candleCount: candles.length,
    configuredLimit: CANDLE_LIMIT,

    lastClosed: {
      openTime:  new Date(lastClosed.openTime).toISOString(),
      closeTime: new Date(lastClosed.closeTime).toISOString(),
      open:      round(lastClosed.open,  2),
      high:      round(lastClosed.high,  2),
      low:       round(lastClosed.low,   2),
      close:     round(lastClosed.close, 2),
      volume:    round(lastClosed.volume, 4),
    },

    current: forming
      ? {
          openTime:    new Date(forming.openTime).toISOString(),
          closeTime:   new Date(forming.closeTime).toISOString(),
          open:        round(forming.open,  2),
          high:        round(forming.high,  2),
          low:         round(forming.low,   2),
          close:       round(forming.close, 2),
          volume:      round(forming.volume, 4),
          progressPct,
        }
      : null,

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
      priceChangeSource,
    },

    howToVerify: [
      `1. Open TradingView → ${symbol} → ${timeframe}`,
      "2. Add indicators: EMA(20), EMA(50), EMA(200), RSI(14), MACD(12,26,9), Volume MA(20)",
      "3. Compare 'lastClosed' candle OHLCV and the 'computed' block above",
      "4. Ignore the forming candle for signal validation; it is exposed only as preview",
    ],

    warnings,
  });
}
