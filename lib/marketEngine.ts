import {
  ContextLayer,
  DecisionStep,
  ExecutionPlan,
  GlobalBias,
  GlobalDecision,
  MarketContext,
  MultiTFConsensus,
  MultiTFRow,
  RangePositionLabel,
  ReadinessBreakdown,
  SetupLayer,
  SetupStage,
  StepStatus,
  VolumeCondition,
} from "@/types/market";

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function getBias(consensus: MultiTFConsensus): GlobalBias {
  if (consensus.conflictLevel === "high") return "NEUTRAL";
  if (consensus.weightedScore >= 35) return "BULLISH";
  if (consensus.weightedScore <= -35) return "BEARISH";
  return "NEUTRAL";
}

function getRangePosition(pct: number): ContextLayer["rangePosition"] {
  if (pct < 0) {
    return {
      label: "Breakdown",
      detail: "Price is trading below the local value area",
      tone: "warn",
      zone: "BREAKDOWN",
      valuePct: Math.round(pct),
    };
  }

  if (pct <= 12) {
    return {
      label: "Extreme low",
      detail: "Price is sitting deep in the lower edge of the range",
      tone: "ok",
      zone: "EXTREME_LOW",
      valuePct: Math.round(pct),
    };
  }

  if (pct <= 35) {
    return {
      label: "Low",
      detail: "Price is below fair value and closer to support",
      tone: "ok",
      zone: "LOW",
      valuePct: Math.round(pct),
    };
  }

  if (pct <= 65) {
    return {
      label: "Mid",
      detail: "Price is inside equilibrium with limited edge",
      tone: "bad",
      zone: "MID",
      valuePct: Math.round(pct),
    };
  }

  if (pct <= 88) {
    return {
      label: "High",
      detail: "Price is above fair value and closer to resistance",
      tone: "ok",
      zone: "HIGH",
      valuePct: Math.round(pct),
    };
  }

  if (pct <= 100) {
    return {
      label: "Extreme high",
      detail: "Price is pressing the upper edge of the range",
      tone: "ok",
      zone: "EXTREME_HIGH",
      valuePct: Math.round(pct),
    };
  }

  return {
    label: "Breakout",
    detail: "Price is trading above the local range high",
    tone: "warn",
    zone: "BREAKOUT",
    valuePct: Math.round(pct),
  };
}

function getVolume(ratioPct: number): ContextLayer["volume"] {
  if (ratioPct >= 130) {
    return {
      label: "Strong",
      detail: "Participation is expanding above average",
      tone: "ok",
      condition: "STRONG",
      ratioPct: Math.round(ratioPct),
    };
  }

  if (ratioPct >= 100) {
    return {
      label: "Healthy",
      detail: "Volume is supporting the current move",
      tone: "ok",
      condition: "HEALTHY",
      ratioPct: Math.round(ratioPct),
    };
  }

  if (ratioPct >= 75) {
    return {
      label: "Light",
      detail: "Participation is present but not decisive",
      tone: "warn",
      condition: "LIGHT",
      ratioPct: Math.round(ratioPct),
    };
  }

  return {
    label: "Weak",
    detail: "Volume is below average and offers little confirmation",
    tone: "bad",
    condition: "WEAK",
    ratioPct: Math.round(ratioPct),
  };
}

function getRegime(anchorCtx: MarketContext): ContextLayer["regime"] {
  if (anchorCtx.marketState === "equilibrium" && anchorCtx.volumeRatioPct < 85) {
    return {
      label: "Compression",
      detail: `${anchorCtx.timeframe} is balanced and participation is thin`,
      tone: "bad",
    };
  }

  if (anchorCtx.marketState === "equilibrium") {
    return {
      label: "Equilibrium",
      detail: `${anchorCtx.timeframe} is balanced and mean-reversion dominates`,
      tone: "warn",
    };
  }

  if (anchorCtx.trend !== "sideways") {
    return {
      label: "Trend",
      detail: `${anchorCtx.timeframe} is expanding with directional structure`,
      tone: "ok",
    };
  }

  return {
    label: "Expansion",
    detail: `${anchorCtx.timeframe} is expanding but structure is still mixed`,
    tone: "warn",
  };
}

