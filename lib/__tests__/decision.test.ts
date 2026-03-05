import { describe, expect, it } from "vitest";
import { computeDecision, computeGlobalDecision, computeMultiTFConsensus, deriveAlignment } from "../decision";
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

function makeRow(
  timeframe: MultiTFRow["timeframe"],
  alignment: MultiTFRow["alignment"]
): MultiTFRow {
  const bullishBase = { ema12: 51000, ema20: 50500, ema50: 49000, ema200: 45000 };
  const bearishBase = { ema12: 45000, ema20: 45500, ema50: 47000, ema200: 50000 };
  const sidewaysBase = { ema12: 49950, ema20: 50000, ema50: 49800, ema200: 48000 };
  const base =
    alignment === "bullish"
      ? bullishBase
      : alignment === "bearish"
        ? bearishBase
        : sidewaysBase;

  return {
    timeframe,
    ...base,
    rsi14: 58,
    volumeRatioX: 1.5,
    alignment,
  };
}

function makeRows(alignments: Record<string, MultiTFRow["alignment"]>): MultiTFRow[] {
  return ["15m", "1h", "4h", "1d", "1w"].map((timeframe) =>
    makeRow(timeframe, alignments[timeframe] ?? "sideways")
  );
}

describe("deriveAlignment()", () => {
  it("requires slopeUp for bullish alignment", () => {
    expect(deriveAlignment(320, 300, 200, 100)).toBe("bullish");
  });

  it("requires slopeDown for bearish alignment", () => {
    expect(deriveAlignment(80, 100, 200, 300)).toBe("bearish");
  });

  it("returns sideways when ema stack is bullish but ema12 is below ema20", () => {
    expect(deriveAlignment(290, 300, 200, 100)).toBe("sideways");
  });

  it("returns sideways for mixed order", () => {
    expect(deriveAlignment(220, 200, 320, 300)).toBe("sideways");
  });
});

describe("computeMultiTFConsensus()", () => {
  it("all bullish rows return +100, bullish, none, LONG_BIAS", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "bullish",
      "1d": "bullish",
      "1w": "bullish",
    });

    const result = computeMultiTFConsensus(rows);

    expect(result.weightedScore).toBe(100);
    expect(result.direction).toBe("bullish");
    expect(result.conflictLevel).toBe("none");
    expect(result.recommendedAction).toBe("LONG_BIAS");
    expect(result.positionSizeModifier).toBe(1);
  });

  it("HTF bearish and LTF bullish returns high conflict and WAIT action", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "sideways",
      "1d": "bearish",
      "1w": "bearish",
    });

    const result = computeMultiTFConsensus(rows);

    expect(result.htfBias).toBe("bearish");
    expect(result.ltfBias).toBe("bullish");
    expect(result.conflictLevel).toBe("high");
    expect(result.recommendedAction).toBe("WAIT");
    expect(result.positionSizeModifier).toBe(0.25);
  });

  it("all sideways rows return mixed, none conflict and WAIT action", () => {
    const rows = makeRows({
      "15m": "sideways",
      "1h": "sideways",
      "4h": "sideways",
      "1d": "sideways",
      "1w": "sideways",
    });

    const result = computeMultiTFConsensus(rows);

    expect(result.weightedScore).toBe(0);
    expect(result.direction).toBe("mixed");
    expect(result.conflictLevel).toBe("none");
    expect(result.recommendedAction).toBe("WAIT");
  });

  it("weak +20 bullish score still returns WAIT action", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "sideways",
      "1d": "sideways",
      "1w": "sideways",
    });

    const result = computeMultiTFConsensus(rows);

    expect(result.weightedScore).toBe(20);
    expect(result.direction).toBe("bullish");
    expect(result.recommendedAction).toBe("WAIT");
    expect(result.positionSizeModifier).toBe(0.5);
  });
});

