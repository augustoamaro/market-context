import { Alignment, MultiTFConsensus, MultiTFRow } from "@/types/market";
import { formatVolumeX } from "@/lib/format";
import CardSkeleton from "./Skeleton";
import SectionStatusCard from "./SectionStatusCard";

interface Props {
  rows: MultiTFRow[];
  consensus: MultiTFConsensus | null;
  loading: boolean;
  error: string | null;
  activeTimeframe: string;
}

const alignmentStyles: Record<Alignment, { dot: string; text: string }> = {
  bullish: { dot: "bg-success", text: "text-text" },
  bearish: { dot: "bg-danger", text: "text-text" },
  sideways: { dot: "bg-warn", text: "text-text-muted" },
};

const consensusStyles = {
  none: {
    shell: "border-white/8 bg-white/[0.03]",
    text: "text-text-muted",
    bar: "bg-success",
  },
  low: {
    shell: "border-warn/20 bg-warn/10",
    text: "text-warn",
    bar: "bg-warn",
  },
  high: {
    shell: "border-danger/20 bg-danger/10",
    text: "text-danger",
    bar: "bg-danger",
  },
} as const;

const actionStyles = {
  LONG_BIAS: "bg-success/10 text-success border-success/20",
  SHORT_BIAS: "bg-danger/10 text-danger border-danger/20",
  WAIT: "bg-white/5 text-text-muted border-white/10",
} as const;

const actionLabels = {
  LONG_BIAS: "Bom para longs",
  SHORT_BIAS: "Bom para shorts",
  WAIT: "Aguardar",
} as const;

function formatEma(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

export default function TrendMonitorCard({
  rows,
  consensus,
  loading,
  error,
  activeTimeframe,
}: Props) {
  if (loading) return <CardSkeleton rows={5} height="h-64" />;
  if (error) {
    return (
      <SectionStatusCard
        title="Trend Monitor"
        tone="error"
        message={`Unable to render multi-timeframe trend diagnostics because context loading failed. ${error}`}
      />
    );
  }
  if (rows.length === 0) {
    return (
      <SectionStatusCard
        title="Trend Monitor"
        tone="empty"
        message="Trend-monitor diagnostics are not available yet for this symbol."
      />
    );
  }

  const score = consensus?.weightedScore ?? 0;
  const magnitude = Math.min(Math.abs(score) / 2, 50);
  const barLeft = score >= 0 ? 50 : 50 - magnitude;
  const signedScore = score > 0 ? `+${score}` : `${score}`;
  const consensusStyle = consensus ? consensusStyles[consensus.conflictLevel] : consensusStyles.low;
  const actionClass = consensus ? actionStyles[consensus.recommendedAction] : actionStyles.WAIT;
  const actionLabel = consensus ? actionLabels[consensus.recommendedAction] : actionLabels.WAIT;

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[340px]">
      <div className="mb-6 pl-1">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Trend Monitor</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-4 pl-2 text-[11px] font-medium text-text-muted border-b border-white/5">
                Timeframe
              </th>
              <th className="hidden sm:table-cell pb-4 pr-6 text-right text-[11px] font-medium text-text-muted border-b border-white/5">
                12 Ema
              </th>
              <th className="hidden sm:table-cell pb-4 pr-6 text-right text-[11px] font-medium text-text-muted border-b border-white/5">
                20 Ema
              </th>
              <th className="hidden sm:table-cell pb-4 pr-6 text-right text-[11px] font-medium text-text-muted border-b border-white/5">
                50 Ema
              </th>
              <th className="hidden sm:table-cell pb-4 pr-6 text-right text-[11px] font-medium text-text-muted border-b border-white/5">
                200 Ema
              </th>
              <th className="pb-4 pr-6 text-right text-[11px] font-medium text-text-muted border-b border-white/5">
                Rsi (14)
              </th>
              <th className="pb-4 pr-6 text-right text-[11px] font-medium text-text-muted border-b border-white/5">
                Vol Ratio
              </th>
              <th className="pb-4 pr-2 text-right text-[11px] font-medium text-text-muted border-b border-white/5">
                Alignment
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isActive = row.timeframe === activeTimeframe;
              const { dot, text } = alignmentStyles[row.alignment];

              return (
                <tr
                  key={row.timeframe}
                  className={`group/row cursor-default transition-colors duration-200 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] ${isActive ? "bg-white/[0.02]" : ""
                    }`}
                >
                  <td className="py-4 pl-2 font-mono text-[13px] text-text relative">
                    <span className="flex items-center gap-2">
                      {isActive && <span className="absolute left-0 w-[2px] h-4 bg-text rounded-r" />}
                      <span className={isActive ? "font-medium" : "text-text-muted group-hover/row:text-text transition-colors"}>
                        {row.timeframe}
                      </span>
                    </span>
                  </td>
                  <td className="py-4 pr-6 text-right font-mono text-[13px] text-text-muted hidden sm:table-cell">
                    {formatEma(row.ema12)}
                  </td>
                  <td className="py-4 pr-6 text-right font-mono text-[13px] text-text-muted hidden sm:table-cell">
                    {formatEma(row.ema20)}
                  </td>
                  <td className="py-4 pr-6 text-right font-mono text-[13px] text-text-muted hidden sm:table-cell">
                    {formatEma(row.ema50)}
                  </td>
                  <td className="py-4 pr-6 text-right font-mono text-[13px] text-text-muted hidden sm:table-cell">
                    {formatEma(row.ema200)}
                  </td>
                  <td className={`py-4 pr-6 text-right font-mono text-[13px] ${row.rsi14 > 70 ? "text-danger" : row.rsi14 < 30 ? "text-success" : "text-text-muted"
                    }`}>
                    {row.rsi14.toFixed(1)}
                  </td>
                  <td className={`py-4 pr-6 text-right font-mono text-[13px] ${row.volumeRatioX >= 1.3 ? "text-success" : "text-text-muted"
                    }`}>
                    {formatVolumeX(row.volumeRatioX * 100)}
                  </td>
                  <td className="py-4 pr-2 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <span className={`text-[12px] capitalize font-medium ${text}`}>
                        {row.alignment}
                      </span>
                      <span className={`size-1.5 rounded-full ${dot}`} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {consensus && (
        <div className={`mt-6 rounded-xl border px-4 py-4 ${consensusStyle.shell}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
              MTF Consensus
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${actionClass}`}>
                {actionLabel}
              </span>
              <span className={`font-mono text-[12px] ${consensusStyle.text}`}>
                {signedScore}
              </span>
            </div>
          </div>

          <p className={`mt-2 text-[12px] leading-relaxed ${consensusStyle.text}`}>
            {consensus.summary}
          </p>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-text-muted">
              <span>Bearish</span>
              <span>{consensus.direction}</span>
              <span>Bullish</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
              <div
                className={`absolute inset-y-0 rounded-full ${consensusStyle.bar} ${consensus.conflictLevel === "high" ? "animate-pulse" : ""}`}
                style={{ left: `${barLeft}%`, width: `${magnitude}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
