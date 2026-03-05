import { describe, it, expect } from "vitest";
import { macd } from "../macd";

function linearSeries(start: number, step: number, length: number): number[] {
  return Array.from({ length }, (_, i) => start + i * step);
}

describe("macd()", () => {
  it("returns three numeric fields", () => {
    const series = linearSeries(100, 1, 50);
    const result = macd(series);
    expect(typeof result.macdLine).toBe("number");
    expect(typeof result.signalLine).toBe("number");
    expect(typeof result.histogram).toBe("number");
  });

  it("histogram equals macdLine minus signalLine", () => {
    const series = linearSeries(100, 0.5, 50);
    const { macdLine, signalLine, histogram } = macd(series);
    expect(histogram).toBeCloseTo(macdLine - signalLine, 8);
  });

  it("flat series produces macdLine near zero", () => {
    const series = Array(50).fill(100) as number[];
    const { macdLine } = macd(series);
    expect(Math.abs(macdLine)).toBeLessThan(0.001);
  });

  it("uptrend: macdLine positive (fast EMA > slow EMA)", () => {
    // Strong uptrend: fast EMA catches up quicker than slow EMA
    const series = linearSeries(100, 5, 60);
    const { macdLine } = macd(series);
    expect(macdLine).toBeGreaterThan(0);
  });

  it("downtrend: macdLine negative", () => {
    const series = linearSeries(200, -5, 60);
    const { macdLine } = macd(series);
    expect(macdLine).toBeLessThan(0);
  });

  it("throws when not enough data", () => {
    expect(() => macd(linearSeries(100, 1, 10))).toThrow("Not enough data for MACD");
  });
});
