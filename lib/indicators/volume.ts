import { OHLCV } from "@/lib/binance/types";
import { VOLUME_LOOKBACK } from "@/lib/config";

export function volumeRatio(candles: OHLCV[], lookback: number = VOLUME_LOOKBACK): number {
  if (candles.length < lookback + 1) {
    throw new Error(`Not enough data for volume ratio: need ${lookback + 1}, got ${candles.length}`);
  }
  const recent = candles.slice(-lookback - 1);
  const avg = recent.slice(0, lookback).reduce((s, c) => s + c.volume, 0) / lookback;
  if (avg === 0) return 1;
  return recent[recent.length - 1].volume / avg;
}
