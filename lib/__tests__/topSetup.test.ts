import { describe, expect, it } from "vitest";
import { MarketContext } from "@/types/market";
import { pickTopGlobalSetup } from "../topSetup";

function makeCtx(timeframe: string, overrides: Partial<MarketContext> = {}): MarketContext {
  return {
    symbol: "BTCUSDT",
    timeframe,
    price: 50000,
    priceChangePct: 1.2,
    trend: "up",
    marketState: "expansion",
    stateReason: "High volume breakout",
    pricePositionPct: timeframe === "1h" ? 20 : 75,
    rangeHigh: 55000,
    rangeLow: 45000,
    ema12: 51000,
    ema20: 50500,
    ema50: 49000,
    ema200: 45000,
    rsi14: timeframe === "1h" ? 52 : 58,
    volumeRatioPct: 150,
    macdLine: 120,
    macdSignal: 80,
    macdHistogram: 40,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeBullishSet(symbol: string): MarketContext[] {
  return ["15m", "1h", "4h", "1d", "1w"].map((timeframe) =>
    makeCtx(timeframe, { symbol })
  );
}

describe("pickTopGlobalSetup()", () => {
  it("prefers READY setups and ignores weaker developing setups", () => {
    const btc = makeBullishSet("BTCUSDT");
    const eth = makeBullishSet("ETHUSDT").map((ctx) =>
      ctx.timeframe === "1h"
        ? { ...ctx, pricePositionPct: 50 }
        : ctx
    );

    const result = pickTopGlobalSetup({
      BTCUSDT: btc,
      ETHUSDT: eth,
    });

    expect(result).toEqual({
      symbol: "BTCUSDT",
      signal: "READY",
      bias: "BULLISH",
      qualityScore: 92,
    });
  });

  it("ignores symbols with incomplete timeframe coverage", () => {
    const btc = makeBullishSet("BTCUSDT");
    const eth = makeBullishSet("ETHUSDT").filter((ctx) => ctx.timeframe !== "1w");

    const result = pickTopGlobalSetup({
      BTCUSDT: btc,
      ETHUSDT: eth,
    });

    expect(result?.symbol).toBe("BTCUSDT");
  });

  it("selects the highest weighted global consensus among READY setups", () => {
    const btc = makeBullishSet("BTCUSDT");
    const sol = [
      makeCtx("15m", { symbol: "SOLUSDT", trend: "up", ema12: 52000, ema20: 51500, ema50: 50500, ema200: 49000 }),
      makeCtx("1h", { symbol: "SOLUSDT", trend: "up", pricePositionPct: 20 }),
      makeCtx("4h", { symbol: "SOLUSDT", trend: "up" }),
      makeCtx("1d", { symbol: "SOLUSDT", trend: "sideways", ema12: 50000, ema20: 50000, ema50: 49800, ema200: 48000 }),
      makeCtx("1w", { symbol: "SOLUSDT", trend: "sideways", ema12: 50000, ema20: 50000, ema50: 49800, ema200: 48000 }),
    ];

    const result = pickTopGlobalSetup({
      BTCUSDT: btc,
      SOLUSDT: sol,
    });

    expect(result?.symbol).toBe("BTCUSDT");
    expect(result?.qualityScore).toBe(92);
  });
});
