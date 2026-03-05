import {
  Alignment,
  ConflictLevel,
  ConvictionLabel,
  Decision,
  DecisionStep,
  MarketContext,
  MultiTFConsensus,
  MultiTFRow,
  ScoreBreakdown,
  Signal,
  StepStatus,
} from "@/types/market";

const TIMEFRAME_WEIGHTS: Record<string, number> = {
  "1w": 40,
  "1d": 30,
  "4h": 15,
  "1h": 10,
  "15m": 5,
};

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function alignmentValue(alignment: Alignment): number {
  if (alignment === "bullish") return 1;
  if (alignment === "bearish") return -1;
  return 0;
}

function weightedScore(rows: MultiTFRow[]): number {
  const totalWeight = rows.reduce(
    (sum, row) => sum + (TIMEFRAME_WEIGHTS[row.timeframe] ?? 0),
    0
  );

  if (totalWeight === 0) return 0;

  const total = rows.reduce(
    (sum, row) => sum + alignmentValue(row.alignment) * (TIMEFRAME_WEIGHTS[row.timeframe] ?? 0),
    0
  );

  return Math.max(-100, Math.min(100, Math.round((total / totalWeight) * 100)));
}

function directionFromScore(score: number): MultiTFConsensus["direction"] {
  if (score > 0) return "bullish";
  if (score < 0) return "bearish";
  return "mixed";
}

function fullyAligned(rows: MultiTFRow[]): boolean {
  return rows.length > 0 && rows.every((row) => row.alignment === rows[0].alignment);
}

function buildConsensusSummary(
  rows: MultiTFRow[],
  direction: MultiTFConsensus["direction"],
  conflictLevel: ConflictLevel,
  htfBias: MultiTFConsensus["htfBias"],
  ltfBias: MultiTFConsensus["ltfBias"]
): string {
  if (rows.length === 0) return "No timeframe data available";

  if (rows.length === 1) {
    const [row] = rows;
    if (row.alignment === "sideways") {
      return `${row.timeframe} sideways — wait for clearer structure`;
    }
    return `${row.timeframe} ${row.alignment} — single-timeframe read`;
  }

  if (conflictLevel === "high") {
    if (htfBias === "bullish" && ltfBias === "bearish") {
      return "HTF bullish, LTF bearish — aguardar pullback";
    }
    if (htfBias === "bearish" && ltfBias === "bullish") {
      return "HTF bearish, LTF bullish — ignore countertrend bounce";
    }
  }

  if (fullyAligned(rows) && direction === "bullish") {
    return "All timeframes aligned bullish";
  }

  if (fullyAligned(rows) && direction === "bearish") {
    return "All timeframes aligned bearish";
  }

  if (rows.every((row) => row.alignment === "sideways")) {
    return "All timeframes sideways — wait for expansion";
  }

  if (direction === "bullish") {
    if (ltfBias === "mixed") return "HTF bullish, LTF mixed — wait for cleaner continuation";
    if (htfBias === "mixed") return "Bullish bias, but higher timeframes are split";
    return "Bullish bias with partial disagreement — size conservatively";
  }

  if (direction === "bearish") {
    if (ltfBias === "mixed") return "HTF bearish, LTF mixed — wait for cleaner continuation";
    if (htfBias === "mixed") return "Bearish bias, but higher timeframes are split";
    return "Bearish bias with partial disagreement — size conservatively";
  }

  return "Timeframes mixed — wait for clearer alignment";
}

export function computeMultiTFConsensus(rows: MultiTFRow[]): MultiTFConsensus {
  const weighted = weightedScore(rows);
  const htfRows = rows.filter((row) => row.timeframe === "1w" || row.timeframe === "1d");
  const ltfRows = rows.filter((row) => row.timeframe === "1h" || row.timeframe === "15m");
  const htfBias = directionFromScore(weightedScore(htfRows));
  const ltfBias = directionFromScore(weightedScore(ltfRows));

  let conflictLevel: ConflictLevel = "low";
  if (
    htfBias !== "mixed" &&
    ltfBias !== "mixed" &&
    htfBias !== ltfBias
  ) {
    conflictLevel = "high";
  } else if (fullyAligned(rows) && rows[0]?.alignment !== "sideways") {
    conflictLevel = "none";
  }

  const direction = directionFromScore(weighted);

  return {
    weightedScore: weighted,
    direction,
    conflictLevel,
    htfBias,
    ltfBias,
    summary: buildConsensusSummary(rows, direction, conflictLevel, htfBias, ltfBias),
  };
}

function trendStep(ctx: MarketContext, consensus: MultiTFConsensus): DecisionStep {
  if (ctx.trend === "sideways") {
    return {
      id: "trend",
      title: "Trend Alignment",
      description: "Weighted EMA stack across key timeframes",
      status: "bad",
      details: "Active timeframe has no clear EMA stack",
    };
  }

  const directionalScore = ctx.trend === "up"
    ? consensus.weightedScore
    : -consensus.weightedScore;

  let status: StepStatus = "warn";
  let details = `Weighted score ${formatSigned(consensus.weightedScore)}`;

  if (directionalScore >= 40) {
    status = "ok";
    details = `${ctx.trend === "up" ? "Bullish" : "Bearish"} score ${formatSigned(directionalScore)}`;
  } else if (directionalScore <= 0) {
    status = "bad";
    details = `Consensus disagrees with active ${ctx.trend} trend`;
  } else {
    details = `Bias present, but still soft (${formatSigned(directionalScore)})`;
  }

  return {
    id: "trend",
    title: "Trend Alignment",
    description: "Weighted EMA stack across key timeframes",
    status,
    details,
  };
}