function getConsensusBlock(consensus: MultiTFConsensus): ContextLayer["mtfConsensus"] {
  if (consensus.conflictLevel === "high") {
    return {
      label: "HTF/LTF conflict",
      detail: consensus.summary,
      tone: "bad",
      weightedScore: consensus.weightedScore,
      htfBias: consensus.htfBias,
      ltfBias: consensus.ltfBias,
      conflictLevel: consensus.conflictLevel,
    };
  }

  if (consensus.direction === "mixed") {
    return {
      label: "Mixed bias",
      detail: consensus.summary,
      tone: "warn",
      weightedScore: consensus.weightedScore,
      htfBias: consensus.htfBias,
      ltfBias: consensus.ltfBias,
      conflictLevel: consensus.conflictLevel,
    };
  }

  return {
    label: consensus.direction === "bullish" ? "Bullish alignment" : "Bearish alignment",
    detail: consensus.summary,
    tone: consensus.conflictLevel === "none" ? "ok" : "warn",
    weightedScore: consensus.weightedScore,
    htfBias: consensus.htfBias,
    ltfBias: consensus.ltfBias,
    conflictLevel: consensus.conflictLevel,
  };
}

function isLowZone(zone: RangePositionLabel): boolean {
  return zone === "EXTREME_LOW" || zone === "LOW" || zone === "BREAKDOWN";
}

function isHighZone(zone: RangePositionLabel): boolean {
  return zone === "HIGH" || zone === "EXTREME_HIGH" || zone === "BREAKOUT";
}

function getLiquidityBlock(
  bias: GlobalBias,
  range: ContextLayer["rangePosition"]
): SetupLayer["liquidity"] {
  if (isLowZone(range.zone)) {
    return {
      label: "Sell-side liquidity nearby",
      detail:
        bias === "BULLISH"
          ? "Price is trading near lows where a long setup can form"
          : "Downside liquidity is nearby, which limits fresh short edge",
      tone: bias === "BULLISH" ? "ok" : "warn",
    };
  }

  if (isHighZone(range.zone)) {
    return {
      label: "Buy-side liquidity nearby",
      detail:
        bias === "BEARISH"
          ? "Price is trading near highs where a short setup can form"
          : "Upside liquidity is nearby, which limits fresh long edge",
      tone: bias === "BEARISH" ? "ok" : "warn",
    };
  }

  return {
    label: "Liquidity balanced",
    detail: "No obvious edge near range extremes yet",
    tone: "bad",
  };
}

function getSweepBlock(
  bias: GlobalBias,
  executionCtx: MarketContext
): SetupLayer["sweep"] {
  if (executionCtx.pricePositionPct > 100) {
    return {
      label: "Buy-side sweep active",
      detail:
        bias === "BEARISH"
          ? "Execution timeframe traded above the range high and can fail back inside value"
          : "Execution timeframe is trading beyond highs, but reversal is not confirmed yet",
      tone: bias === "BEARISH" ? "ok" : "warn",
    };
  }

  if (executionCtx.pricePositionPct < 0) {
    return {
      label: "Sell-side sweep active",
      detail:
        bias === "BULLISH"
          ? "Execution timeframe traded below the range low and can reclaim value"
          : "Execution timeframe is trading below lows, but reversal is not confirmed yet",
      tone: bias === "BULLISH" ? "ok" : "warn",
    };
  }

  if (bias === "BULLISH" && executionCtx.pricePositionPct <= 18) {
    return {
      label: "Potential downside sweep",
      detail: "Price is testing the lows but still needs a reclaim to confirm the idea",
      tone: "warn",
    };
  }

  if (bias === "BEARISH" && executionCtx.pricePositionPct >= 82) {
    return {
      label: "Potential upside sweep",
      detail: "Price is testing the highs but still needs a rejection to confirm the idea",
      tone: "warn",
    };
  }

  return {
    label: "No sweep evidence",
    detail: "Liquidity has not been displaced in a meaningful way yet",
    tone: "bad",
  };
}

