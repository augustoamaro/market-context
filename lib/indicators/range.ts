import { OHLCV } from "@/lib/binance/types";
import { RANGE_LOOKBACK } from "@/lib/config";

export interface RangeResult {
  high: number;
  low: number;
  pricePositionPct: number;
}

export function priceRange(candles: OHLCV[], lookback: number = RANGE_LOOKBACK): RangeResult {
  if (candles.length < lookback) {
    throw new Error(`Not enough data for range: need ${lookback}, got ${candles.length}`);
  }
  const window = candles.slice(-lookback);
  const high = Math.max(...window.map((c) => c.high));
  const low  = Math.min(...window.map((c) => c.low));
  const price = candles[candles.length - 1].close;
  const rangeSize = high - low;
  const pricePositionPct = rangeSize === 0 ? 50 : ((price - low) / rangeSize) * 100;
  return { high, low, pricePositionPct };
}
