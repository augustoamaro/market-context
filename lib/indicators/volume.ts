import { OHLCV } from "@/lib/binance/types";
import { VOLUME_LOOKBACK } from "@/lib/config";

export function volumeRatio(
  candles: OHLCV[],
  lookback: number = VOLUME_LOOKBACK,
  now: number = Date.now()
): number {
  if (candles.length < lookback + 1) {
    throw new Error(`Not enough data for volume ratio: need ${lookback + 1}, got ${candles.length}`);
  }
  const recent = candles.slice(-lookback - 1);
  const avg = recent.slice(0, lookback).reduce((s, c) => s + c.volume, 0) / lookback;
  if (avg === 0) return 1;

  const last = recent[recent.length - 1];
  let currentVolume = last.volume;

  // Normalize the open (forming) candle's volume by the fraction of the period elapsed.
  // Without this, a candle 10% through its period appears at ~10% volume vs the average
  // of fully-closed candles, inflating or deflating the ratio depending on early activity.
  const isOpen = now < last.closeTime;
  if (isOpen && candles.length >= 2) {
    const timeframeDurationMs =
      candles[candles.length - 1].openTime - candles[candles.length - 2].openTime;
    const elapsed = Math.max(0.05, Math.min(1, (now - last.openTime) / timeframeDurationMs));
    currentVolume = last.volume / elapsed;
  }

  return currentVolume / avg;
}