function getStructureBlock(
  bias: GlobalBias,
  executionCtx: MarketContext
): SetupLayer["structure"] {
  if (bias === "BULLISH") {
    if (executionCtx.trend === "up" && executionCtx.macdHistogram > 0) {
      return {
        label: "Bullish structure intact",
        detail: "Execution timeframe is holding higher structure with positive momentum",
        tone: "ok",
      };
    }

    if (executionCtx.trend === "sideways" || executionCtx.macdHistogram >= 0) {
      return {
        label: "Bullish structure still forming",
        detail: "Momentum is stabilizing but the structure shift is incomplete",
        tone: "warn",
      };
    }

    return {
      label: "Structure still bearish",
      detail: "Execution timeframe has not shifted in favor of longs",
      tone: "bad",
    };
  }

  if (bias === "BEARISH") {
    if (executionCtx.trend === "down" && executionCtx.macdHistogram < 0) {
      return {
        label: "Bearish structure intact",
        detail: "Execution timeframe is holding lower structure with negative momentum",
        tone: "ok",
      };
    }

    if (executionCtx.trend === "sideways" || executionCtx.macdHistogram <= 0) {
      return {
        label: "Bearish structure still forming",
        detail: "Momentum is softening but the breakdown is incomplete",
        tone: "warn",
      };
    }

    return {
      label: "Structure still bullish",
      detail: "Execution timeframe has not shifted in favor of shorts",
      tone: "bad",
    };
  }

  return {
    label: "No directional structure",
    detail: "Bias is neutral, so structure cannot justify execution",
    tone: "bad",
  };
}

function getConfirmationBlock(
  bias: GlobalBias,
  executionCtx: MarketContext,
  volume: ContextLayer["volume"]
): SetupLayer["confirmation"] {
  if (bias === "BULLISH") {
    if (
      volume.condition !== "WEAK" &&
      executionCtx.macdHistogram > 0 &&
      executionCtx.rsi14 >= 42 &&
      executionCtx.rsi14 <= 68
    ) {
      return {
        label: "Bullish confirmation present",
        detail: "Momentum, RSI, and participation support long execution",
        tone: "ok",
      };
    }

    if (
      executionCtx.macdHistogram >= 0 ||
      (volume.condition !== "WEAK" && executionCtx.rsi14 >= 38 && executionCtx.rsi14 <= 72)
    ) {
      return {
        label: "Partial long confirmation",
        detail: "Context is improving, but the final trigger candle is still missing",
        tone: "warn",
      };
    }
  }

  if (bias === "BEARISH") {
    if (
      volume.condition !== "WEAK" &&
      executionCtx.macdHistogram < 0 &&
      executionCtx.rsi14 >= 32 &&
      executionCtx.rsi14 <= 58
    ) {
      return {
        label: "Bearish confirmation present",
        detail: "Momentum, RSI, and participation support short execution",
        tone: "ok",
      };
    }

    if (
      executionCtx.macdHistogram <= 0 ||
      (volume.condition !== "WEAK" && executionCtx.rsi14 >= 28 && executionCtx.rsi14 <= 62)
    ) {
      return {
        label: "Partial short confirmation",
        detail: "Context is improving, but the rejection trigger is still missing",
        tone: "warn",
      };
    }
  }

  return {
    label: "No trigger yet",
    detail: "Execution confirmation is still absent",
    tone: "bad",
  };
}

function getArchetypeBlock(
  bias: GlobalBias,
  anchorCtx: MarketContext,
  executionCtx: MarketContext,
  sweep: SetupLayer["sweep"],
  structure: SetupLayer["structure"]
): SetupLayer["archetype"] {
  if (sweep.tone === "ok" && structure.tone === "ok") {
    return {
      label: "Sweep + structure shift",
      detail: "Liquidity displacement already happened and the structure now supports the reversal",
      tone: "ok",
      kind: "SWEEP_STRUCTURE_SHIFT",
    };
  }

  if (
    anchorCtx.marketState === "equilibrium" &&
    (executionCtx.pricePositionPct <= 20 || executionCtx.pricePositionPct >= 80)
  ) {
    return {
      label: "Range reversal",
      detail: "Price is working a range extreme where mean-reversion setups dominate",
      tone: "warn",
      kind: "RANGE_REVERSAL",
    };
  }

  if (
    bias !== "NEUTRAL" &&
    anchorCtx.marketState === "expansion" &&
    structure.tone !== "bad" &&
    executionCtx.pricePositionPct >= 20 &&
    executionCtx.pricePositionPct <= 60
  ) {
    return {
      label: "Trend continuation",
      detail: "Directional context exists and price is reloading inside the move",
      tone: "warn",
      kind: "TREND_CONTINUATION",
    };
  }

  if (
    anchorCtx.marketState === "equilibrium" &&
    anchorCtx.volumeRatioPct < 85
  ) {
    return {
      label: "Compression expansion",
      detail: "The market is compressed and waiting for a cleaner directional release",
      tone: "warn",
      kind: "COMPRESSION_EXPANSION",
    };
  }

  if (executionCtx.pricePositionPct > 100 || executionCtx.pricePositionPct < 0) {
    return {
      label: "Failed breakout candidate",
      detail: "Price displaced outside value, but reversal evidence is still incomplete",
      tone: "warn",
      kind: "FAILED_BREAKOUT",
    };
  }

  return {
    label: "No clear archetype yet",
    detail: "The setup narrative is still too weak to classify cleanly",
    tone: "bad",
    kind: "NONE",
  };
}

