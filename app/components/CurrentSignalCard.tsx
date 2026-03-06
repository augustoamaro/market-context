"use client";

import { useState } from "react";
import { AlertTriangle, BookmarkPlus, Check, ChevronRight, Radio } from "lucide-react";
import { GlobalDecision, MarketContext } from "@/types/market";
import { saveSnapshot, updateSnapshot } from "@/lib/journal";
import CardSkeleton from "./Skeleton";

interface Props {
  globalDecision: GlobalDecision | null;
  executionCtx: MarketContext | null;
  loading: boolean;
}

type TradeDecision = "long" | "short" | "no_trade";

const stateStyles = {
  NO_TRADE: {
    title: "text-text-muted",
    badge: "bg-white/5 text-text-muted border-white/10",
    glow: "from-white/8 via-white/3 to-transparent",
  },
  WAIT: {
    title: "text-warn",
    badge: "bg-warn/10 text-warn border-warn/20",
    glow: "from-warn/12 via-warn/4 to-transparent",
  },
  LOOK_FOR_LONGS: {
    title: "text-success",
    badge: "bg-success/10 text-success border-success/20",
    glow: "from-success/12 via-success/4 to-transparent",
  },
  LOOK_FOR_SHORTS: {
    title: "text-danger",
    badge: "bg-danger/10 text-danger border-danger/20",
    glow: "from-danger/12 via-danger/4 to-transparent",
  },
  READY: {
    title: "text-text",
    badge: "bg-primary/15 text-text border-primary/20",
    glow: "from-primary/18 via-primary/6 to-transparent",
  },
} as const;

const biasStyles = {
  BULLISH: "bg-success/10 text-success border-success/20",
  BEARISH: "bg-danger/10 text-danger border-danger/20",
  NEUTRAL: "bg-white/5 text-text-muted border-white/10",
} as const;

const readinessLabel = {
  NO_SETUP: "No setup",
  CONTEXT_FORMING: "Context forming",
  SETUP_DEVELOPING: "Setup developing",
  EXECUTION_READY: "Execution-ready",
} as const;

function labelClass(signal: GlobalDecision["signal"], bias: GlobalDecision["bias"]): string {
  if (signal === "NO_TRADE") return "text-text-muted";
  if (signal === "WAIT") return "text-warn";
  if (signal === "READY" && bias === "BEARISH") return "text-danger";
  if (signal === "LOOK_FOR_SHORTS") return "text-danger";
  return "text-success";
}

export default function CurrentSignalCard({ globalDecision, executionCtx, loading }: Props) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showDecision, setShowDecision] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  if (loading) return <CardSkeleton rows={5} height="h-72" />;
  if (!globalDecision) return null;

  const decision = globalDecision;

  const stateStyle = stateStyles[decision.signal];
  const biasStyle = biasStyles[decision.bias];
  const readinessPct = Math.max(decision.readinessScore, 6);
  const labelColor = labelClass(decision.signal, decision.bias);
  const biasText =
    decision.bias === "BULLISH"
      ? "Bullish"
      : decision.bias === "BEARISH"
        ? "Bearish"
        : "Neutral";

  function handleSave() {
    if (!executionCtx) return;

    const id = crypto.randomUUID();
    const saved = saveSnapshot({
      version: 1,
      id,
      timestamp: new Date().toISOString(),
      contextHash: `${executionCtx.symbol}_${decision.executionTF}_${decision.bias}_${decision.signal}_${decision.label}`,
      pair: executionCtx.symbol,
      timeframe: decision.executionTF,
      regime: executionCtx.marketState,
      trend: executionCtx.trend,
      rangePosition: Math.round(executionCtx.pricePositionPct),
      rsi: executionCtx.rsi14,
      macdHistogram: executionCtx.macdHistogram,
      volumeRatioPct: executionCtx.volumeRatioPct,
      confidenceScore: decision.readinessScore,
      consensusScore: Math.round(decision.consensus.weightedScore),
      positionSizeModifier: decision.positionSizeModifier,
      signalMode: "confirmed",
      signal: decision.signal,
      label: decision.label,
    });

    if (!saved) {
      setDuplicate(true);
      setTimeout(() => setDuplicate(false), 2500);
      return;
    }

    setSavedId(id);
    setShowDecision(true);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  function handleDecision(decision: TradeDecision | null) {
    if (savedId && decision) updateSnapshot(savedId, { decision });
    setShowDecision(false);
  }

  return (
    <div className="bento-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stateStyle.glow}`} />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-text-muted" />
            <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Current State
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${biasStyle}`}>
              Bias: {biasText}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-text-muted">
              {decision.executionTF} execution
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">State</p>
                <h1 className={`mt-2 text-4xl font-semibold tracking-tight sm:text-5xl ${stateStyle.title}`}>
                  {decision.signal}
                </h1>
              </div>

              <div className="pb-1">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${stateStyle.badge}`}>
                  {decision.label}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Readiness</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-text">
                  {decision.readinessScore}
                  <span className="text-sm text-text-muted">/100</span>
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  {readinessLabel[decision.readinessStage]}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Regime</p>
                <p className="mt-2 text-[18px] font-semibold tracking-tight text-text">
                  {decision.context.regime.label}
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  Anchor {decision.context.anchorTimeframe}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Range Position</p>
                <p className="mt-2 text-[18px] font-semibold tracking-tight text-text">
                  {decision.context.rangePosition.label}
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  {decision.context.rangePosition.valuePct}% of range
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-end justify-between">
                <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Readiness ladder</span>
                <span className={`text-[12px] font-mono font-medium leading-none ${labelColor}`}>
                  {decision.readinessScore}/100
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/6">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${decision.bias === "BULLISH"
                      ? "bg-success"
                      : decision.bias === "BEARISH"
                        ? "bg-danger"
                        : "bg-warn"
                    }`}
                  style={{ width: `${readinessPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Why</p>
            <ul className="mt-4 space-y-3">
              {decision.reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3 text-[13px] leading-relaxed text-text-muted">
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-text-muted/50" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>

            {decision.warnings.length > 0 && (
              <div className="mt-5 rounded-xl border border-warn/15 bg-warn/8 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-warn" />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-warn">Watchouts</p>
                </div>
                <ul className="mt-3 space-y-2">
                  {decision.warnings.slice(0, 3).map((warning) => (
                    <li key={warning} className="text-[12px] leading-relaxed text-warn/85">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {showDecision ? (
          <div className="mt-6 border-t border-white/6 pt-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Trade decision</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["long", "short", "no_trade"] as TradeDecision[]).map((decision) => (
                <button
                  key={decision}
                  onClick={() => handleDecision(decision)}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-[12px] font-medium text-text-muted transition-colors hover:bg-white/10 hover:text-text"
                >
                  {decision === "no_trade" ? "No Trade" : decision.charAt(0).toUpperCase() + decision.slice(1)}
                </button>
              ))}
              <button
                onClick={() => handleDecision(null)}
                className="rounded-lg px-3 py-1.5 text-[12px] text-text-muted/50 transition-colors hover:text-text-muted"
              >
                Skip
              </button>
            </div>
          </div>
        ) : executionCtx ? (
          <div className="mt-6 flex justify-end border-t border-white/6 pt-5">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:bg-white/10 hover:text-text"
            >
              {justSaved ? (
                <>
                  <Check className="size-3.5 text-success" />
                  <span className="text-success">Saved</span>
                </>
              ) : duplicate ? (
                <span className="text-text-muted/50">Already saved (60s cooldown)</span>
              ) : (
                <>
                  <BookmarkPlus className="size-3.5" />
                  <span>Save Snapshot</span>
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
