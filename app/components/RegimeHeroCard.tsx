import { MarketContext } from "@/types/market";
import CardSkeleton from "./Skeleton";
import { ArrowRight, Activity, Percent, BarChart2, TrendingUp } from "lucide-react";

interface Props {
  ctx: MarketContext | null;
  loading: boolean;
  error: string | null;
}

export default function RegimeHeroCard({ ctx, loading, error }: Props) {
  if (loading) return <CardSkeleton rows={2} height="h-32" />;
  if (error || !ctx) {
    return (
      <div className="bento-card rounded-xl p-6 text-[13px] text-danger/80">
        {error ?? "No data available"}
      </div>
    );
  }

  const isExpansion = ctx.marketState === "expansion";
  const stateColor = isExpansion ? "text-text" : "text-text-muted";
  const badgeColor = isExpansion ? "bg-success/20 text-success" : "bg-white/5 text-text-muted";

  const trendUp = ctx.trend === "up";
  const trendColor = trendUp ? "text-success" : ctx.trend === "down" ? "text-danger" : "text-warn";

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
      {isExpansion && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      )}

      {/* Header Row */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted mb-3 flex items-center gap-2">
            <Activity className="size-3" strokeWidth={2} />
            Market Regime
          </h2>
          <div className="flex items-center gap-3 relative z-10">
            {isExpansion && (
              <div className="w-3 h-3 rounded-full bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse"></div>
            )}
            <h1 className={`text-4xl sm:text-5xl font-medium tracking-tight ${stateColor}`}>
              {ctx.marketState.charAt(0).toUpperCase() + ctx.marketState.slice(1)}
            </h1>
            <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-widest ${badgeColor}`}>
              {isExpansion ? "Active" : "Neutral"}
            </div>
          </div>
          <p className="mt-4 text-[13px] text-text-muted leading-relaxed max-w-lg">
            {ctx.stateReason}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden">
        <div className="bg-[#111] p-4 flex flex-col justify-between">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5 pt-1">
            <ArrowRight className="size-3" /> Trend
          </p>
          <p className={`text-[15px] font-medium ${trendColor}`}>{ctx.trend.charAt(0).toUpperCase() + ctx.trend.slice(1)}</p>
        </div>

        <div className="bg-[#111] p-4 flex flex-col justify-between">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5 pt-1">
            <Percent className="size-3" /> RSI 14
          </p>
          <p className="text-[15px] font-medium text-text">{ctx.rsi14.toFixed(1)}</p>
        </div>

        <div className="bg-[#111] p-4 flex flex-col justify-between">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5 pt-1">
            <BarChart2 className="size-3" /> Vol Ratio
          </p>
          <p className="text-[15px] font-medium text-text">{(ctx.volumeRatioPct / 100).toFixed(2)}x</p>
        </div>

        <div className="bg-[#111] p-4 flex flex-col justify-between">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5 pt-1">
            <TrendingUp className="size-3" /> MACD
          </p>
          <p className={`text-[15px] font-mono font-medium ${ctx.macdHistogram > 0 ? "text-success" : ctx.macdHistogram < 0 ? "text-danger" : "text-text-muted"}`}>
            {ctx.macdHistogram > 0 ? "+" : ""}{ctx.macdHistogram.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
