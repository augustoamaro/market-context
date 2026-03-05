import { describe, it, expect } from "vitest";
import { computeDecision, deriveAlignment } from "../decision";
import { MarketContext, MultiTFRow } from "@/types/market";

function makeCtx(overrides: Partial<MarketContext> = {}): MarketContext {
  return {
    symbol: "BTCUSDT",
    timeframe: "4h",
    price: 50000,
    priceChangePct: 1.2,
    trend: "up",
    marketState: "expansion",
    stateReason: "High volume breakout",
    pricePositionPct: 75,
    rangeHigh: 55000,
    rangeLow: 45000,
    ema20: 50500,
    ema50: 49000,
    ema200: 45000,
    rsi14: 58,
    volumeRatioPct: 150,
    macdLine: 120,
    macdSignal: 80,
    macdHistogram: 40,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRows(alignment: MultiTFRow["alignment"] = "bullish"): MultiTFRow[] {
  return ["15m", "1h", "4h", "1d"].map((tf) => ({
    timeframe: tf,
    ema20: 50500,
    ema50: 49000,
    ema200: 45000,
    rsi14: 58,
    volumeRatioX: 1.5,
    alignment,
  }));
}

describe("computeDecision()", () => {
  it("UP + expansion + 4 bullish TFs → HIGH CONVICTION", () => {
    const result = computeDecision(makeCtx(), makeRows("bullish"));
    expect(result.signal).toBe("UP");
    expect(result.label).toBe("HIGH CONVICTION");
    expect(result.confidenceScore).toBeGreaterThan(70);
  });

  it("DOWN + expansion + bearish TFs → HIGH CONVICTION bearish", () => {
    const ctx = makeCtx({ trend: "down", pricePositionPct: 20 });
    const rows = makeRows("bearish");
    const result = computeDecision(ctx, rows);
    expect(result.signal).toBe("DOWN");
    expect(result.label).toBe("HIGH CONVICTION");
  });

  it("equilibrium + mid-range → NO TRADE", () => {
    const ctx = makeCtx({ marketState: "equilibrium", pricePositionPct: 50 });
    const result = computeDecision(ctx, makeRows());
    expect(result.signal).toBe("WAIT");
    expect(result.label).toBe("NO TRADE");
    expect(result.confidenceScore).toBe(0);
  });

  it("sideways trend → WAIT signal", () => {
    const ctx = makeCtx({ trend: "sideways" });
    const result = computeDecision(ctx, makeRows("sideways"));
    expect(result.signal).toBe("WAIT");
  });

  it("RSI > 75 → momentum step is warn", () => {
    const ctx = makeCtx({ rsi14: 78 });
    const result = computeDecision(ctx, makeRows());
    const momentumStep = result.steps.find((s) => s.id === "momentum");
    expect(momentumStep?.status).toBe("warn");
  });

  it("mid-range position → position step is bad", () => {
    const ctx = makeCtx({ pricePositionPct: 50, marketState: "expansion" });
    const result = computeDecision(ctx, makeRows());
    const posStep = result.steps.find((s) => s.id === "position");
    expect(posStep?.status).toBe("bad");
  });

  it("always returns 4 steps", () => {
    const result = computeDecision(makeCtx(), makeRows());
    expect(result.steps).toHaveLength(4);
  });

  it("confidenceScore is capped at 100", () => {
    const result = computeDecision(makeCtx(), makeRows());
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  });
});

describe("deriveAlignment()", () => {
  it("bullish: ema20 > ema50 > ema200", () => {
    expect(deriveAlignment(300, 200, 100)).toBe("bullish");
  });

  it("bearish: ema20 < ema50 < ema200", () => {
    expect(deriveAlignment(100, 200, 300)).toBe("bearish");
  });

  it("sideways: mixed order", () => {
    expect(deriveAlignment(200, 100, 300)).toBe("sideways");
  });
});
