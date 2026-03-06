import type { ReactNode } from "react";
import { Activity, Compass, Layers3, Volume2 } from "lucide-react";
import { GlobalDecision, MarketContext, MultiTFRow, StepStatus } from "@/types/market";
import CardSkeleton from "./Skeleton";

interface Props {
  globalDecision: GlobalDecision | null;
  rows: MultiTFRow[];
  activeCtx: MarketContext | null;
  loading: boolean;
  error: string | null;
}

const toneStyles: Record<StepStatus, string> = {
  ok: "border-white/8 bg-white/[0.02] text-text hover:bg-white/[0.04] transition-colors",
  warn: "border-warn/15 bg-warn/5 text-warn hover:bg-warn/10 transition-colors",
  bad: "border-danger/15 bg-danger/5 text-danger hover:bg-danger/10 transition-colors",
};

const alignmentStyles = {
  bullish: "bg-success/10 text-success border-success/20 hover:bg-success/15",
  bearish: "bg-danger/10 text-danger border-danger/20 hover:bg-danger/15",
  sideways: "bg-white/5 text-text-muted border-white/10 hover:bg-white/10",
} as const;

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function ContextCell({
  title,
  value,
  detail,
  tone,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  tone: StepStatus;
  icon: ReactNode;
}) {
  return (
    <div className={`group rounded-2xl border p-5 ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{title}</p>
        <div className="opacity-50 transition-opacity group-hover:opacity-80">{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-[20px] font-semibold tracking-tight">{value}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed opacity-70">{detail}</p>
      </div>
    </div>
  );
}

export default function MarketContextCard({
  globalDecision,
  rows,
  activeCtx,
  loading,
  error,
}: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-64" />;
  if (error) {
    return <div className="bento-card rounded-2xl p-6 text-[13px] text-danger/80">{error}</div>;
  }
  if (!globalDecision) return null;

  const { context } = globalDecision;

  return (
    <div className="bento-card rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Market Context
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
            Context first: regime, range, multi-timeframe alignment, and participation.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-text-muted">
          Anchor {context.anchorTimeframe} · Active view {activeCtx?.timeframe ?? context.activeTimeframe}
        </span>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <ContextCell
          title="Regime"
          value={context.regime.label}
          detail={context.regime.detail}
          tone={context.regime.tone}
          icon={<Compass className="size-4" />}
        />
        <ContextCell
          title="Range Position"
          value={`${context.rangePosition.label} · ${context.rangePosition.valuePct}%`}
          detail={context.rangePosition.detail}
          tone={context.rangePosition.tone}
          icon={<Layers3 className="size-4" />}
        />
        <ContextCell
          title="MTF Consensus"
          value={`${context.mtfConsensus.label} · ${formatSigned(context.mtfConsensus.weightedScore)}`}
          detail={context.mtfConsensus.detail}
          tone={context.mtfConsensus.tone}
          icon={<Activity className="size-4" />}
        />
        <ContextCell
          title="Volume"
          value={`${context.volume.label} · ${context.volume.ratioPct}%`}
          detail={context.volume.detail}
          tone={context.volume.tone}
          icon={<Volume2 className="size-4" />}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Timeframe Matrix</p>
            <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
              Higher timeframes define bias; lower timeframes refine timing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rows.map((row) => (
              <span
                key={row.timeframe}
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${alignmentStyles[row.alignment]}`}
              >
                <span className="opacity-60">{row.timeframe}</span>
                <span className="font-mono uppercase">{row.alignment}</span>
              </span>
            ))}
          </div>
        </div>

        {activeCtx && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="group rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Active Trend</p>
              <p className="mt-2 text-[16px] font-semibold tracking-tight text-text group-hover:text-primary transition-colors">
                {activeCtx.trend === "up" ? "Uptrend" : activeCtx.trend === "down" ? "Downtrend" : "Sideways"}
              </p>
            </div>
            <div className="group rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">RSI</p>
              <p className="mt-2 font-mono text-[16px] text-text group-hover:text-primary transition-colors">{activeCtx.rsi14.toFixed(1)}</p>
            </div>
            <div className="group rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">MACD Histogram</p>
              <p className="mt-2 font-mono text-[16px] text-text group-hover:text-primary transition-colors">
                {activeCtx.macdHistogram > 0 ? "+" : ""}
                {activeCtx.macdHistogram.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
