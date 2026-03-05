import {
  MarketContext,
  MultiTFRow,
  Decision,
  DecisionStep,
  ScoreBreakdown,
  Signal,
  ConvictionLabel,
  StepStatus,
} from "@/types/market";

function trendStep(ctx: MarketContext, rows: MultiTFRow[]): DecisionStep {
  const bullish = rows.filter((r) => r.alignment === "bullish").length;
  const bearish = rows.filter((r) => r.alignment === "bearish").length;
  const total = rows.length;
  let status: StepStatus = "warn";
  let details = `${bullish}/${total} timeframes bullish`;

  if (ctx.trend === "up" && bullish >= 3) {
    status = "ok";
    details = `${bullish}/${total} timeframes aligned bullish`;
  } else if (ctx.trend === "down" && bearish >= 3) {
    status = "ok";
    details = `${bearish}/${total} timeframes aligned bearish`;
  } else if (ctx.trend === "sideways") {
    status = "bad";
    details = "No clear EMA alignment";
  }

  return {
    id: "trend",
    title: "Trend Alignment",
    description: "EMA stack across key timeframes",
    status,
    details,
  };
}

function regimeStep(ctx: MarketContext): DecisionStep {
  const status: StepStatus = ctx.marketState === "expansion" ? "ok" : "warn";
  return {
    id: "regime",
    title: "Regime",
    description: "Expansion vs Equilibrium",
    status,
    details: `${ctx.marketState.toUpperCase()} — ${ctx.stateReason}`,
  };
}

function momentumStep(ctx: MarketContext): DecisionStep {
  let status: StepStatus = "ok";
  let details = `RSI ${ctx.rsi14.toFixed(1)}`;

  if (ctx.rsi14 > 75) {
    status = "warn";
    details = `RSI ${ctx.rsi14.toFixed(1)} — overbought`;
  } else if (ctx.rsi14 < 25) {
    status = "warn";
    details = `RSI ${ctx.rsi14.toFixed(1)} — oversold`;
  } else if (ctx.rsi14 >= 45 && ctx.rsi14 <= 65) {
    status = "ok";
    details = `RSI ${ctx.rsi14.toFixed(1)} — healthy range`;
  }

  return {
    id: "momentum",
    title: "Momentum",
    description: "RSI confirmation / divergence",
    status,
    details,
  };
}

function positionStep(ctx: MarketContext): DecisionStep {
  const pct = ctx.pricePositionPct;
  let status: StepStatus = "ok";
  let details = `Range position: ${Math.round(pct)}%`;

  if (pct >= 40 && pct <= 60) {
    status = "bad";
    details = `Mid-range (${Math.round(pct)}%) — low-conviction zone`;
  } else if (pct > 90 || pct < 10) {
    status = "warn";
    details = `Extreme position (${Math.round(pct)}%) — extended`;
  }

  return {
    id: "position",
    title: "Position",
    description: "Avoid mid-range entries",
    status,
    details,
  };
}

function volumeStep(ctx: MarketContext): DecisionStep {
  const pct = ctx.volumeRatioPct;
  let status: StepStatus;
  let details: string;

  if (pct >= 130) {
    status = "ok";
    details = `Volume ratio: ${Math.round(pct)}% — strong expansion`;
  } else if (pct >= 100) {
    status = "ok";
    details = `Volume ratio: ${Math.round(pct)}% — above average`;
  } else if (pct >= 70) {
    status = "warn";
    details = `Volume ratio: ${Math.round(pct)}% — moderate`;
  } else {
    status = "bad";
    details = `Volume ratio: ${Math.round(pct)}% — thin, no confirmation`;
  }

  return {
    id: "volume",
    title: "Volume",
    description: "Volume expansion confirmation",
    status,
    details,
  };
}

// --- Scoring helpers (weights: Trend 30, Regime 20, Position 20, Momentum 15, Volume 15) ---

function scoreTrend(ctx: MarketContext, rows: MultiTFRow[]): number {
  if (ctx.trend === "sideways") return 0;
  const aligned = rows.filter(
    (r) =>
      (ctx.trend === "up" && r.alignment === "bullish") ||
      (ctx.trend === "down" && r.alignment === "bearish")
  ).length;
  if (aligned >= 4) return 30;
  if (aligned >= 3) return 22;
  if (aligned >= 2) return 12;
  if (aligned >= 1) return 5;
  return 0;
}

function scoreRegime(ctx: MarketContext): number {
  return ctx.marketState === "expansion" ? 20 : 10;
}

