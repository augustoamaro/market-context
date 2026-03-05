import { MultiTFRow, Alignment } from "@/types/market";
import { formatVolumeX } from "@/lib/format";
import CardSkeleton from "./Skeleton";

interface Props {
  rows: MultiTFRow[];
  loading: boolean;
  error: string | null;
  activeTimeframe: string;
}

const alignmentStyles: Record<Alignment, { dot: string; text: string }> = {
  bullish: { dot: "bg-success", text: "text-text" },
  bearish: { dot: "bg-danger", text: "text-text" },
  sideways: { dot: "bg-warn", text: "text-text-muted" },
};

function formatEma(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

export default function TrendMonitorCard({ rows, loading, error, activeTimeframe }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-52" />;
  if (error) {
    return (
      <div className="bento-card rounded-xl p-6 text-[13px] text-danger/80">
        {error}
      </div>
    );
  }

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[280px]">
      <div className="mb-6 pl-1">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Trend Monitor</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {["Timeframe", "20 Ema", "50 Ema", "200 Ema", "Rsi (14)", "Vol Ratio", "Alignment"].map(
                (col, i) => (
                  <th
                    key={col}
                    className={`pb-4 text-[11px] font-medium text-text-muted border-b border-white/5 ${i === 1 || i === 2 || i === 3 ? "hidden sm:table-cell text-right pr-6" :
                        i === 4 || i === 5 ? "text-right pr-6" :
                          i === 6 ? "text-right pr-2" : "pl-2"
                      }`}
                  >
                    {col}
                  </th>
                )
              )}
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
                  <td className="py-4 pr-6 text-right font-mono text-[13px] text-text-muted hidden sm:table-cell">{formatEma(row.ema20)}</td>
                  <td className="py-4 pr-6 text-right font-mono text-[13px] text-text-muted hidden sm:table-cell">{formatEma(row.ema50)}</td>
                  <td className="py-4 pr-6 text-right font-mono text-[13px] text-text-muted hidden sm:table-cell">{formatEma(row.ema200)}</td>
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
    </div>
  );
}
