import { MarketContext } from "@/types/market";
import { formatPriceShort } from "@/lib/format";
import CardSkeleton from "./Skeleton";
import { Target } from "lucide-react";

interface Props {
  ctx: MarketContext | null;
  loading: boolean;
  error: string | null;
}

function zoneLabel(pct: number): { label: string; color: string } {
  if (pct < 0) return { label: "Breakdown", color: "text-danger" };
  if (pct > 100) return { label: "Breakout", color: "text-success" };
  if (pct <= 30) return { label: "Low Zone", color: "text-danger" };
  if (pct <= 45) return { label: "Low-Mid", color: "text-text-muted" };
  if (pct <= 55) return { label: "Mid Range", color: "text-text-muted" };
  if (pct <= 70) return { label: "High-Mid", color: "text-text" };
  return { label: "High Zone", color: "text-success" };
}

export default function RangePositionCard({ ctx, loading, error }: Props) {
  if (loading) return <CardSkeleton rows={3} height="h-40" />;
  if (error || !ctx) {
    return (
      <div className="bento-card rounded-xl p-6 text-[13px] text-danger/80">
        {error ?? "No data available"}
      </div>
    );
  }

  const pct = Math.round(ctx.pricePositionPct);
  const clampedPct = Math.max(0, Math.min(100, pct));
  const { label, color } = zoneLabel(pct);

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[160px]">

      <div className="flex items-center justify-between pl-1">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
          Range Strategy
        </h2>
        <span className={`text-[12px] font-medium ${color}`}>{label}</span>
      </div>

      <div className="mt-8 relative">
        {/* Support / Resistance Top Labels */}
        <div className="flex justify-between text-[11px] text-text-muted font-medium mb-4 px-1">
          <span>{formatPriceShort(ctx.rangeLow)}</span>
          <span className="text-text">{pct}%</span>
          <span>{formatPriceShort(ctx.rangeHigh)}</span>
        </div>

        {/* Emerald Track Style */}
        <div className="relative h-2 w-full rounded-full bg-white/5 mx-1 overflow-hidden">
          {/* Mid-zone marker (subtle) */}
          <div className="absolute h-full bg-primary/20" style={{ left: "40%", width: "20%" }} />

          {/* Glowing Position marker */}
          <div
            className="absolute h-full w-1 bg-primary shadow-[0_0_8px_var(--color-primary)] transition-all duration-700 ease-out"
            style={{ left: `${clampedPct}%` }}
          />
        </div>
      </div>

      {/* Warning State */}
      {pct >= 40 && pct <= 60 && (
        <div className="mt-6 flex items-start gap-3 text-[12px] text-text-muted leading-relaxed">
          <Target className="size-4 shrink-0 mt-0.5 opacity-60" />
          <p>Price is hovering near the equilibrium midline. Directional probability is reduced; favor mean-reversion or wait for boundary tests.</p>
        </div>
      )}
    </div>
  );
}
