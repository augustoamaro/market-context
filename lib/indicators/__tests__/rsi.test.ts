import { describe, it, expect } from "vitest";
import { rsi } from "../rsi";

// Helper: build a series of constant gains from a starting price
function seriesWithGain(start: number, gain: number, length: number): number[] {
  const arr = [start];
  for (let i = 1; i < length; i++) arr.push(arr[i - 1] + gain);
  return arr;
}

describe("rsi()", () => {
  it("returns 100 when all candles are gains (no losses)", () => {
    const series = seriesWithGain(100, 1, 30);
    expect(rsi(series, 14)).toBe(100);
  });

  it("returns 0 when all candles are losses (no gains)", () => {
    const series = seriesWithGain(200, -1, 30);
    expect(rsi(series, 14)).toBe(0);
  });

  it("symmetric series stays near midpoint (between 40 and 60)", () => {
    // Wilder RMA on alternating moves converges near 50 but not exactly,
    // due to SMA seed asymmetry. We verify it stays in a neutral range.
    const series: number[] = [100];
    for (let i = 1; i < 60; i++) {
      series.push(series[i - 1] + (i % 2 === 0 ? 1 : -1));
    }
    const result = rsi(series, 14);
    expect(result).toBeGreaterThan(40);
    expect(result).toBeLessThan(60);
  });

  it("overbought zone (>70) after strong uptrend", () => {
    const series = seriesWithGain(100, 2, 30);
    expect(rsi(series, 14)).toBeGreaterThan(70);
  });

  it("oversold zone (<30) after strong downtrend", () => {
    const series = seriesWithGain(300, -3, 30);
    expect(rsi(series, 14)).toBeLessThan(30);
  });

  it("result is always between 0 and 100", () => {
    const series = [100, 110, 95, 120, 115, 130, 105, 125, 140, 135, 150, 145, 155, 160, 158, 162];
    const result = rsi(series, 14);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it("throws when not enough data", () => {
    expect(() => rsi([1, 2, 3], 14)).toThrow("Not enough data for RSI(14)");
  });
});
