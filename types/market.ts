export type Trend = "up" | "down" | "sideways";
export type MarketState = "expansion" | "equilibrium";
export type Alignment = "bullish" | "bearish" | "sideways";
export type Signal = "UP" | "DOWN" | "WAIT";
export type ConvictionLabel = "HIGH CONVICTION" | "LOW CONVICTION" | "NO TRADE";
export type StepStatus = "ok" | "warn" | "bad";

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
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  volumeRatioX: number;
  alignment: Alignment;
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
}