function getBiasAlignmentScore(bias: GlobalBias, consensus: MultiTFConsensus): number {
  if (bias === "NEUTRAL") return 0;
  if (consensus.conflictLevel === "none") return 25;
  if (consensus.conflictLevel === "low") return 18;
  return 0;
}

function getRangeScore(bias: GlobalBias, executionPct: number): number {
  if (bias === "NEUTRAL") return 0;

  if (bias === "BULLISH") {
    if (executionPct <= 20) return 20;
    if (executionPct <= 35) return 14;
    if (executionPct <= 55) return 4;
    return 0;
  }

  if (executionPct >= 80) return 20;
  if (executionPct >= 65) return 14;
  if (executionPct >= 45) return 4;
  return 0;
}

function getVolumeScore(condition: VolumeCondition): number {
  if (condition === "STRONG") return 15;
  if (condition === "HEALTHY") return 10;
  if (condition === "LIGHT") return 5;
  return 0;
}

function toneScore(status: StepStatus, max: number): number {
  if (status === "ok") return max;
  if (status === "warn") return Math.round(max / 2);
  return 0;
}

function getReadinessStage(score: number): SetupStage {
  if (score <= 25) return "NO_SETUP";
  if (score <= 50) return "CONTEXT_FORMING";
  if (score <= 75) return "SETUP_DEVELOPING";
  return "EXECUTION_READY";
}

function getStateLabel(signal: GlobalDecision["signal"], readinessStage: SetupStage): string {
  if (signal === "NO_TRADE") return "No trade";
  if (signal === "WAIT") return "Context valid, trigger absent";
  if (signal === "LOOK_FOR_LONGS") return "Long setup forming";
  if (signal === "LOOK_FOR_SHORTS") return "Short setup forming";

  if (readinessStage === "EXECUTION_READY") {
    return "Execution-ready";
  }

  return "Ready with caveats";
}

function getPositionSizeModifier(
  signal: GlobalDecision["signal"],
  consensus: MultiTFConsensus
): number {
  if (signal === "READY") {
    if (consensus.conflictLevel === "none") return 1;
    if (consensus.conflictLevel === "low") return 0.5;
    return 0.25;
  }

  if (signal === "LOOK_FOR_LONGS" || signal === "LOOK_FOR_SHORTS") {
    return consensus.conflictLevel === "none" ? 0.5 : 0.25;
  }

  return 0;
}

function buildReasons(
  signal: GlobalDecision["signal"],
  bias: GlobalBias,
  context: ContextLayer,
  setup: SetupLayer,
  readinessScore: number
): string[] {
  const reasons = [
    `${context.mtfConsensus.label} (${formatSigned(context.mtfConsensus.weightedScore)})`,
    `${context.regime.label} on ${context.anchorTimeframe.toUpperCase()}`,
    `${context.rangePosition.label} range position (${context.rangePosition.valuePct}%)`,
  ];

  if (bias !== "NEUTRAL") {
    reasons.push(setup.liquidity.label);
    reasons.push(setup.structure.label);
  }

  if (signal === "READY" || signal === "LOOK_FOR_LONGS" || signal === "LOOK_FOR_SHORTS") {
    reasons.push(setup.confirmation.label);
  }

  if (signal === "NO_TRADE") {
    reasons.push(`Readiness only ${readinessScore}/100`);
  }

  return reasons.slice(0, 5);
}

function buildWarnings(
  context: ContextLayer,
  setup: SetupLayer,
  bias: GlobalBias
): string[] {
  const warnings: string[] = [];

  if (bias === "NEUTRAL") {
    warnings.push("Directional bias is still neutral");
  }

  if (context.rangePosition.tone !== "ok") {
    warnings.push(context.rangePosition.detail);
  }

  if (context.volume.tone !== "ok") {
    warnings.push(context.volume.detail);
  }

  if (context.mtfConsensus.tone !== "ok") {
    warnings.push(context.mtfConsensus.detail);
  }

  for (const block of [
    setup.sweep,
    setup.structure,
    setup.confirmation,
    setup.archetype,
  ]) {
    if (block.tone !== "ok") {
      warnings.push(block.detail);
    }
  }

  return Array.from(new Set(warnings)).slice(0, 5);
}

