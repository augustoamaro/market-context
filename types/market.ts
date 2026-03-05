export type Trend = "up" | "down" | "sideways";
export type MarketState = "expansion" | "equilibrium";
export type Alignment = "bullish" | "bearish" | "sideways";
export type Signal = "UP" | "DOWN" | "WAIT";
export type ConvictionLabel = "HIGH CONVICTION" | "LOW CONVICTION" | "NO TRADE";
export type StepStatus = "ok" | "warn" | "bad";
export type ConsensusDirection = "bullish" | "bearish" | "mixed";
export type ConflictLevel = "none" | "low" | "high";

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
  summary: string;
}

export interface DecisionStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  details: string;
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
  signal: string;
  label: string;
  decision?: "long" | "short" | "no_trade";
  result?: "win" | "loss" | "breakeven";
  notes?: string;
  warnings?: string[];
}
