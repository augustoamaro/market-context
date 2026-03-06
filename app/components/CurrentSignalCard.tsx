"use client";

import { useState } from "react";
import { GlobalDecision, MarketContext } from "@/types/market";
import { saveSnapshot, updateSnapshot } from "@/lib/journal";
import CardSkeleton from "./Skeleton";
import { Radio, ChevronRight, BookmarkPlus, Check } from "lucide-react";

interface Props {
  globalDecision: GlobalDecision | null;
  executionCtx: MarketContext | null;
  loading: boolean;
}

const signalStyles = {
  READY: { text: "text-success", badge: "bg-success/10 text-success border-success/20" },
  WATCH: { text: "text-warn", badge: "bg-warn/10 text-warn border-warn/20" },
  WAIT: { text: "text-text-muted", badge: "bg-white/5 text-text-muted border-white/10" },
} as const;

const biasStyles = {
  LONG: "bg-success/10 text-success border-success/20",
  SHORT: "bg-danger/10 text-danger border-danger/20",
  NONE: "bg-white/5 text-text-muted border-white/10",
} as const;

type TradeDecision = "long" | "short" | "no_trade";

function labelClass(label: string): string {
  if (label.includes("HIGH")) return "text-success";
  if (label.includes("NO TRADE")) return label.includes("Conflito") ? "text-danger" : "text-text-muted";
  return "text-warn";
}

export default function CurrentSignalCard({ globalDecision, executionCtx, loading }: Props) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showDecision, setShowDecision] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  if (loading) return <CardSkeleton rows={4} height="h-56" />;
  if (!globalDecision) return null;

  const signalStyle = signalStyles[globalDecision.signal];
  const labelColor = labelClass(globalDecision.label);
  const showSize = globalDecision.positionSizeModifier > 0;
  const sizePct = Math.round(globalDecision.positionSizeModifier * 100);
  const consensusScore = Math.round(globalDecision.consensus.weightedScore);
  const confidenceScore = Math.abs(consensusScore);

  function handleSave() {
    if (!executionCtx || !globalDecision) return;

    const id = crypto.randomUUID();
    const saved = saveSnapshot({
      version: 1,
      id,
      timestamp: new Date().toISOString(),
      contextHash: `${executionCtx.symbol}_${globalDecision.executionTF}_${globalDecision.bias}_${globalDecision.signal}_${globalDecision.label}`,
      pair: executionCtx.symbol,
      timeframe: globalDecision.executionTF,
      regime: executionCtx.marketState,
      trend: executionCtx.trend,
      rangePosition: Math.round(executionCtx.pricePositionPct),
      rsi: executionCtx.rsi14,
      macdHistogram: executionCtx.macdHistogram,
      volumeRatioPct: executionCtx.volumeRatioPct,
      confidenceScore,
      consensusScore,
      positionSizeModifier: globalDecision.positionSizeModifier,
      signalMode: "confirmed",
      signal: globalDecision.signal,
      label: globalDecision.label,
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
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 relative min-h-[320px] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-6 pl-1">
          <Radio className="size-4 text-text-muted animate-pulse" />
          <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Current Signal</h2>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3 pl-1">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${biasStyles[globalDecision.bias]}`}>
            Global: {globalDecision.bias}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
            Execution TF: {globalDecision.executionTF}
          </span>
        </div>

        <div className="flex items-end justify-between gap-4 mb-8 pl-1">
          <p className={`text-6xl font-medium tracking-tighter leading-none ${signalStyle.text}`}>
            {globalDecision.signal}
          </p>

          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${signalStyle.badge}`}>
              {globalDecision.signal}
            </span>
            <span className={`text-[11px] uppercase tracking-widest font-semibold text-right ${labelColor}`}>
              {globalDecision.label}
            </span>
          </div>
        </div>

        {showSize && (
          <div className="mb-6 mx-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.16em]">
                Tamanho
              </span>
              <span className="text-[13px] font-mono text-text">
                {sizePct}%
              </span>
            </div>
          </div>
        )}

        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden mx-1">
          <div
            className={`h-full transition-all duration-1000 ease-out ${signalStyle.text.replace("text-", "bg-")}`}
            style={{ width: `${Math.max(sizePct, 10)}%` }}
          />
        </div>
      </div>

      {globalDecision.reasons.length > 0 && (
        <ul className="mt-8 space-y-3 pl-1">
          {globalDecision.reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-3 text-[13px] text-text-muted leading-relaxed">
              <ChevronRight className="size-4 text-text-muted/50 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {showDecision && (
        <div className="mt-6 pt-5 border-t border-white/5">
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-3">Trade Decision</p>
          <div className="flex flex-wrap gap-2">
            {(["long", "short", "no_trade"] as TradeDecision[]).map((decision) => (
              <button
                key={decision}
                onClick={() => handleDecision(decision)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/5 hover:bg-white/10 text-text-muted hover:text-text transition-colors"
              >
                {decision === "no_trade" ? "No Trade" : decision.charAt(0).toUpperCase() + decision.slice(1)}
              </button>
            ))}
            <button
              onClick={() => handleDecision(null)}
              className="px-3 py-1.5 rounded-lg text-[12px] text-text-muted/40 hover:text-text-muted transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {!showDecision && executionCtx && (
        <div className="mt-6 pt-5 border-t border-white/5 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-text-muted hover:text-text transition-colors"
          >
            {justSaved ? (
              <>
                <Check className="size-3.5 text-green-400" />
                <span className="text-green-400">Saved</span>
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
      )}
    </div>
  );
}