function buildSteps(
  context: ContextLayer,
  setup: SetupLayer,
  readinessScore: number
): DecisionStep[] {
  return [
    {
      id: "bias",
      title: "Bias",
      description: "Weighted higher-timeframe consensus",
      status: context.mtfConsensus.tone,
      details: `${context.mtfConsensus.label} ${formatSigned(context.mtfConsensus.weightedScore)}`,
    },
    {
      id: "regime",
      title: "Market Regime",
      description: "Anchor timeframe market condition",
      status: context.regime.tone,
      details: context.regime.detail,
    },
    {
      id: "range",
      title: "Range Position",
      description: "Location inside current value area",
      status: context.rangePosition.tone,
      details: `${context.rangePosition.label} (${context.rangePosition.valuePct}%)`,
    },
    {
      id: "liquidity",
      title: "Liquidity",
      description: "Nearby liquidity and sweep context",
      status: setup.liquidity.tone === "ok" || setup.sweep.tone === "ok" ? "ok" : setup.liquidity.tone,
      details: `${setup.liquidity.label} · ${setup.sweep.label}`,
    },
    {
      id: "structure",
      title: "Structure",
      description: "Directional structure and setup archetype",
      status: setup.structure.tone,
      details: `${setup.structure.label} · ${setup.archetype.label}`,
    },
    {
      id: "readiness",
      title: "Readiness",
      description: "Maturity of the current setup",
      status: readinessScore >= 76 ? "ok" : readinessScore >= 51 ? "warn" : "bad",
      details: `${readinessScore}/100`,
    },
  ];
}

function buildExecutionPlan(
  signal: GlobalDecision["signal"],
  bias: GlobalBias,
  anchorCtx: MarketContext,
  executionCtx: MarketContext,
  archetype: SetupLayer["archetype"],
  positionSizeModifier: number
): ExecutionPlan | null {
  if (bias === "NEUTRAL") return null;

  const rangeSpan = Math.max(executionCtx.rangeHigh - executionCtx.rangeLow, executionCtx.price * 0.003);
  const isReversal =
    archetype.kind === "RANGE_REVERSAL" ||
    archetype.kind === "SWEEP_STRUCTURE_SHIFT" ||
    anchorCtx.marketState === "equilibrium";

  const allowed = signal === "READY";
  const emphasis = signal === "READY" ? "primary" : "secondary";
  const suggestedRiskPct =
    signal === "READY"
      ? round(Math.max(positionSizeModifier, 0.5), 2)
      : signal === "LOOK_FOR_LONGS" || signal === "LOOK_FOR_SHORTS"
        ? round(Math.max(positionSizeModifier, 0.25), 2)
        : 0.25;

  if (bias === "BULLISH") {
    const suggestedEntry = round(
      isReversal
        ? Math.min(executionCtx.price, executionCtx.rangeLow + rangeSpan * 0.12)
        : Math.min(executionCtx.price, executionCtx.ema20),
      2
    );
    const invalidation = round(
      isReversal
        ? executionCtx.rangeLow - rangeSpan * 0.08
        : Math.min(executionCtx.ema50, executionCtx.rangeLow + rangeSpan * 0.1) - rangeSpan * 0.05,
      2
    );
    const risk = Math.max(suggestedEntry - invalidation, executionCtx.price * 0.0025);
    const target1 = round(
      isReversal ? executionCtx.rangeLow + rangeSpan * 0.5 : suggestedEntry + risk * 1.8,
      2
    );
    const target2 = round(
      isReversal ? executionCtx.rangeHigh : suggestedEntry + risk * 3,
      2
    );

    return {
      allowed,
      emphasis,
      entryModel: isReversal ? "Range reversal from support" : "Trend continuation on pullback",
      trigger:
        signal === "READY"
          ? `Wait for a bullish ${executionCtx.timeframe} close that holds above local support`
          : `Only arm the trade after a bullish ${executionCtx.timeframe} reclaim`,
      suggestedEntry,
      invalidation,
      target1,
      target2,
      rr: round((target1 - suggestedEntry) / risk, 2),
      suggestedRiskPct,
      notes: [
        isReversal ? "Primary target is the range midpoint first." : "Use pullback acceptance as the confirmation.",
        `Execution timeframe: ${executionCtx.timeframe}`,
      ],
    };
  }

  const suggestedEntry = round(
    isReversal
      ? Math.max(executionCtx.price, executionCtx.rangeHigh - rangeSpan * 0.12)
      : Math.max(executionCtx.price, executionCtx.ema20),
    2
  );
  const invalidation = round(
    isReversal
      ? executionCtx.rangeHigh + rangeSpan * 0.08
      : Math.max(executionCtx.ema50, executionCtx.rangeHigh - rangeSpan * 0.1) + rangeSpan * 0.05,
    2
  );
  const risk = Math.max(invalidation - suggestedEntry, executionCtx.price * 0.0025);
  const target1 = round(
    isReversal ? executionCtx.rangeHigh - rangeSpan * 0.5 : suggestedEntry - risk * 1.8,
    2
  );
  const target2 = round(
    isReversal ? executionCtx.rangeLow : suggestedEntry - risk * 3,
    2
  );

  return {
    allowed,
    emphasis,
    entryModel: isReversal ? "Range reversal from resistance" : "Trend continuation on rejection",
    trigger:
      signal === "READY"
        ? `Wait for a bearish ${executionCtx.timeframe} close that holds below local resistance`
        : `Only arm the trade after a bearish ${executionCtx.timeframe} rejection`,
    suggestedEntry,
    invalidation,
    target1,
    target2,
    rr: round((suggestedEntry - target1) / risk, 2),
    suggestedRiskPct,
    notes: [
      isReversal ? "Primary target is the range midpoint first." : "Use rejection from value as the confirmation.",
      `Execution timeframe: ${executionCtx.timeframe}`,
    ],
  };
}

