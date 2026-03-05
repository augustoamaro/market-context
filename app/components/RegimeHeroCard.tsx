import { MarketContext } from "@/types/market";
import CardSkeleton from "./Skeleton";

interface Props {
  ctx: MarketContext | null;
  loading: boolean;
  error: string | null;
}

export default function RegimeHeroCard({ ctx, loading, error }: Props) {
  if (loading) return <CardSkeleton rows={2} height="h-32" />;
  if (error || !ctx) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
        {error ?? "No data available"}
      </div>
    );
  }

  const isExpansion = ctx.marketState === "expansion";
  const stateColor = isExpansion ? "text-success" : "text-warn";
  const stateBg = isExpansion ? "bg-success/10 border-success/20" : "bg-warn/10 border-warn/20";
  const trendUp = ctx.trend === "up";
  const trendColor = trendUp ? "text-success" : ctx.trend === "down" ? "text-danger" : "text-warn";

  return (
    <div className="rounded-2xl border border-[#1E2A40] bg-[#0F1B2D] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted mb-2">Market Regime</p>
          <p className={`text-3xl font-semibold tracking-tight ${stateColor}`}>
            {ctx.marketState.toUpperCase()}
          </p>
          <p className="mt-2 text-sm text-muted">{ctx.stateReason}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Signal chip */}
          <span className="rounded-full border border-info/30 bg-info/10 px-3 py-1 text-xs font-semibold text-info tracking-wider">
            {ctx.trend.toUpperCase()} + {ctx.marketState.toUpperCase()}
          </span>
          {/* State badge */}
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${stateBg} ${stateColor}`}>
            {isExpansion ? "EXPANSION" : "EQUILIBRIUM"}
          </span>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="mt-4 flex gap-6 border-t border-[#1E2A40] pt-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Trend</p>
          <p className={`text-sm font-semibold ${trendColor}`}>{ctx.trend.toUpperCase()}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">RSI 14</p>
          <p className="text-sm font-semibold text-text">{ctx.rsi14.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Vol Ratio</p>
          <p className="text-sm font-semibold text-text">{(ctx.volumeRatioPct / 100).toFixed(2)}x</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">EMA 20</p>
          <p className="text-sm font-semibold text-text">
            {ctx.ema20.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
