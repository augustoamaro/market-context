import { describe, it, expect } from "vitest";
import { volumeRatio } from "../volume";
import { OHLCV } from "@/lib/binance/types";

const TF_4H = 4 * 60 * 60 * 1000; // 4h in ms

function makeCandles(
  count: number,
  volume: number,
  openTimeStart = 0
): OHLCV[] {
  return Array.from({ length: count }, (_, i) => ({
    openTime:  openTimeStart + i * TF_4H,
    open: 100, high: 105, low: 95, close: 102,
    volume,
    closeTime: openTimeStart + i * TF_4H + TF_4H - 1,
  }));
}

describe("volumeRatio()", () => {
  it("closed candles: returns raw ratio unchanged", () => {
    // 20 closed candles at avg volume 100, last closed at 150
    const candles = makeCandles(21, 100);
    candles[20].volume = 150;
    // closeTime is in the past, so isOpen = false
    const ratio = volumeRatio(candles, 20, candles[20].closeTime + 1);
    expect(ratio).toBeCloseTo(1.5, 5);
  });

  it("open candle at 50% elapsed: normalizes volume upward", () => {
    // avg = 100, current candle has 60 volume after 50% of period
    // normalized = 60 / 0.5 = 120 → ratio = 1.2
    const candles = makeCandles(21, 100);
    const last = candles[20];
    const midpoint = last.openTime + TF_4H * 0.5;
    last.volume = 60;

    const ratio = volumeRatio(candles, 20, midpoint);
    expect(ratio).toBeCloseTo(1.2, 4);
  });

  it("open candle at 25% elapsed: normalizes volume upward", () => {
    // avg = 100, current = 50 volume after 25% → normalized = 200 → ratio = 2
    const candles = makeCandles(21, 100);
    const last = candles[20];
    const quarter = last.openTime + TF_4H * 0.25;
    last.volume = 50;

    const ratio = volumeRatio(candles, 20, quarter);
    expect(ratio).toBeCloseTo(2.0, 4);
  });

  it("open candle at 100% elapsed: no normalization (elapsed clamped to 1)", () => {
    const candles = makeCandles(21, 100);
    const last = candles[20];
    last.volume = 130;
    const atClose = last.openTime + TF_4H;

    const ratio = volumeRatio(candles, 20, atClose);
    expect(ratio).toBeCloseTo(1.3, 5);
  });

  it("elapsed clamped to minimum 0.05 to avoid division by zero", () => {
    const candles = makeCandles(21, 100);
    const last = candles[20];
    last.volume = 5;
    // now = openTime (0% elapsed)
    const ratio = volumeRatio(candles, 20, last.openTime);
    // 5 / 0.05 = 100 → ratio = 1.0
    expect(ratio).toBeCloseTo(1.0, 4);
  });

  it("throws when not enough candles", () => {
    const candles = makeCandles(5, 100);
    expect(() => volumeRatio(candles, 20)).toThrow();
  });

  it("returns 1 when average volume is zero", () => {
    const candles = makeCandles(21, 0);
    expect(volumeRatio(candles, 20)).toBe(1);
  });
});
