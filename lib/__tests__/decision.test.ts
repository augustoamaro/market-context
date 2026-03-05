import { describe, expect, it } from "vitest";
import { computeDecision, computeMultiTFConsensus, deriveAlignment } from "../decision";
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
    ema12: 51000,
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
  return ["15m", "1h", "4h", "1d", "1w"].map((tf) => ({
    timeframe: tf,
    ema12: 51000,
    ema20: 50500,
    ema50: 49000,
    ema200: 45000,
    rsi14: 58,
    volumeRatioX: 1.5,
    alignment,
  }));
}

function makeConsensus(rows: MultiTFRow[]) {
  return computeMultiTFConsensus(rows);
}

describe("computeDecision()", () => {
  it("UP + expansion + bullish consensus -> HIGH CONVICTION", () => {
    const rows = makeRows("bullish");
    const result = computeDecision(makeCtx(), rows, makeConsensus(rows));
    expect(result.signal).toBe("UP");
    expect(result.label).toBe("HIGH CONVICTION");
    expect(result.confidenceScore).toBeGreaterThan(70);
  });

  it("DOWN + expansion + bearish TFs -> HIGH CONVICTION bearish", () => {
    const ctx = makeCtx({ trend: "down", pricePositionPct: 20 });
    const rows = makeRows("bearish");
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    expect(result.signal).toBe("DOWN");
    expect(result.label).toBe("HIGH CONVICTION");
  });

  it("equilibrium + mid-range -> NO TRADE", () => {
    const ctx = makeCtx({ marketState: "equilibrium", pricePositionPct: 50 });
    const rows = makeRows();
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    expect(result.signal).toBe("WAIT");
    expect(result.label).toBe("NO TRADE");
    expect(result.confidenceScore).toBe(0);
  });

  it("sideways trend -> WAIT signal", () => {
    const ctx = makeCtx({ trend: "sideways" });
    const rows = makeRows("sideways");
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    expect(result.signal).toBe("WAIT");
  });

  it("RSI > 75 -> momentum step is warn", () => {
    const ctx = makeCtx({ rsi14: 78 });
    const rows = makeRows();
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    const momentumStep = result.steps.find((step) => step.id === "momentum");
    expect(momentumStep?.status).toBe("warn");
  });

  it("mid-range position -> position step is bad", () => {
    const ctx = makeCtx({ pricePositionPct: 50, marketState: "expansion" });
    const rows = makeRows();
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    const positionStep = result.steps.find((step) => step.id === "position");
    expect(positionStep?.status).toBe("bad");
  });

  it("always returns 6 steps including MTF conflict", () => {
    const rows = makeRows();
    const result = computeDecision(makeCtx(), rows, makeConsensus(rows));
    expect(result.steps).toHaveLength(6);
    expect(result.steps.map((step) => step.id)).toEqual([
      "trend",
      "mtf-conflict",
      "regime",
      "momentum",
      "position",
      "volume",
    ]);
  });

  it("confidenceScore is capped at 100", () => {
    const rows = makeRows();
    const result = computeDecision(makeCtx(), rows, makeConsensus(rows));
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  });

  it("scoreBreakdown sums to confidenceScore", () => {
    const rows = makeRows();
    const result = computeDecision(makeCtx(), rows, makeConsensus(rows));
    const { trend, regime, position, momentum, volume } = result.scoreBreakdown;
    expect(trend + regime + position + momentum + volume).toBe(result.confidenceScore);
  });

  it("scoreBreakdown has correct max dimensions", () => {
    const rows = makeRows();
    const result = computeDecision(makeCtx(), rows, makeConsensus(rows));
    const breakdown = result.scoreBreakdown;
    expect(breakdown.trend).toBeLessThanOrEqual(30);
    expect(breakdown.regime).toBeLessThanOrEqual(20);
    expect(breakdown.position).toBeLessThanOrEqual(20);
    expect(breakdown.momentum).toBeLessThanOrEqual(15);
    expect(breakdown.volume).toBeLessThanOrEqual(15);
  });

  it("volume >= 130% -> volume score 15 and step ok", () => {
    const ctx = makeCtx({ volumeRatioPct: 150 });
    const rows = makeRows();
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    expect(result.scoreBreakdown.volume).toBe(15);
    const volumeStep = result.steps.find((step) => step.id === "volume");
    expect(volumeStep?.status).toBe("ok");
  });

  it("volume 100-129% -> volume score 10", () => {
    const ctx = makeCtx({ volumeRatioPct: 110 });
    const rows = makeRows();
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    expect(result.scoreBreakdown.volume).toBe(10);
  });

  it("volume 70-99% -> volume score 5 and step warn", () => {
    const ctx = makeCtx({ volumeRatioPct: 80 });
    const rows = makeRows();
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    expect(result.scoreBreakdown.volume).toBe(5);
    const volumeStep = result.steps.find((step) => step.id === "volume");
    expect(volumeStep?.status).toBe("warn");
  });

  it("volume < 70% -> volume score 0 and step bad", () => {
    const ctx = makeCtx({ volumeRatioPct: 50 });
    const rows = makeRows();
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    expect(result.scoreBreakdown.volume).toBe(0);
    const volumeStep = result.steps.find((step) => step.id === "volume");
    expect(volumeStep?.status).toBe("bad");
  });

  it("NO TRADE path returns zero scoreBreakdown", () => {
    const ctx = makeCtx({ marketState: "equilibrium", pricePositionPct: 50 });
    const rows = makeRows();
    const result = computeDecision(ctx, rows, makeConsensus(rows));
    const breakdown = result.scoreBreakdown;
    expect(
      breakdown.trend +
      breakdown.regime +
      breakdown.position +
      breakdown.momentum +
      breakdown.volume
    ).toBe(0);
  });

  it("high HTF vs LTF conflict forces WAIT", () => {
    const rows: MultiTFRow[] = [
      { timeframe: "15m", ema12: 49500, ema20: 50000, ema50: 50500, ema200: 52000, rsi14: 42, volumeRatioX: 1.1, alignment: "bearish" },
      { timeframe: "1h", ema12: 49800, ema20: 50200, ema50: 50800, ema200: 52500, rsi14: 44, volumeRatioX: 1.0, alignment: "bearish" },
      { timeframe: "4h", ema12: 51000, ema20: 50800, ema50: 50000, ema200: 47000, rsi14: 56, volumeRatioX: 1.2, alignment: "sideways" },
      { timeframe: "1d", ema12: 53500, ema20: 53000, ema50: 52000, ema200: 48000, rsi14: 60, volumeRatioX: 1.3, alignment: "bullish" },
      { timeframe: "1w", ema12: 55000, ema20: 54500, ema50: 53000, ema200: 49000, rsi14: 62, volumeRatioX: 1.4, alignment: "bullish" },
    ];
    const consensus = computeMultiTFConsensus(rows);
    const result = computeDecision(makeCtx(), rows, consensus);
    expect(consensus.conflictLevel).toBe("high");
    expect(result.signal).toBe("WAIT");
    expect(result.label).toBe("LOW CONVICTION");
  });
});

