import { fetchOHLCV } from "@/lib/binance/client";
import { ema, rsi, volumeRatio, priceRange, classifyMarketState, macd } from "@/lib/indicators";
import { splitClosedAndFormingCandles } from "@/lib/candles";
import { MarketContext } from "@/types/market";

interface BuildMarketContextOptions {
  priceChangePct24h?: number;
}

function round(v: number, d: number) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

export async function buildMarketContext(
  symbol: string,
  timeframe: string,
  options: BuildMarketContextOptions = {}
): Promise<MarketContext> {
  const rawCandles = await fetchOHLCV(symbol, timeframe);
  const { closed: candles } = splitClosedAndFormingCandles(rawCandles);

  if (candles.length < 201) {
    throw new Error(`Not enough candles for ${symbol}/${timeframe}: got ${candles.length}`);
  }

  const closes = candles.map((c) => c.close);
  const lastClosed = candles[candles.length - 1];
  const price = lastClosed.close;

  // 24h change based on the latest confirmed close, not the forming candle.
  const target24h = lastClosed.closeTime - 24 * 60 * 60 * 1000;
  const idx24h = candles.findIndex((c) => c.closeTime >= target24h);
  const close24hAgo = idx24h > 0 ? candles[idx24h].close : candles[0].close;
  const fallbackPriceChangePct = ((price - close24hAgo) / close24hAgo) * 100;
  const priceChangePct = options.priceChangePct24h ?? fallbackPriceChangePct;

  const ema12  = ema(closes, 12);
  const ema20  = ema(closes, 20);
  const ema50  = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const rsi14  = rsi(closes, 14);

  const volRatio  = volumeRatio(candles);
  const range     = priceRange(candles);
  const macdResult = macd(closes);

  let trend: MarketContext["trend"] = "sideways";
  if (ema20 > ema50 && ema50 > ema200) trend = "up";
  else if (ema20 < ema50 && ema50 < ema200) trend = "down";

  const { state: marketState, reason: stateReason } = classifyMarketState(
    range.pricePositionPct,
    volRatio
  );

  return {
    symbol,
    timeframe,
    price:            round(price, 2),
    priceChangePct:   round(priceChangePct, 2),
    trend,
    marketState,
    stateReason,
    pricePositionPct: Math.round(range.pricePositionPct),
    rangeHigh:        round(range.high, 2),
    rangeLow:         round(range.low, 2),
    ema12:            round(ema12, 2),
    ema20:            round(ema20, 2),
    ema50:            round(ema50, 2),
    ema200:           round(ema200, 2),
    rsi14:            round(rsi14, 1),
    volumeRatioPct:   Math.round(volRatio * 100),
    macdLine:         round(macdResult.macdLine, 2),
    macdSignal:       round(macdResult.signalLine, 2),
    macdHistogram:    round(macdResult.histogram, 2),
    updatedAt:        new Date(lastClosed.closeTime).toISOString(),
  };
}
