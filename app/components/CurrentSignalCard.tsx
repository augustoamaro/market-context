"use client";

import { useState } from "react";
import { Decision, ConvictionLabel, MarketContext } from "@/types/market";
import { saveSnapshot, updateSnapshot } from "@/lib/journal";
import CardSkeleton from "./Skeleton";
import { Radio, ChevronRight, BookmarkPlus, Check } from "lucide-react";

interface Props {
  decision: Decision | null;
  ctx: MarketContext | null;
  loading: boolean;
}

const labelStyles: Record<ConvictionLabel, { color: string }> = {
  "HIGH CONVICTION": { color: "text-success" },
  "LOW CONVICTION": { color: "text-warn" },
  "NO TRADE": { color: "text-text-muted" },
  "LOW CONVICTION — Range apenas": { color: "text-warn" },
  "NO TRADE — Conflito HTF/LTF": { color: "text-danger" },
};

const signalColor: Record<string, string> = {
  UP: "text-success",
  DOWN: "text-danger",
  WATCH: "text-warn",
  WAIT: "text-text-muted",
};

type TradeDecision = "long" | "short" | "no_trade";

export default function CurrentSignalCard({ decision, ctx, loading }: Props) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showDecision, setShowDecision] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  if (loading) return <CardSkeleton rows={3} height="h-48" />;
  if (!decision) return null;

  const { color: badgeColor } = labelStyles[decision.label];
  const sigColor = signalColor[decision.signal] ?? "text-text";
  const score = decision.confidenceScore;
  const suggestedSizePct = Math.round(decision.consensus.positionSizeModifier * 100);
  const showSizeHint =
    decision.signal !== "WAIT" && decision.consensus.positionSizeModifier < 1;
  const directionalBias =
    decision.consensus.recommendedAction === "LONG_BIAS"
      ? { text: "Bom para longs: ✅", cls: "text-success" }
      : decision.consensus.recommendedAction === "SHORT_BIAS"
        ? { text: "Bom para shorts: ✅", cls: "text-danger" }
        : null;

  // P6 — Anti-overtrading guard
  const guard =
    score < 40
      ? { msg: "DO NOT TRADE — Context too weak", cls: "bg-red-500/10 border border-red-500/30 text-red-400" }
      : score < 60
      ? { msg: "Reduce size — low conviction", cls: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400" }
      : null;

  function handleSave() {
    if (!ctx || !decision) return;
    const id = crypto.randomUUID();
    const saved = saveSnapshot({
      version: 1,
      id,
      timestamp: new Date().toISOString(),
      contextHash: `${ctx.symbol}_${ctx.timeframe}_${ctx.marketState}_${Math.round(ctx.pricePositionPct)}_score${decision.confidenceScore}`,
      pair: ctx.symbol,
      timeframe: ctx.timeframe,
      regime: ctx.marketState,
      trend: ctx.trend,
      rangePosition: Math.round(ctx.pricePositionPct),
      rsi: ctx.rsi14,
      macdHistogram: ctx.macdHistogram,
      volumeRatioPct: ctx.volumeRatioPct,
      confidenceScore: decision.confidenceScore,
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

  function handleDecision(dec: TradeDecision | null) {
    if (savedId && dec) updateSnapshot(savedId, { decision: dec });
    setShowDecision(false);
  }

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 relative min-h-[260px] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-6 pl-1">
          <Radio className="size-4 text-text-muted animate-pulse" />
          <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Current Signal</h2>
        </div>

        {/* P6 — guard banner */}
        {guard && (
          <div className={`mb-6 rounded-lg px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest ${guard.cls}`}>
            {guard.msg}
          </div>
        )}

        {/* Primary signal */}
        <div className="flex items-end justify-between mb-8 pl-1">
          <p className={`text-6xl font-medium tracking-tighter leading-none ${sigColor}`}>
            {decision.signal}
          </p>

          <div className="flex flex-col items-end gap-1">
            <span className={`text-[11px] uppercase tracking-widest font-semibold ${badgeColor}`}>
              {decision.label}
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono">
              Score: {decision.confidenceScore}/100
            </span>
          </div>
        </div>

        {showSizeHint && (
          <div className="mb-6 mx-1 rounded-lg border border-warn/25 bg-warn/10 px-3 py-2">
            <div className="text-[11px] font-medium text-warn">
              Tamanho sugerido: {suggestedSizePct}%
            </div>
            <div className="mt-1 text-[11px] text-text-muted">
              {decision.consensus.conflictLevel === "high"
                ? "Conflito HTF/LTF detectado"
                : "Contexto parcial entre timeframes"}
            </div>
          </div>
        )}

        {directionalBias && (
          <div className={`mb-6 mx-1 text-[12px] font-medium ${directionalBias.cls}`}>
            {directionalBias.text}
          </div>
        )}

        {/* Progress track */}
        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden mx-1">
          <div
            className="h-full bg-text transition-all duration-1000 ease-out"
            style={{ width: `${decision.confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Reasons */}
      {decision.reasons.length > 0 && (
        <ul className="mt-8 space-y-3 pl-1">
          {decision.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] text-text-muted leading-relaxed">
              <ChevronRight className="size-4 text-text-muted/50 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {/* P2 — Trade decision form (shown after saving) */}
      {showDecision && (
        <div className="mt-6 pt-5 border-t border-white/5">
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-3">Trade Decision</p>
          <div className="flex flex-wrap gap-2">
            {(["long", "short", "no_trade"] as TradeDecision[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDecision(d)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/5 hover:bg-white/10 text-text-muted hover:text-text transition-colors"
              >
                {d === "no_trade" ? "No Trade" : d.charAt(0).toUpperCase() + d.slice(1)}
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

      {/* P2 — Save snapshot button */}
      {!showDecision && ctx && (
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