export function computeGlobalDecision(
  _rows: MultiTFRow[],
  executionCtx: MarketContext,
  anchorCtx: MarketContext,
  consensus: MultiTFConsensus
): GlobalDecision {
  const bias = getBias(consensus);
  const context: ContextLayer = {
    anchorTimeframe: anchorCtx.timeframe,
    activeTimeframe: executionCtx.timeframe,
    regime: getRegime(anchorCtx),
    rangePosition: getRangePosition(anchorCtx.pricePositionPct),
    mtfConsensus: getConsensusBlock(consensus),
    volume: getVolume(executionCtx.volumeRatioPct),
  };

  const setup: SetupLayer = {
    liquidity: getLiquidityBlock(bias, context.rangePosition),
    sweep: getSweepBlock(bias, executionCtx),
    structure: getStructureBlock(bias, executionCtx),
    confirmation: getConfirmationBlock(bias, executionCtx, context.volume),
    archetype: {
      label: "",
      detail: "",
      tone: "bad",
      kind: "NONE",
    },
  };

  setup.archetype = getArchetypeBlock(
    bias,
    anchorCtx,
    executionCtx,
    setup.sweep,
    setup.structure
  );

  const readinessBreakdown: ReadinessBreakdown = {
    biasAlignment: getBiasAlignmentScore(bias, consensus),
    rangePosition: getRangeScore(bias, executionCtx.pricePositionPct),
    volume: getVolumeScore(context.volume.condition),
    liquidity: toneScore(setup.liquidity.tone, 10),
    sweep: toneScore(setup.sweep.tone, 10),
    structure: toneScore(setup.structure.tone, 10),
    executionTrigger: toneScore(setup.confirmation.tone, 10),
  };

  const readinessScore = clamp(sum(Object.values(readinessBreakdown)), 0, 100);
  const readinessStage = getReadinessStage(readinessScore);

  let signal: GlobalDecision["signal"];
  if (bias === "NEUTRAL") {
    signal = "NO_TRADE";
  } else if (readinessScore >= 76) {
    signal = "READY";
  } else if (readinessScore >= 51) {
    signal = bias === "BULLISH" ? "LOOK_FOR_LONGS" : "LOOK_FOR_SHORTS";
  } else {
    signal = "WAIT";
  }

  const positionSizeModifier = getPositionSizeModifier(signal, consensus);
  const reasons = buildReasons(signal, bias, context, setup, readinessScore);
  const warnings = buildWarnings(context, setup, bias);
  const steps = buildSteps(context, setup, readinessScore);
  const execution = buildExecutionPlan(
    signal,
    bias,
    anchorCtx,
    executionCtx,
    setup.archetype,
    positionSizeModifier
  );

  return {
    signal,
    bias,
    label: getStateLabel(signal, readinessStage),
    executionTF: executionCtx.timeframe,
    positionSizeModifier,
    readinessScore,
    readinessStage,
    reasons,
    warnings,
    steps,
    consensus,
    context,
    setup,
    readinessBreakdown,
    execution,
  };
}
