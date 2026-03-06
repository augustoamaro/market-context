import { TIMEFRAMES } from "@/lib/config";
import { computeGlobalDecision, computeMultiTFConsensus, deriveAlignment } from "@/lib/decision";
import { GlobalDecision, MarketContext, MultiTFRow } from "@/types/market";

export interface TopSetup {
  symbol: string;
  signal: GlobalDecision["signal"];
  bias: GlobalDecision["bias"];
  qualityScore: number;
}

export function contextToMultiTFRow(ctx: MarketContext): MultiTFRow {
  return {
    timeframe: ctx.timeframe,
    ema12: ctx.ema12,
    ema20: ctx.ema20,
    ema50: ctx.ema50,
    ema200: ctx.ema200,
    rsi14: ctx.rsi14,
    volumeRatioX: ctx.volumeRatioPct / 100,
    alignment: deriveAlignment(ctx.ema12, ctx.ema20, ctx.ema50, ctx.ema200),
  };
}

export function pickTopGlobalSetup(
  contextsBySymbol: Record<string, MarketContext[]>
): TopSetup | null {
  let best: TopSetup | null = null;

  for (const [symbol, contexts] of Object.entries(contextsBySymbol)) {
    const uniqueTimeframes = new Set(contexts.map((ctx) => ctx.timeframe));
    if (!TIMEFRAMES.every((timeframe) => uniqueTimeframes.has(timeframe))) {
      continue;
    }

    const rows = contexts.map(contextToMultiTFRow);
    const consensus = computeMultiTFConsensus(rows);
    const executionCtx = contexts.find((ctx) => ctx.timeframe === "1h");
    const anchorCtx = contexts.find((ctx) => ctx.timeframe === "4h");

    if (!executionCtx || !anchorCtx) {
      continue;
    }

    const decision = computeGlobalDecision(rows, executionCtx, anchorCtx, consensus);
    if (decision.signal !== "READY" || decision.bias === "NONE") {
      continue;
    }

    const qualityScore = Math.round(Math.abs(decision.consensus.weightedScore));
    const candidate: TopSetup = {
      symbol,
      signal: decision.signal,
      bias: decision.bias,
      qualityScore,
    };

    if (
      best === null ||
      candidate.qualityScore > best.qualityScore
    ) {
      best = candidate;
    }
  }

  return best;
}
