import { MarketContext } from "@/types/market";
import CardSkeleton from "./Skeleton";
import { Activity } from "lucide-react";

interface Props {
  ctx: MarketContext | null;
  loading: boolean;
  error: string | null;
}

function rsiContext(rsi: number): { label: string; color: string } {
  if (rsi > 75) return { label: "Overbought", color: "text-danger" };
  if (rsi > 65) return { label: "Strong",     color: "text-warn" };
  if (rsi >= 45) return { label: "Healthy",   color: "text-success" };
  if (rsi >= 30) return { label: "Weak",      color: "text-warn" };
  return               { label: "Oversold",   color: "text-danger" };
}

function volContext(ratio: number): { label: string; color: string } {
  if (ratio >= 1.5) return { label: "Very high",   color: "text-success" };
  if (ratio >= 1.3) return { label: "Above avg",   color: "text-success" };
  if (ratio >= 0.9) return { label: "Average",     color: "text-text-muted" };
  return                   { label: "Below avg",   color: "text-warn" };
}

function macdContext(histogram: number): { label: string; color: string } {
  if (histogram > 0) return { label: "Bullish momentum", color: "text-success" };
  if (histogram < 0) return { label: "Bearish momentum", color: "text-danger" };
  return                    { label: "Neutral",           color: "text-text-muted" };
}

function trendContext(trend: MarketContext["trend"]): { label: string; sublabel: string; color: string } {
  if (trend === "up")   return { label: "Uptrend",   sublabel: "EMA 20 > 50 > 200", color: "text-success" };
  if (trend === "down") return { label: "Downtrend", sublabel: "EMA 20 < 50 < 200", color: "text-danger" };
  return                       { label: "Sideways",  sublabel: "EMAs mixed",        color: "text-warn" };
}

interface StatCellProps {
  label: string;
  value: string;
  context: string;
  contextColor: string;
  sublabel?: string;
  children?: React.ReactNode;
}

function StatCell({ label, value, context, contextColor, sublabel, children }: StatCellProps) {
  return (
    <div className="bg-[#0e0e0e] p-4 flex flex-col gap-2">
      <p className="text-[10px] text-text-muted uppercase tracking-widest">{label}</p>
      <p className="text-[15px] font-mono font-medium text-text leading-none">{value}</p>
      {children}
      <div>
        <p className={`text-[11px] font-medium ${contextColor}`}>{context}</p>
        {sublabel && <p className="text-[10px] text-text-muted/60 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

// Thin segmented bar for RSI
function RsiBar({ rsi }: { rsi: number }) {
  const pct = Math.min(100, Math.max(0, rsi));
  return (
    <div className="relative h-[3px] w-full rounded-full overflow-hidden bg-white/5">
      {/* zones */}
      <div className="absolute inset-y-0 left-0 bg-danger/30"    style={{ width: "30%" }} />
      <div className="absolute inset-y-0 bg-warn/20"             style={{ left: "30%", width: "15%" }} />
      <div className="absolute inset-y-0 bg-success/25"          style={{ left: "45%", width: "20%" }} />
      <div className="absolute inset-y-0 bg-warn/20"             style={{ left: "65%", width: "10%" }} />
      <div className="absolute inset-y-0 right-0 bg-danger/30"   style={{ width: "25%" }} />
      {/* marker */}
      <div
        className="absolute top-0 w-[3px] h-full bg-white rounded-full shadow-[0_0_4px_white] transition-all duration-700"
        style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
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

  const rsi  = rsiContext(ctx.rsi14);
  const vol  = volContext(ctx.volumeRatioPct / 100);
  const macd = macdContext(ctx.macdHistogram);
  const trend = trendContext(ctx.trend);

  const regimeColor     = isExpansion ? "text-text"        : "text-text-muted";
  const regimeBadgeBg   = isExpansion ? "bg-success/15 text-success" : "bg-white/5 text-text-muted";
  const regimeSubtext   = isExpansion
    ? "Directional move with volume — higher-probability setups"
    : "Market ranging without conviction — avoid directional trades";

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden">

      {/* Ambient glow */}
      {isExpansion && (
        <div className="absolute top-0 right-0 w-72 h-72 bg-success/8 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
      )}

      {/* Header */}
      <div className="relative z-10">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted mb-3 flex items-center gap-2">
          <Activity className="size-3" strokeWidth={2} />
          Market Regime
        </h2>

        <div className="flex items-center gap-3 mb-2">
          {isExpansion && (
            <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse shrink-0" />
          )}
          <h1 className={`text-4xl sm:text-5xl font-medium tracking-tight ${regimeColor}`}>
            {ctx.marketState.charAt(0).toUpperCase() + ctx.marketState.slice(1)}
          </h1>
          <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${regimeBadgeBg}`}>
            {isExpansion ? "Active" : "Neutral"}
          </span>
        </div>

        <p className="text-[13px] text-text-muted leading-relaxed">{regimeSubtext}</p>
        <p className="text-[12px] text-text-muted/60 mt-1 leading-relaxed">{ctx.stateReason}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.05] border border-white/[0.05] rounded-lg overflow-hidden">

        <StatCell
          label="Trend"
          value={trend.label}
          context={trend.sublabel}
          contextColor={trend.color}
        />

        <StatCell
          label="RSI 14"
          value={ctx.rsi14.toFixed(1)}
          context={rsi.label}
          contextColor={rsi.color}
        >
          <RsiBar rsi={ctx.rsi14} />
        </StatCell>

        <StatCell
          label="Volume"
          value={`${(ctx.volumeRatioPct / 100).toFixed(2)}x`}
          context={vol.label}
          contextColor={vol.color}
          sublabel="vs 20-candle avg"
        />

        <StatCell
          label="MACD Hist."
          value={`${ctx.macdHistogram > 0 ? "+" : ""}${ctx.macdHistogram.toFixed(2)}`}
          context={macd.label}
          contextColor={macd.color}
          sublabel="EMA 12 − 26"
        />
      </div>
    </div>
  );
}
