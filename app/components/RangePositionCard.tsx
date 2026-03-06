import { MarketContext } from "@/types/market";
import { formatPriceShort } from "@/lib/format";
import CardSkeleton from "./Skeleton";
import SectionStatusCard from "./SectionStatusCard";

interface Props {
  ctx: MarketContext | null;
  loading: boolean;
  error: string | null;
}

interface Zone {
  label: string;
  textColor: string;
  badgeBg: string;
  description: string;
}

function getZone(pct: number): Zone {
  if (pct < 0)   return { label: "Breakdown",  textColor: "text-danger",     badgeBg: "bg-danger/10",  description: "Price broke below the range" };
  if (pct > 100) return { label: "Breakout",   textColor: "text-success",    badgeBg: "bg-success/10", description: "Price broke above the range" };
  if (pct <= 25) return { label: "Support",    textColor: "text-danger",     badgeBg: "bg-danger/10",  description: "Near range low — potential support" };
  if (pct <= 45) return { label: "Low-Mid",    textColor: "text-text-muted", badgeBg: "bg-white/5",    description: "Below midpoint — mild bearish lean" };
  if (pct <= 55) return { label: "Mid Range",  textColor: "text-warn",       badgeBg: "bg-warn/10",    description: "Inside equilibrium zone — low conviction" };
  if (pct <= 75) return { label: "High-Mid",   textColor: "text-text-muted", badgeBg: "bg-white/5",    description: "Above midpoint — mild bullish lean" };
  return              { label: "Resistance",   textColor: "text-success",    badgeBg: "bg-success/10", description: "Near range high — potential resistance" };
}

export default function RangePositionCard({ ctx, loading, error }: Props) {
  if (loading) return <CardSkeleton rows={3} height="h-40" />;
  if (error) {
    return (
      <SectionStatusCard
        title="Range Strategy"
        tone="error"
        message={`Unable to render range-position diagnostics because context loading failed. ${error}`}
      />
    );
  }
  if (!ctx) {
    return (
      <SectionStatusCard
        title="Range Strategy"
        tone="empty"
        message="Range-position diagnostics are not available yet for this timeframe."
      />
    );
  }

  const pct        = ctx.pricePositionPct;
  const clampedPct = Math.max(0, Math.min(100, pct));
  const zone       = getZone(pct);
  const distToHigh = ctx.rangeHigh - ctx.price;
  const distToLow  = ctx.price - ctx.rangeLow;

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pl-1">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">
          Range Strategy
        </h2>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${zone.textColor} ${zone.badgeBg}`}>
          {zone.label}
        </span>
      </div>

      {/* Hero row: big % + price */}
      <div className="flex items-end gap-4 mb-5 pl-1">
        <span className={`text-5xl font-semibold tracking-tight leading-none ${zone.textColor}`}>
          {Math.round(pct)}%
        </span>
        <div className="mb-1">
          <p className="text-[11px] text-text-muted mb-0.5">of 20-candle range</p>
          <p className="text-[14px] font-mono font-medium text-text">{formatPriceShort(ctx.price)}</p>
        </div>
      </div>

      {/* Bar */}
      <div className="px-1">
        <div className="relative h-5 w-full rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>

          {/* Support zone — left 25% */}
          <div className="absolute inset-y-0 left-0 rounded-l-lg" style={{ width: "25%", background: "rgba(239,68,68,0.15)" }} />

          {/* Resistance zone — right 25% */}
          <div className="absolute inset-y-0 right-0 rounded-r-lg" style={{ width: "25%", background: "rgba(16,185,129,0.15)" }} />

          {/* Mid zone */}
          <div className="absolute inset-y-0" style={{ left: "40%", width: "20%", background: "rgba(245,158,11,0.10)" }} />

          {/* Dividers */}
          <div className="absolute inset-y-0 w-px bg-white/8" style={{ left: "25%" }} />
          <div className="absolute inset-y-0 w-px bg-white/8" style={{ left: "50%" }} />
          <div className="absolute inset-y-0 w-px bg-white/8" style={{ left: "75%" }} />

          {/* Position marker */}
          <div
            className="absolute inset-y-0 w-[3px] bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.5)] transition-all duration-700 ease-out"
            style={{ left: `${clampedPct}%`, transform: "translateX(-50%)" }}
          />
        </div>

        {/* Zone labels */}
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-danger/50 font-medium">Support</span>
          <span className="text-[10px] text-text-muted/30">Mid</span>
          <span className="text-[10px] text-success/50 font-medium">Resistance</span>
        </div>
      </div>

      {/* Price anchors + distances */}
      <div className="flex justify-between px-1 mt-4 pt-4 border-t border-white/[0.05]">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Range Low</p>
          <p className="text-[12px] font-mono text-text-muted">{formatPriceShort(ctx.rangeLow)}</p>
          <p className="text-[11px] font-mono text-danger/70 mt-0.5">−{formatPriceShort(distToLow)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Range High</p>
          <p className="text-[12px] font-mono text-text-muted">{formatPriceShort(ctx.rangeHigh)}</p>
          <p className="text-[11px] font-mono text-success/70 mt-0.5">+{formatPriceShort(distToHigh)}</p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 px-1 text-[12px] text-text-muted/60 leading-relaxed">
        {zone.description}
      </p>

    </div>
  );
}