describe("deriveAlignment()", () => {
  it("bullish: ema20 > ema50 > ema200", () => {
    expect(deriveAlignment(320, 300, 200, 100)).toBe("bullish");
  });

  it("bearish: ema20 < ema50 < ema200", () => {
    expect(deriveAlignment(80, 100, 200, 300)).toBe("bearish");
  });

  it("sideways: mixed order", () => {
    expect(deriveAlignment(220, 200, 320, 300)).toBe("sideways");
  });

  it("uses ema12 as bullish tie-break above ema200", () => {
    expect(deriveAlignment(220, 210, 215, 100)).toBe("bullish");
  });

  it("uses ema12 as bearish tie-break below ema200", () => {
    expect(deriveAlignment(80, 90, 85, 100)).toBe("bearish");
  });
});

describe("computeMultiTFConsensus()", () => {
  it("all bullish rows return bullish with no conflict", () => {
    const rows = makeRows("bullish");
    const result = computeMultiTFConsensus(rows);
    expect(result.direction).toBe("bullish");
    expect(result.conflictLevel).toBe("none");
    expect(result.weightedScore).toBe(100);
  });

  it("HTF bullish and LTF bearish returns high conflict", () => {
    const rows: MultiTFRow[] = [
      { timeframe: "15m", ema12: 95, ema20: 96, ema50: 97, ema200: 100, rsi14: 40, volumeRatioX: 1.0, alignment: "bearish" },
      { timeframe: "1h", ema12: 96, ema20: 97, ema50: 98, ema200: 100, rsi14: 42, volumeRatioX: 1.0, alignment: "bearish" },
      { timeframe: "4h", ema12: 110, ema20: 108, ema50: 107, ema200: 100, rsi14: 55, volumeRatioX: 1.1, alignment: "sideways" },
      { timeframe: "1d", ema12: 120, ema20: 118, ema50: 112, ema200: 100, rsi14: 60, volumeRatioX: 1.2, alignment: "bullish" },
      { timeframe: "1w", ema12: 130, ema20: 125, ema50: 118, ema200: 100, rsi14: 62, volumeRatioX: 1.3, alignment: "bullish" },
    ];
    const result = computeMultiTFConsensus(rows);
    expect(result.direction).toBe("bullish");
    expect(result.conflictLevel).toBe("high");
    expect(result.htfBias).toBe("bullish");
    expect(result.ltfBias).toBe("bearish");
  });

  it("all sideways rows return mixed with score 0", () => {
    const rows = makeRows("sideways");
    const result = computeMultiTFConsensus(rows);
    expect(result.direction).toBe("mixed");
    expect(result.weightedScore).toBe(0);
  });
});
