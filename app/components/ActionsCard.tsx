"use client";

import { MarketContext } from "@/types/market";
import { formatUpdatedAt } from "@/lib/format";
import { RefreshCw, Copy, ExternalLink, Settings2 } from "lucide-react";

interface Props {
  ctx: MarketContext | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function ActionsCard({ ctx, loading, onRefresh }: Props) {
  function handleCopy() {
    if (!ctx) return;
    const text = [
      `Symbol: ${ctx.symbol} (${ctx.timeframe})`,
      `Price: $${ctx.price}`,
      `Trend: ${ctx.trend.toUpperCase()}`,
      `Regime: ${ctx.marketState.toUpperCase()}`,
      `Range position: ${ctx.pricePositionPct}%`,
      `RSI: ${ctx.rsi14}`,
      `Volume ratio: ${(ctx.volumeRatioPct / 100).toFixed(2)}x`,
      `State: ${ctx.stateReason}`,
      `Updated: ${ctx.updatedAt}`,
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => { });
  }

  function handleTradingView() {
    if (!ctx) return;
    const sym = ctx.symbol.replace("USDT", "");
    window.open(`https://www.tradingview.com/chart/?symbol=BINANCE:${sym}USDT`, "_blank");
  }

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 relative">
      <div className="flex items-center gap-2 mb-8 pl-1">
        <Settings2 className="size-4 text-text-muted/60" />
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Actions</h2>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="group/btn w-full rounded-lg bg-primary text-white px-4 py-2.5 text-[13px] font-medium transition-all hover:bg-blue-600 hover:glow-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing" : "Refresh Analysis"}
        </button>

        <button
          onClick={handleCopy}
          disabled={!ctx}
          className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-2.5 text-[13px] font-medium text-text-muted transition-all hover:text-primary hover:bg-primary/10 hover:border-primary/20 hover:glow-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Copy className="size-3.5" />
          Copy Summary
        </button>

        <button
          onClick={handleTradingView}
          disabled={!ctx}
          className="w-full rounded-lg border border-transparent bg-transparent px-4 py-2.5 text-[13px] font-medium text-text-muted transition-all hover:text-primary hover:bg-primary/10 hover:glow-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Open Chart
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {ctx && (
        <div className="mt-8 flex justify-between items-center text-[10px] font-mono text-text-muted/60 pt-4 border-t border-white/5 pl-1">
          <span className="uppercase tracking-[0.2em]">Updated</span>
          <span>{formatUpdatedAt(ctx.updatedAt)}</span>
        </div>
      )}
    </div>
  );
}