function scorePosition(ctx: MarketContext): number {
  const pct = ctx.pricePositionPct;
  if (pct >= 40 && pct <= 60) return 0;
  if ((pct >= 25 && pct < 40) || (pct > 60 && pct <= 75)) return 12;
  return 20; // < 25 or > 75 — range extremes
}

function scoreMomentum(ctx: MarketContext): number {
  const rsi = ctx.rsi14;
  if (rsi >= 45 && rsi <= 65) return 15;
  if ((rsi >= 35 && rsi < 45) || (rsi > 65 && rsi <= 75)) return 10;
  if ((rsi >= 25 && rsi < 35) || (rsi > 75 && rsi <= 85)) return 5;
  return 0;
}

function scoreVolume(ctx: MarketContext): number {
  const pct = ctx.volumeRatioPct;
  if (pct >= 130) return 15;
  if (pct >= 100) return 10;
  if (pct >= 70) return 5;
  return 0;
}

export function computeDecision(ctx: MarketContext, rows: MultiTFRow[]): Decision {
  const steps = [
    trendStep(ctx, rows),
    regimeStep(ctx),
    momentumStep(ctx),
    positionStep(ctx),
    volumeStep(ctx),
  ];

  const isMidRange = ctx.pricePositionPct >= 40 && ctx.pricePositionPct <= 60;

  // No-trade rule
  if (ctx.marketState === "equilibrium" && isMidRange) {
    const zeroBreakdown: ScoreBreakdown = { trend: 0, regime: 0, position: 0, momentum: 0, volume: 0 };
    return {
      signal: "WAIT",
      label: "NO TRADE",
      confidenceScore: 0,
      scoreBreakdown: zeroBreakdown,
      reasons: [
        "Market in equilibrium",
        `Price in mid-range (${Math.round(ctx.pricePositionPct)}%)`,
        "No directional conviction",
      ],
      steps,
    };
  }

  const scoreBreakdown: ScoreBreakdown = {
    trend: scoreTrend(ctx, rows),
    regime: scoreRegime(ctx),
    position: scorePosition(ctx),
    momentum: scoreMomentum(ctx),
    volume: scoreVolume(ctx),
  };
  const confidenceScore = Math.min(
    100,
    scoreBreakdown.trend + scoreBreakdown.regime + scoreBreakdown.position +
    scoreBreakdown.momentum + scoreBreakdown.volume
  );

  let signal: Signal = "WAIT";
  let label: ConvictionLabel = "LOW CONVICTION";
  const reasons: string[] = [];

  if (ctx.trend === "up" && ctx.marketState === "expansion") {
    signal = "UP";
    if (confidenceScore >= 65) {
      label = "HIGH CONVICTION";
      reasons.push("Trend and regime aligned bullish");
      if (ctx.rsi14 < 70) reasons.push("RSI confirms momentum");
      if (scoreBreakdown.volume >= 10) reasons.push("Volume confirming expansion");
    } else {
      label = "LOW CONVICTION";
      reasons.push("Bullish setup with caveats");
      if (scoreBreakdown.position === 0) reasons.push("Mid-range entry — low conviction zone");
      if (scoreBreakdown.volume === 0) reasons.push("Low volume — no confirmation");
    }
  } else if (ctx.trend === "down" && ctx.marketState === "expansion") {
    signal = "DOWN";
    if (confidenceScore >= 65) {
      label = "HIGH CONVICTION";
      reasons.push("Trend and regime aligned bearish");
      if (scoreBreakdown.volume >= 10) reasons.push("Volume confirming expansion");
    } else {
      label = "LOW CONVICTION";
      reasons.push("Bearish setup with caveats");
      if (scoreBreakdown.position === 0) reasons.push("Mid-range entry — low conviction zone");
      if (scoreBreakdown.volume === 0) reasons.push("Low volume — no confirmation");
    }
  } else {
    signal = "WAIT";
    label = "LOW CONVICTION";
    reasons.push("Mixed signals — wait for clearer setup");
    if (ctx.marketState === "equilibrium") reasons.push("Market in equilibrium");
    if (ctx.trend === "sideways") reasons.push("No clear trend direction");
  }

  return { signal, label, confidenceScore, scoreBreakdown, reasons, steps };
}

export function deriveAlignment(
  ema20: number,
  ema50: number,
  ema200: number
): "bullish" | "bearish" | "sideways" {
  if (ema20 > ema50 && ema50 > ema200) return "bullish";
  if (ema20 < ema50 && ema50 < ema200) return "bearish";
  return "sideways";
}