function conflictStep(consensus: MultiTFConsensus): DecisionStep {
  return {
    id: "mtf-conflict",
    title: "Alinhamento MTF",
    description: "Hierarchical consensus across higher and lower timeframes",
    status:
      consensus.conflictLevel === "none"
        ? "ok"
        : consensus.conflictLevel === "low"
          ? "warn"
          : "bad",
    details: consensus.summary,
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

// Weights: Trend 30, Regime 20, Position 20, Momentum 15, Volume 15.

function scoreTrend(ctx: MarketContext, consensus: MultiTFConsensus): number {
  if (ctx.trend === "sideways") return 0;

  const directionalScore = ctx.trend === "up"
    ? consensus.weightedScore
    : -consensus.weightedScore;

  if (directionalScore >= 60) return 30;
  if (directionalScore >= 40) return 22;
  if (directionalScore >= 20) return 12;
  if (directionalScore > 0) return 5;
  return 0;
}

function scoreRegime(ctx: MarketContext): number {
  return ctx.marketState === "expansion" ? 20 : 10;
}

function scorePosition(ctx: MarketContext): number {
  const pct = ctx.pricePositionPct;
  if (pct >= 40 && pct <= 60) return 0;
  if ((pct >= 25 && pct < 40) || (pct > 60 && pct <= 75)) return 12;
  return 20;
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

export function computeDecision(
  ctx: MarketContext,
  rows: MultiTFRow[],
  consensus: MultiTFConsensus = computeMultiTFConsensus(rows)
): Decision {
  const steps = [
    trendStep(ctx, consensus),
    conflictStep(consensus),
    regimeStep(ctx),
    momentumStep(ctx),
    positionStep(ctx),
    volumeStep(ctx),
  ];

  const isMidRange = ctx.pricePositionPct >= 40 && ctx.pricePositionPct <= 60;

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
      consensus,
    };
  }

  const scoreBreakdown: ScoreBreakdown = {
    trend: scoreTrend(ctx, consensus),
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

  if (consensus.conflictLevel === "high") {
    return {
      signal: "WAIT",
      label: "LOW CONVICTION",
      confidenceScore,
      scoreBreakdown,
      reasons: [
        consensus.summary,
        "Higher and lower timeframes disagree",
      ],
      steps,
      consensus,
    };
  }

  if (ctx.trend === "up" && ctx.marketState === "expansion") {
    signal = "UP";
    if (confidenceScore >= 65) {
      label = "HIGH CONVICTION";
      reasons.push("Trend and regime aligned bullish");
      if (ctx.rsi14 < 70) reasons.push("RSI confirms momentum");
      if (scoreBreakdown.volume >= 10) reasons.push("Volume confirming expansion");
      if (consensus.conflictLevel === "low") reasons.push(consensus.summary);
    } else {
      label = "LOW CONVICTION";
      reasons.push("Bullish setup with caveats");
      if (scoreBreakdown.position === 0) reasons.push("Mid-range entry — low conviction zone");
      if (scoreBreakdown.volume === 0) reasons.push("Low volume — no confirmation");
      if (consensus.conflictLevel === "low") reasons.push(consensus.summary);
    }
  } else if (ctx.trend === "down" && ctx.marketState === "expansion") {
    signal = "DOWN";
    if (confidenceScore >= 65) {
      label = "HIGH CONVICTION";
      reasons.push("Trend and regime aligned bearish");
      if (scoreBreakdown.volume >= 10) reasons.push("Volume confirming expansion");
      if (consensus.conflictLevel === "low") reasons.push(consensus.summary);
    } else {
      label = "LOW CONVICTION";
      reasons.push("Bearish setup with caveats");
      if (scoreBreakdown.position === 0) reasons.push("Mid-range entry — low conviction zone");
      if (scoreBreakdown.volume === 0) reasons.push("Low volume — no confirmation");
      if (consensus.conflictLevel === "low") reasons.push(consensus.summary);
    }
  } else {
    signal = "WAIT";
    label = "LOW CONVICTION";
    reasons.push("Mixed signals — wait for clearer setup");
    if (ctx.marketState === "equilibrium") reasons.push("Market in equilibrium");
    if (ctx.trend === "sideways") reasons.push("No clear trend direction");
    if (consensus.conflictLevel !== "none") reasons.push(consensus.summary);
  }

  return { signal, label, confidenceScore, scoreBreakdown, reasons, steps, consensus };
}

export function deriveAlignment(
  ema12: number,
  ema20: number,
  ema50: number,
  ema200: number
): "bullish" | "bearish" | "sideways" {
  if (ema20 > ema50 && ema50 > ema200) return "bullish";
  if (ema20 < ema50 && ema50 < ema200) return "bearish";

  if (ema20 > ema200 && ema50 > ema200 && ema12 > ema20) return "bullish";
  if (ema20 < ema200 && ema50 < ema200 && ema12 < ema20) return "bearish";

  return "sideways";
}
