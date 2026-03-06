export type Trend = "up" | "down" | "sideways";
export type MarketState = "expansion" | "equilibrium";
export type Alignment = "bullish" | "bearish" | "sideways";
export type Signal = "UP" | "DOWN" | "WATCH" | "WAIT";
export type GlobalSignal =
  | "NO_TRADE"
  | "WAIT"
  | "LOOK_FOR_LONGS"
  | "LOOK_FOR_SHORTS"
  | "READY";
export type GlobalBias = "BULLISH" | "BEARISH" | "NEUTRAL";
export type ConvictionLabel =
  | "HIGH CONVICTION"
  | "LOW CONVICTION"
  | "NO TRADE"
  | "LOW CONVICTION — Range apenas"
  | "NO TRADE — Conflito HTF/LTF";
export type StepStatus = "ok" | "warn" | "bad";
export type ConsensusDirection = "bullish" | "bearish" | "mixed";
export type ConflictLevel = "none" | "low" | "high";
export type RecommendedAction = "LONG_BIAS" | "SHORT_BIAS" | "WAIT";
export type PositionSizeModifier = 1 | 0.5 | 0.25;
export type RangePositionLabel =
  | "BREAKDOWN"
  | "EXTREME_LOW"
  | "LOW"
  | "MID"
  | "HIGH"
  | "EXTREME_HIGH"
  | "BREAKOUT";
export type VolumeCondition = "STRONG" | "HEALTHY" | "LIGHT" | "WEAK";
export type MarketMode = "TREND" | "RANGE" | "EXPANSION" | "COMPRESSION";
export type SetupStage =
  | "NO_SETUP"
  | "CONTEXT_FORMING"
  | "SETUP_DEVELOPING"
  | "EXECUTION_READY";
export type SetupArchetype =
  | "NONE"
  | "RANGE_REVERSAL"
  | "TREND_CONTINUATION"
  | "FAILED_BREAKOUT"
  | "COMPRESSION_EXPANSION"
  | "SWEEP_STRUCTURE_SHIFT";

export interface MarketContext {
  symbol: string;
  timeframe: string;
  price: number;
  priceChangePct: number;
  trend: Trend;
  marketState: MarketState;
  stateReason: string;
  pricePositionPct: number;
  rangeHigh: number;
  rangeLow: number;
  ema12: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  volumeRatioPct: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  updatedAt: string;
}

export interface ContextBatchError {
  symbol: string;
  error: string;
}

export interface ContextBatchResponse {
  timeframe: string;
  results: MarketContext[];
  errors: ContextBatchError[];
  requestedCount: number;
  fulfilledCount: number;
  failedCount: number;
}

export interface MultiTFRow {
  timeframe: string;
  ema12: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  volumeRatioX: number;
  alignment: Alignment;
}

export interface MultiTFConsensus {
  weightedScore: number;
  direction: ConsensusDirection;
  conflictLevel: ConflictLevel;
  htfBias: ConsensusDirection;
  ltfBias: ConsensusDirection;
  recommendedAction: RecommendedAction;
  positionSizeModifier: PositionSizeModifier;
  summary: string;
}

export interface DecisionStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  details: string;
}

export interface EngineStatusBlock {
  label: string;
  detail: string;
  tone: StepStatus;
}

export interface ContextLayer {
  anchorTimeframe: string;
  activeTimeframe: string;
  marketMode: EngineStatusBlock & {
    mode: MarketMode;
  };
  regime: EngineStatusBlock;
  rangePosition: EngineStatusBlock & {
    zone: RangePositionLabel;
    valuePct: number;
  };
  mtfConsensus: EngineStatusBlock & {
    weightedScore: number;
    htfBias: ConsensusDirection;
    ltfBias: ConsensusDirection;
    conflictLevel: ConflictLevel;
  };
  volume: EngineStatusBlock & {
    condition: VolumeCondition;
    ratioPct: number;
  };
}

export interface SetupLayer {
  liquidity: EngineStatusBlock;
  sweep: EngineStatusBlock;
  structure: EngineStatusBlock;
  confirmation: EngineStatusBlock;
  archetype: EngineStatusBlock & {
    kind: SetupArchetype;
  };
}

export interface ReadinessBreakdown {
  biasAlignment: number;
  rangePosition: number;
  volume: number;
  liquidity: number;
  sweep: number;
  structure: number;
  executionTrigger: number;
}

export interface ExecutionPlan {
  allowed: boolean;
  emphasis: "secondary" | "primary";
  entryModel: string;
  trigger: string;
  preferredDirection: string;
  requiredTrigger: string;
  suggestedEntry: number | null;
  invalidation: number | null;
  target1: number | null;
  target2: number | null;
  rr: number | null;
  suggestedRiskPct: number | null;
  notes: string[];
}

export interface ScoreBreakdown {
  trend: number;    // 0–30
  regime: number;   // 0–20
  position: number; // 0–20
  momentum: number; // 0–15
  volume: number;   // 0–15
}

export interface Decision {
  signal: Signal;
  label: ConvictionLabel;
  confidenceScore: number;
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
  steps: DecisionStep[];
  consensus: MultiTFConsensus;
}

export interface EngineConfidence {
  score: number;
  label: string;
  tone: StepStatus;
}

export interface GlobalDecision {
  signal: GlobalSignal;
  bias: GlobalBias;
  label: string;
  executionTF: string;
  positionSizeModifier: number;
  engineConfidence: EngineConfidence;
  readinessScore: number;
  readinessStage: SetupStage;
  reasons: string[];
  warnings: string[];
  steps: DecisionStep[];
  consensus: MultiTFConsensus;
  context: ContextLayer;
  setup: SetupLayer;
  readinessBreakdown: ReadinessBreakdown;
  execution: ExecutionPlan;
}

export interface ContextSnapshot {
  version: 1;
  id: string;
  timestamp: string;
  contextHash: string;
  pair: string;
  timeframe: string;
  regime: string;
  trend: string;
  rangePosition: number;
  rsi: number;
  macdHistogram: number;
  volumeRatioPct: number;
  confidenceScore: number;
  consensusScore?: number;
  positionSizeModifier?: number;
  signalMode?: "confirmed" | "preview";
  signal: string;
  label: string;
  decision?: "long" | "short" | "no_trade";
  result?: "win" | "loss" | "breakeven";
  notes?: string;
  warnings?: string[];
}
