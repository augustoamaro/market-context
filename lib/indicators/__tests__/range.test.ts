import { describe, expect, it } from "vitest";
import { OHLCV } from "@/lib/binance/types";
import { priceRange } from "../range";

const TF_1H = 60 * 60 * 1000;

function makeCandle(index: number, high: number, low: number, close: number): OHLCV {
  const openTime = index * TF_1H;

  return {
    openTime,
    open: close,
    high,
    low,
    close,
    volume: 100,
    closeTime: openTime + TF_1H - 1,
  };
}

describe("priceRange()", () => {
  it("measures the latest close against the previous closed window", () => {
    const candles = Array.from({ length: 21 }, (_, index) =>
      makeCandle(index, 100, 80, 90)
    );

    candles[20] = makeCandle(20, 106, 99, 105);

    const result = priceRange(candles, 20);

    expect(result.high).toBe(100);
    expect(result.low).toBe(80);
    expect(result.pricePositionPct).toBeGreaterThan(100);
  });

  it("can mark breakdowns below the previous range", () => {
    const candles = Array.from({ length: 21 }, (_, index) =>
      makeCandle(index, 100, 80, 90)
    );

    candles[20] = makeCandle(20, 82, 74, 75);

    const result = priceRange(candles, 20);

    expect(result.pricePositionPct).toBeLessThan(0);
  });

  it("throws when there is no reference window before the latest close", () => {
    const candles = Array.from({ length: 20 }, (_, index) =>
      makeCandle(index, 100, 80, 90)
    );

    expect(() => priceRange(candles, 20)).toThrow("need 21");
  });
});