describe("computeDecision()", () => {
  it("returns HIGH CONVICTION for clean bullish expansion", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "bullish",
      "1d": "bullish",
      "1w": "bullish",
    });

    const result = computeDecision(makeCtx(), rows, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("UP");
    expect(result.label).toBe("HIGH CONVICTION");
    expect(result.consensus.recommendedAction).toBe("LONG_BIAS");
  });

  it("conflict high + equilibrium + position 15% returns WATCH", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "sideways",
      "1d": "bearish",
      "1w": "bearish",
    });

    const ctx = makeCtx({
      marketState: "equilibrium",
      pricePositionPct: 15,
      trend: "up",
    });

    const result = computeDecision(ctx, rows, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("WATCH");
    expect(result.label).toBe("LOW CONVICTION — Range apenas");
    expect(result.consensus.positionSizeModifier).toBe(0.25);
  });

  it("conflict high + expansion + mid-range returns WAIT", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "sideways",
      "1d": "bearish",
      "1w": "bearish",
    });

    const ctx = makeCtx({
      marketState: "expansion",
      pricePositionPct: 50,
      trend: "up",
    });

    const result = computeDecision(ctx, rows, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("WAIT");
    expect(result.label).toBe("NO TRADE — Conflito HTF/LTF");
  });

  it("always includes mtf_conflict step", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "bullish",
      "1d": "bullish",
      "1w": "bullish",
    });

    const result = computeDecision(makeCtx(), rows, computeMultiTFConsensus(rows));

    expect(result.steps.map((step) => step.id)).toContain("mtf_conflict");
  });
});

describe("computeGlobalDecision()", () => {
  it("returns READY LONG for long bias with favorable execution context", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "bullish",
      "1d": "bullish",
      "1w": "bullish",
    });
    const executionCtx = makeCtx({
      timeframe: "1h",
      pricePositionPct: 20,
      rsi14: 52,
      marketState: "expansion",
    });

    const result = computeGlobalDecision(rows, executionCtx, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("READY");
    expect(result.bias).toBe("LONG");
  });

  it("returns WATCH LONG when execution context is mid-range", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "bullish",
      "1d": "bullish",
      "1w": "bullish",
    });
    const executionCtx = makeCtx({
      timeframe: "1h",
      pricePositionPct: 50,
      rsi14: 52,
    });

    const result = computeGlobalDecision(rows, executionCtx, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("WATCH");
    expect(result.bias).toBe("LONG");
  });

  it("returns WATCH LONG when execution RSI is overbought", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "bullish",
      "1d": "bullish",
      "1w": "bullish",
    });
    const executionCtx = makeCtx({
      timeframe: "1h",
      pricePositionPct: 20,
      rsi14: 78,
    });

    const result = computeGlobalDecision(rows, executionCtx, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("WATCH");
    expect(result.bias).toBe("LONG");
  });

  it("returns WAIT NONE for high conflict in expansion mid-range", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "sideways",
      "1d": "bearish",
      "1w": "bearish",
    });
    const executionCtx = makeCtx({
      timeframe: "1h",
      marketState: "expansion",
      pricePositionPct: 50,
    });

    const result = computeGlobalDecision(rows, executionCtx, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("WAIT");
    expect(result.bias).toBe("NONE");
  });

  it("returns WATCH NONE for high conflict range fade exception", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "sideways",
      "1d": "bearish",
      "1w": "bearish",
    });
    const executionCtx = makeCtx({
      timeframe: "1h",
      marketState: "equilibrium",
      pricePositionPct: 15,
    });

    const result = computeGlobalDecision(rows, executionCtx, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("WATCH");
    expect(result.bias).toBe("NONE");
  });

  it("returns WAIT NONE when consensus itself is weak", () => {
    const rows = makeRows({
      "15m": "bullish",
      "1h": "bullish",
      "4h": "sideways",
      "1d": "sideways",
      "1w": "sideways",
    });
    const executionCtx = makeCtx({
      timeframe: "1h",
      pricePositionPct: 20,
      rsi14: 52,
    });

    const result = computeGlobalDecision(rows, executionCtx, computeMultiTFConsensus(rows));

    expect(result.signal).toBe("WAIT");
    expect(result.bias).toBe("NONE");
  });
});
