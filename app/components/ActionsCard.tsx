"use client";

import { MarketContext } from "@/types/market";
import { formatUpdatedAt } from "@/lib/format";

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
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function handleTradingView() {
    if (!ctx) return;
    const sym = ctx.symbol.replace("USDT", "");
    window.open(`https://www.tradingview.com/chart/?symbol=BINANCE:${sym}USDT`, "_blank");
  }

  return (
    <div className="rounded-2xl border border-[#1E2A40] bg-[#0F1B2D] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full rounded-xl bg-info px-4 py-2.5 text-sm font-semibold text-[#0B1220] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Refreshing…" : "Refresh Analysis"}
        </button>

        <button
          onClick={handleCopy}
          disabled={!ctx}
          className="w-full rounded-xl border border-[#1E2A40] bg-[#0C1626] px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-text hover:border-muted disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          Copy Summary
        </button>

        <button
          onClick={handleTradingView}
          disabled={!ctx}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-info cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Open in TradingView ↗
        </button>
      </div>

      {ctx && (
        <p className="mt-4 flex justify-between text-[10px] font-mono text-muted border-t border-[#1E2A40] pt-3">
          <span>Last updated</span>
          <span>{formatUpdatedAt(ctx.updatedAt)}</span>
        </p>
      )}
    </div>
  );
}
