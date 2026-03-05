import { MarketContext } from "@/types/market";
import { formatPriceShort } from "@/lib/format";
import CardSkeleton from "./Skeleton";

interface Props {
  ctx: MarketContext | null;
  loading: boolean;
  error: string | null;
}

function zoneLabel(pct: number): { label: string; color: string } {
  if (pct < 0) return { label: "BREAKDOWN", color: "text-danger" };
  if (pct > 100) return { label: "BREAKOUT", color: "text-success" };
  if (pct <= 30) return { label: "LOW ZONE", color: "text-danger" };
  if (pct <= 45) return { label: "LOW-MID", color: "text-warn" };
  if (pct <= 55) return { label: "MID RANGE", color: "text-warn" };
  if (pct <= 70) return { label: "HIGH-MID", color: "text-info" };
  return { label: "HIGH ZONE", color: "text-success" };
}

export default function RangePositionCard({ ctx, loading, error }: Props) {
  if (loading) return <CardSkeleton rows={3} height="h-40" />;
  if (error || !ctx) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
        {error ?? "No data available"}
      </div>
    );
  }

  const pct = Math.round(ctx.pricePositionPct);
  const clampedPct = Math.max(0, Math.min(100, pct));
  const { label, color } = zoneLabel(pct);

  return (
    <div className="rounded-2xl border border-[#1E2A40] bg-[#0F1B2D] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wider text-muted">Price Range Position</p>
        <span className={`text-xs font-semibold ${color}`}>{label}</span>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between text-[10px] text-muted mb-1 font-mono">
        <span>0%</span>
        <span className="text-warn">40% — 60%</span>
        <span>100%</span>
      </div>

      {/* Gradient bar */}
      <div className="relative h-3 w-full rounded-full overflow-hidden bg-[#1E2A40]">
        {/* Gradient track */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-danger via-warn to-success opacity-40" />
        {/* Mid-zone overlay */}
        <div className="absolute top-0 bottom-0 bg-warn/20" style={{ left: "40%", width: "20%" }} />
        {/* Position marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full border-2 border-[#0B1220] bg-text shadow-lg transition-all duration-500 z-10"
          style={{ left: `${clampedPct}%` }}
        />
      </div>

      {/* Position pct */}
      <div
        className="relative mt-1 text-xs font-mono font-semibold text-text transition-all duration-500"
        style={{ marginLeft: `clamp(0px, calc(${clampedPct}% - 12px), calc(100% - 30px))` }}
      >
        {pct}%
      </div>

      {/* Support / Resistance labels */}
      <div className="flex justify-between mt-3 text-xs">
        <div>
          <p className="text-muted uppercase tracking-wider text-[10px]">Support</p>
          <p className="font-mono font-semibold text-danger">{formatPriceShort(ctx.rangeLow)}</p>
        </div>
        <div className="text-right">
          <p className="text-muted uppercase tracking-wider text-[10px]">Resistance</p>
          <p className="font-mono font-semibold text-success">{formatPriceShort(ctx.rangeHigh)}</p>
        </div>
      </div>

      {/* Mid-range warning */}
      {pct >= 40 && pct <= 60 && (
        <div className="mt-3 rounded-lg border border-warn/20 bg-warn/10 px-3 py-2 text-xs text-warn">
          Price in mid-range — low-conviction zone, avoid directional entries.
        </div>
      )}
    </div>
  );
}
