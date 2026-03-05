import { fetchOHLCV } from "@/lib/binance/client";
import { ema, rsi, volumeRatio, priceRange, classifyMarketState, macd } from "@/lib/indicators";
import { MarketContext } from "@/types/market";

function round(v: number, d: number) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

export async function buildMarketContext(
  symbol: string,
  timeframe: string
): Promise<MarketContext> {
  const candles = await fetchOHLCV(symbol, timeframe);

  if (candles.length < 201) {
    throw new Error(`Not enough candles for ${symbol}/${timeframe}: got ${candles.length}`);
  }

  const closes = candles.map((c) => c.close);
  const price  = closes[closes.length - 1];

  // Price change % vs open of current candle
  const open   = candles[candles.length - 1].open;
  const priceChangePct = ((price - open) / open) * 100;

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
    ema20:            round(ema20, 2),
    ema50:            round(ema50, 2),
    ema200:           round(ema200, 2),
    rsi14:            round(rsi14, 1),
    volumeRatioPct:   Math.round(volRatio * 100),
    macdLine:         round(macdResult.macdLine, 2),
    macdSignal:       round(macdResult.signalLine, 2),
    macdHistogram:    round(macdResult.histogram, 2),
    updatedAt:        new Date().toISOString(),
  };
}
