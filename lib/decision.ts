import {
  MarketContext,
  MultiTFRow,
  Decision,
  DecisionStep,
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

export function computeDecision(ctx: MarketContext, rows: MultiTFRow[]): Decision {
  const steps = [
    trendStep(ctx, rows),
    regimeStep(ctx),
    momentumStep(ctx),
    positionStep(ctx),
  ];

  const isMidRange = ctx.pricePositionPct >= 40 && ctx.pricePositionPct <= 60;

  // No-trade rule
  if (ctx.marketState === "equilibrium" && isMidRange) {
    return {
      signal: "WAIT",
      label: "NO TRADE",
      confidenceScore: 0,
      reasons: [
        "Market in equilibrium",
        `Price in mid-range (${Math.round(ctx.pricePositionPct)}%)`,
        "No directional conviction",
      ],
      steps,
    };
  }

  const okCount = steps.filter((s) => s.status === "ok").length;
  const badCount = steps.filter((s) => s.status === "bad").length;

  let signal: Signal = "WAIT";
  let label: ConvictionLabel = "LOW CONVICTION";
  let confidenceScore = 0;
  const reasons: string[] = [];

  if (ctx.trend === "up" && ctx.marketState === "expansion") {
    signal = "UP";
    if (okCount >= 3 && badCount === 0) {
      label = "HIGH CONVICTION";
      confidenceScore = 75 + okCount * 5;
      reasons.push("Trend and regime aligned bullish");
      reasons.push(`${okCount}/4 checks passed`);
      if (ctx.rsi14 < 70) reasons.push("RSI confirms momentum");
    } else {
      label = "LOW CONVICTION";
      confidenceScore = 40 + okCount * 5;
      reasons.push("Bullish setup with caveats");
      if (badCount > 0) reasons.push("One or more checks failed");
    }
  } else if (ctx.trend === "down" && ctx.marketState === "expansion") {
    signal = "DOWN";
    if (okCount >= 3 && badCount === 0) {
      label = "HIGH CONVICTION";
      confidenceScore = 75 + okCount * 5;
      reasons.push("Trend and regime aligned bearish");
      reasons.push(`${okCount}/4 checks passed`);
    } else {
      label = "LOW CONVICTION";
      confidenceScore = 40 + okCount * 5;
      reasons.push("Bearish setup with caveats");
    }
  } else {
    signal = "WAIT";
    label = "LOW CONVICTION";
    confidenceScore = 20;
    reasons.push("Mixed signals — wait for clearer setup");
    if (ctx.marketState === "equilibrium") reasons.push("Market in equilibrium");
    if (ctx.trend === "sideways") reasons.push("No clear trend direction");
  }

  confidenceScore = Math.min(100, confidenceScore);

  return { signal, label, confidenceScore, reasons, steps };
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
