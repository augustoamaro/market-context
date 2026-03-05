import {
  Alignment,
  ConflictLevel,
  ConvictionLabel,
  Decision,
  DecisionStep,
  GlobalBias,
  GlobalDecision,
  MarketContext,
  MultiTFConsensus,
  MultiTFRow,
  PositionSizeModifier,
  RecommendedAction,
  ScoreBreakdown,
  Signal,
  StepStatus,
} from "@/types/market";

const TF_WEIGHTS: Record<string, number> = {
  "1w": 40,
  "1d": 25,
  "4h": 15,
  "1h": 12,
  "15m": 8,
};

const SUM_WEIGHTS = 100;

const ALIGNMENT_SCORE: Record<Alignment, number> = {
  bullish: 1,
  bearish: -1,
  sideways: 0,
};

function clampScore(value: number): number {
  return Math.max(-100, Math.min(100, Math.round(value)));
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function computeBias(
  rows: MultiTFRow[],
  timeframes: string[]
): MultiTFConsensus["direction"] {
  const subset = rows.filter((row) => timeframes.includes(row.timeframe));
  if (subset.length === 0) return "mixed";

  const subWeights = subset.reduce(
    (sum, row) => sum + (TF_WEIGHTS[row.timeframe] ?? 0),
    0
  );
  const subRaw = subset.reduce(
    (sum, row) => sum + ALIGNMENT_SCORE[row.alignment] * (TF_WEIGHTS[row.timeframe] ?? 0),
    0
  );
  const subScore = subWeights > 0 ? (subRaw / subWeights) * 100 : 0;

  if (subScore >= 15) return "bullish";
  if (subScore <= -15) return "bearish";
  return "mixed";
}

function computeConflictLevel(
  rows: MultiTFRow[],
  htfBias: MultiTFConsensus["htfBias"],
  ltfBias: MultiTFConsensus["ltfBias"]
): ConflictLevel {
  if (rows.length > 0 && rows.every((row) => row.alignment === "sideways")) {
    return "none";
  }

  if (
    (htfBias === "bullish" && ltfBias === "bearish") ||
    (htfBias === "bearish" && ltfBias === "bullish")
  ) {
    return "high";
  }

  if (htfBias === "mixed" || ltfBias === "mixed") {
    return "low";
  }

  return "none";
}

function computeRecommendedAction(
  weightedScore: number,
  conflictLevel: ConflictLevel
): RecommendedAction {
  if (conflictLevel === "high") return "WAIT";
  if (weightedScore >= 35) return "LONG_BIAS";
  if (weightedScore <= -35) return "SHORT_BIAS";
  return "WAIT";
}

function computePositionSizeModifier(
  conflictLevel: ConflictLevel
): PositionSizeModifier {
  if (conflictLevel === "none") return 1;
  if (conflictLevel === "low") return 0.5;
  return 0.25;
}

function buildConsensusSummary(
  rows: MultiTFRow[],
  direction: MultiTFConsensus["direction"],
  conflictLevel: ConflictLevel,
  htfBias: MultiTFConsensus["htfBias"]
): string {
  if (rows.length === 0) return "Sem dados suficientes para consenso";

  if (rows.every((row) => row.alignment === "bullish")) {
    return "Todos os TFs alinhados bullish — alta confianca";
  }

  if (rows.every((row) => row.alignment === "bearish")) {
    return "Todos os TFs alinhados bearish — alta confianca";
  }

  if (rows.every((row) => row.alignment === "sideways")) {
    return "Sem vies claro — mercado em transicao";
  }

  if (conflictLevel === "high") {
    if (htfBias === "bullish") {
      return "HTF bullish, LTF bearish — aguardar pullback";
    }

    if (htfBias === "bearish") {
      return "HTF bearish, LTF bullish — bounce, vies continua down";
    }
  }

  if (conflictLevel === "low") {
    return "TFs mistos — baixa confianca, reduzir tamanho";
  }

  if (direction === "bullish") {
    return "Vies bullish sem conflito HTF/LTF";
  }

  if (direction === "bearish") {
    return "Vies bearish sem conflito HTF/LTF";
  }

  return "Sem vies claro — mercado em transicao";
}

export function computeMultiTFConsensus(rows: MultiTFRow[]): MultiTFConsensus {
  const raw = rows.reduce((sum, row) => {
    const weight = TF_WEIGHTS[row.timeframe] ?? 0;
    return sum + ALIGNMENT_SCORE[row.alignment] * weight;
  }, 0);

  const weightedScore = clampScore((raw / SUM_WEIGHTS) * 100);
  const direction =
    weightedScore >= 15
      ? "bullish"
      : weightedScore <= -15
        ? "bearish"
        : "mixed";

  const htfBias = computeBias(rows, ["1w", "1d"]);
  const ltfBias = computeBias(rows, ["1h", "15m"]);
  const conflictLevel = computeConflictLevel(rows, htfBias, ltfBias);
  const recommendedAction = computeRecommendedAction(weightedScore, conflictLevel);
  const positionSizeModifier = computePositionSizeModifier(conflictLevel);

  return {
    weightedScore,
    direction,
    conflictLevel,
    htfBias,
    ltfBias,
    recommendedAction,
    positionSizeModifier,
    summary: buildConsensusSummary(rows, direction, conflictLevel, htfBias),
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

  if (directionalScore >= 35) {
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
  const statusMap = { none: "ok", low: "warn", high: "bad" } as const;
  return {
    id: "mtf_conflict",
    title: "Alinhamento MTF",
    description: "Consenso ponderado entre timeframes (HTF domina)",
    status: statusMap[consensus.conflictLevel],
    details: consensus.summary,
  };
}

function isMidRangeZone(pct: number): boolean {
  return pct >= 40 && pct <= 60;
}

function isEntryZone(pct: number): boolean {
  return pct < 25 || pct > 75;
}

function globalRegimeStep(anchorCtx: MarketContext): DecisionStep {
  return {
    id: "regime",
    title: "Regime + Playbook",
    description:
      anchorCtx.marketState === "expansion"
        ? `Anchor ${anchorCtx.timeframe}: EXPANSION — setups direcionais permitidos`
        : `Anchor ${anchorCtx.timeframe}: EQUILIBRIUM — somente range trades`,
    status: anchorCtx.marketState === "expansion" ? "ok" : "warn",
    details: anchorCtx.stateReason,
  };
}

function globalPositionStep(anchorCtx: MarketContext): DecisionStep {
  const pct = Math.round(anchorCtx.pricePositionPct);
  let status: StepStatus = "ok";
  let details = `Zona de entrada (posição ${pct}%)`;

  if (isMidRangeZone(anchorCtx.pricePositionPct)) {
    status = "bad";
    details = `Mid-range — zona de baixa convicção (${pct}%)`;
  } else if (
    (anchorCtx.pricePositionPct >= 25 && anchorCtx.pricePositionPct < 40) ||
    (anchorCtx.pricePositionPct > 60 && anchorCtx.pricePositionPct <= 75)
  ) {
    status = "warn";
    details = `Zona intermediária — cuidado (${pct}%)`;
  }

  return {
    id: "position",
    title: "Range Position",
    description: `Anchor ${anchorCtx.timeframe}: posição operacional no range`,
    status,
    details,
  };
}

function executionReadinessStep(
  executionCtx: MarketContext,
  bias: GlobalBias
): DecisionStep {
  const pct = Math.round(executionCtx.pricePositionPct);
  const isPositionMid = isMidRangeZone(executionCtx.pricePositionPct);
  const rsiExtreme =
    bias === "LONG"
      ? executionCtx.rsi14 > 72
      : bias === "SHORT"
        ? executionCtx.rsi14 < 28
        : executionCtx.rsi14 > 72 || executionCtx.rsi14 < 28;

  let status: StepStatus = "ok";
  let details = `${executionCtx.timeframe} pronto — RSI ${executionCtx.rsi14.toFixed(1)}, posição ${pct}%`;

  if (isPositionMid && rsiExtreme) {
    status = "bad";
    details = `${executionCtx.timeframe} desfavorável — RSI ${executionCtx.rsi14.toFixed(1)}, posição ${pct}%`;
  } else if (isPositionMid || rsiExtreme) {
    status = "warn";
    details = `${executionCtx.timeframe} aguardando — RSI ${executionCtx.rsi14.toFixed(1)}, posição ${pct}%`;
  }

  return {
    id: "execution",
    title: "Execution Readiness",
    description: `${executionCtx.timeframe} mede a prontidão da entrada`,
    status,
    details,
  };
}

function executionVolumeStep(executionCtx: MarketContext): DecisionStep {
  const pct = executionCtx.volumeRatioPct;
  let status: StepStatus;
  let details: string;

  if (pct >= 100) {
    status = "ok";
    details = `Volume acima da média (${Math.round(pct)}%)`;
  } else if (pct >= 70) {
    status = "warn";
    details = `Volume moderado (${Math.round(pct)}%)`;
  } else {
    status = "bad";
    details = `Volume fraco — sem confirmação (${Math.round(pct)}%)`;
  }

  return {
    id: "volume",
    title: "Volume",
    description: `${executionCtx.timeframe} confirma participação`,
    status,
    details,
  };
}

function sizeStep(modifier: number): DecisionStep {
  if (modifier >= 1) {
    return {
      id: "size",
      title: "Position Size",
      description: "Tamanho final sugerido após conflito + prontidão",
      status: "ok",
      details: "Tamanho normal (100%) — alinhamento total",
    };
  }

  if (modifier >= 0.5) {
    return {
      id: "size",
      title: "Position Size",
      description: "Tamanho final sugerido após conflito + prontidão",
      status: "warn",
      details: "Tamanho reduzido (50%) — conflito baixo",
    };
  }

  if (modifier >= 0.25) {
    return {
      id: "size",
      title: "Position Size",
      description: "Tamanho final sugerido após conflito + prontidão",
      status: "bad",
      details: "Tamanho mínimo (25%) — conflito alto",
    };
  }

  return {
    id: "size",
    title: "Position Size",
    description: "Tamanho final sugerido após conflito + prontidão",
    status: "bad",
    details: "Sem tamanho sugerido — setup ainda não está pronto",
  };
}

function buildGlobalSteps(
  consensus: MultiTFConsensus,
  anchorCtx: MarketContext,
  executionCtx: MarketContext,
  bias: GlobalBias,
  positionSizeModifier: number
): DecisionStep[] {
  return [
    conflictStep(consensus),
    globalRegimeStep(anchorCtx),
    globalPositionStep(anchorCtx),
    executionReadinessStep(executionCtx, bias),
    executionVolumeStep(executionCtx),
    sizeStep(positionSizeModifier),
  ];
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

function scoreTrend(ctx: MarketContext, consensus: MultiTFConsensus): number {
  if (ctx.trend === "sideways") return 0;

  const directionalScore = ctx.trend === "up"
    ? consensus.weightedScore
    : -consensus.weightedScore;

  if (directionalScore >= 60) return 30;
  if (directionalScore >= 35) return 22;
  if (directionalScore >= 15) return 12;
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
  const isRangeExtreme = ctx.pricePositionPct < 20 || ctx.pricePositionPct > 80;

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

  if (consensus.conflictLevel === "high") {
    if (ctx.marketState === "equilibrium" && isRangeExtreme) {
      return {
        signal: "WATCH",
        label: "LOW CONVICTION — Range apenas",
        confidenceScore,
        scoreBreakdown,
        reasons: [
          consensus.summary,
          `Range em extremo (${Math.round(ctx.pricePositionPct)}%)`,
          "Setup valido apenas como fade de range",
        ],
        steps,
        consensus,
      };
    }

    return {
      signal: "WAIT",
      label: "NO TRADE — Conflito HTF/LTF",
      confidenceScore,
      scoreBreakdown,
      reasons: [
        consensus.summary,
        "Conflito HTF/LTF bloqueia setup direcional",
      ],
      steps,
      consensus,
    };
  }

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

  const reasons: string[] = [];
  const alignedLong = consensus.recommendedAction === "LONG_BIAS";
  const alignedShort = consensus.recommendedAction === "SHORT_BIAS";
  const hasTrendScore = scoreBreakdown.trend > 0;

  let signal: Signal = "WAIT";
  let label: ConvictionLabel = "LOW CONVICTION";

  if (ctx.trend === "up" && ctx.marketState === "expansion" && hasTrendScore) {
    signal = "UP";
    if (confidenceScore >= 65 && alignedLong) {
      label = "HIGH CONVICTION";
      reasons.push("Trend and regime aligned bullish");
      if (ctx.rsi14 < 70) reasons.push("RSI confirms momentum");
      if (scoreBreakdown.volume >= 10) reasons.push("Volume confirming expansion");
    } else {
      label = "LOW CONVICTION";
      reasons.push("Bullish setup with caveats");
      if (!alignedLong) reasons.push("Consensus ainda abaixo do limiar de bias");
      if (scoreBreakdown.position === 0) reasons.push("Mid-range entry — low conviction zone");
      if (scoreBreakdown.volume === 0) reasons.push("Low volume — no confirmation");
    }
  } else if (ctx.trend === "down" && ctx.marketState === "expansion" && hasTrendScore) {
    signal = "DOWN";
    if (confidenceScore >= 65 && alignedShort) {
      label = "HIGH CONVICTION";
      reasons.push("Trend and regime aligned bearish");
      if (scoreBreakdown.volume >= 10) reasons.push("Volume confirming expansion");
    } else {
      label = "LOW CONVICTION";
      reasons.push("Bearish setup with caveats");
      if (!alignedShort) reasons.push("Consensus ainda abaixo do limiar de bias");
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

  if (consensus.conflictLevel === "low") {
    reasons.push(consensus.summary);
  }

  return { signal, label, confidenceScore, scoreBreakdown, reasons, steps, consensus };
}

export function computeGlobalDecision(
  rows: MultiTFRow[],
  executionCtx: MarketContext,
  anchorCtx: MarketContext,
  consensus: MultiTFConsensus = computeMultiTFConsensus(rows)
): GlobalDecision {
  let bias: GlobalBias = "NONE";

  if (consensus.conflictLevel !== "high") {
    if (consensus.recommendedAction === "LONG_BIAS") bias = "LONG";
    if (consensus.recommendedAction === "SHORT_BIAS") bias = "SHORT";
  }

  const { pricePositionPct, rsi14, timeframe } = executionCtx;

  const isMidRange = isMidRangeZone(pricePositionPct);
  const isAnchorExtreme = isEntryZone(anchorCtx.pricePositionPct);
  const rsiOverbought = rsi14 > 72;
  const rsiOversold = rsi14 < 28;

  const poorLongEntry = isMidRange || rsiOverbought;
  const poorShortEntry = isMidRange || rsiOversold;

  const reasons = [consensus.summary, `${anchorCtx.timeframe} ${anchorCtx.marketState} — ${anchorCtx.stateReason}`];

  function finalize(
    signal: GlobalDecision["signal"],
    nextBias: GlobalBias,
    label: string,
    positionSizeModifier: number,
    nextReasons: string[]
  ): GlobalDecision {
    return {
      signal,
      bias: nextBias,
      label,
      executionTF: timeframe,
      positionSizeModifier,
      reasons: nextReasons,
      steps: buildGlobalSteps(consensus, anchorCtx, executionCtx, nextBias, positionSizeModifier),
      consensus,
    };
  }

  if (bias === "NONE") {
    if (
      consensus.conflictLevel === "high" &&
      anchorCtx.marketState === "equilibrium" &&
      isAnchorExtreme
    ) {
      reasons.push(`${anchorCtx.timeframe} em extremo de range (${Math.round(anchorCtx.pricePositionPct)}%)`);
      reasons.push("Fade de range permitido com tamanho reduzido");

      return finalize("WATCH", "NONE", "LOW CONVICTION — Range apenas", 0.25, reasons);
    }

    if (consensus.conflictLevel === "high") {
      reasons.push("Conflito HTF/LTF bloqueia o bias global");
    } else {
      reasons.push("Bias global insuficiente para entrada");
    }

    return finalize("WAIT", "NONE", "NO TRADE", 0, reasons);
  }

  if (bias === "LONG") {
    if (poorLongEntry) {
      if (isMidRange) reasons.push(`Execution TF ${timeframe} em mid-range (${Math.round(pricePositionPct)}%)`);
      if (rsiOverbought) reasons.push(`RSI ${rsi14.toFixed(1)} — overbought no ${timeframe}`);

      return finalize("WATCH", "LONG", "AGUARDANDO SETUP — Posição desfavorável", 0, reasons);
    }

    reasons.push(`Posição favorável no ${timeframe} (${Math.round(pricePositionPct)}%)`);
    reasons.push(`RSI ${rsi14.toFixed(1)} no ${timeframe}`);

    return finalize(
      "READY",
      "LONG",
      consensus.conflictLevel === "none" ? "HIGH CONVICTION" : "LOW CONVICTION",
      consensus.conflictLevel === "none" ? 1 : 0.5,
      reasons
    );
  }

  if (poorShortEntry) {
    if (isMidRange) reasons.push(`Execution TF ${timeframe} em mid-range (${Math.round(pricePositionPct)}%)`);
    if (rsiOversold) reasons.push(`RSI ${rsi14.toFixed(1)} — oversold no ${timeframe}`);

    return finalize("WATCH", "SHORT", "AGUARDANDO SETUP — Posição desfavorável", 0, reasons);
  }

  reasons.push(`Posição favorável no ${timeframe} (${Math.round(pricePositionPct)}%)`);
  reasons.push(`RSI ${rsi14.toFixed(1)} no ${timeframe}`);

  return finalize(
    "READY",
    "SHORT",
    consensus.conflictLevel === "none" ? "HIGH CONVICTION" : "LOW CONVICTION",
    consensus.conflictLevel === "none" ? 1 : 0.5,
    reasons
  );
}

export function deriveAlignment(
  ema12: number,
  ema20: number,
  ema50: number,
  ema200: number
): "bullish" | "bearish" | "sideways" {
  const slopeUp = ema12 > ema20;
  const slopeDown = ema12 < ema20;

  if (ema20 > ema50 && ema50 > ema200 && slopeUp) return "bullish";
  if (ema20 < ema50 && ema50 < ema200 && slopeDown) return "bearish";
  return "sideways";
}
