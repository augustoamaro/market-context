import { OHLCV } from "@/lib/binance/types";

export interface CandleSplit {
  closed: OHLCV[];
  forming: OHLCV | null;
}

export function splitClosedAndFormingCandles(
  candles: OHLCV[],
  now: number = Date.now()
): CandleSplit {
  if (candles.length === 0) {
    return { closed: [], forming: null };
  }

  const last = candles[candles.length - 1];
  if (now < last.closeTime) {
    return {
      closed: candles.slice(0, -1),
      forming: last,
    };
  }

  return {
    closed: candles,
    forming: null,
  };
}

export function candleProgressPct(
  current: OHLCV,
  previous: OHLCV,
  now: number = Date.now()
): number {
  const timeframeDurationMs = current.openTime - previous.openTime;
  if (timeframeDurationMs <= 0) return 100;

  const elapsedMs = now - current.openTime;
  return Math.max(0, Math.min(100, Math.round((elapsedMs / timeframeDurationMs) * 100)));
}
