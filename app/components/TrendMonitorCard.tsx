import { MultiTFRow, Alignment } from "@/types/market";
import { formatVolumeX } from "@/lib/format";
import CardSkeleton from "./Skeleton";

interface Props {
  rows: MultiTFRow[];
  loading: boolean;
  error: string | null;
  activeTimeframe: string;
}

const alignmentStyles: Record<Alignment, string> = {
  bullish: "bg-success/10 text-success border-success/20",
  bearish: "bg-danger/10 text-danger border-danger/20",
  sideways: "bg-warn/10 text-warn border-warn/20",
};

function formatEma(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

export default function TrendMonitorCard({ rows, loading, error, activeTimeframe }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-52" />;
  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">{error}</div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1E2A40] bg-[#0F1B2D] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <p className="text-xs uppercase tracking-wider text-muted mb-4">Trend Monitor — EMA Stack</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2A40]">
              {["TIMEFRAME", "20 EMA", "50 EMA", "200 EMA", "RSI (14)", "VOL RATIO", "ALIGNMENT"].map(
                (col, i) => (
                  <th
                    key={col}
                    className={`pb-2 text-[10px] uppercase tracking-wider text-muted font-medium ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isActive = row.timeframe === activeTimeframe;
              return (
                <tr
                  key={row.timeframe}
                  className={`border-b border-[#1E2A40]/50 transition-colors ${
                    isActive ? "bg-info/5" : idx % 2 === 0 ? "" : "bg-[#0C1626]/50"
                  }`}
                >
                  <td className="py-2.5 font-mono font-semibold text-text">
                    {row.timeframe}
                    {isActive && (
                      <span className="ml-2 text-[10px] text-info uppercase tracking-wider">active</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono text-muted">{formatEma(row.ema20)}</td>
                  <td className="py-2.5 text-right font-mono text-muted">{formatEma(row.ema50)}</td>
                  <td className="py-2.5 text-right font-mono text-muted">{formatEma(row.ema200)}</td>
                  <td className={`py-2.5 text-right font-mono font-medium ${
                    row.rsi14 > 70 ? "text-danger" : row.rsi14 < 30 ? "text-warn" : "text-text"
                  }`}>
                    {row.rsi14.toFixed(1)}
                  </td>
                  <td className={`py-2.5 text-right font-mono ${
                    row.volumeRatioX >= 1.3 ? "text-success" : "text-muted"
                  }`}>
                    {formatVolumeX(row.volumeRatioX * 100)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        alignmentStyles[row.alignment]
                      }`}
                    >
                      {row.alignment}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
