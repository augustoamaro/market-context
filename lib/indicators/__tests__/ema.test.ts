import { describe, it, expect } from "vitest";
import { ema } from "../ema";

describe("ema()", () => {
  it("flat series returns the same value", () => {
    const result = ema([5, 5, 5, 5, 5], 3);
    expect(result).toBeCloseTo(5, 6);
  });

  it("seed equals SMA when series length equals period", () => {
    // [2, 4, 6] → SMA seed = 4, no further smoothing
    const result = ema([2, 4, 6], 3);
    expect(result).toBeCloseTo(4, 6);
  });

  it("applies exponential smoothing correctly", () => {
    // period=3, k=0.5
    // seed = (1+2+3)/3 = 2
    // ema[3] = 4*0.5 + 2*0.5 = 3
    // ema[4] = 5*0.5 + 3*0.5 = 4
    const result = ema([1, 2, 3, 4, 5], 3);
    expect(result).toBeCloseTo(4, 6);
  });

  it("single value above the seed converges upward", () => {
    const low  = ema([1, 1, 1, 1, 1, 100], 3);
    const flat = ema([1, 1, 1, 1, 1, 1], 3);
    expect(low).toBeGreaterThan(flat);
  });

  it("throws when not enough data", () => {
    expect(() => ema([1, 2], 5)).toThrow("Not enough data for EMA(5)");
  });

  it("larger period produces slower reaction than smaller period", () => {
    const series = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 100];
    const fast = ema(series, 3);
    const slow = ema(series, 9);
    expect(fast).toBeGreaterThan(slow);
  });
});
