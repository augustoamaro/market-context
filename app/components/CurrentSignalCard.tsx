import { Decision, ConvictionLabel } from "@/types/market";
import CardSkeleton from "./Skeleton";
import { Radio, ChevronRight } from "lucide-react";

interface Props {
  decision: Decision | null;
  loading: boolean;
}

const labelStyles: Record<ConvictionLabel, { color: string }> = {
  "HIGH CONVICTION": { color: "text-success" },
  "LOW CONVICTION": { color: "text-warn" },
  "NO TRADE": { color: "text-text-muted" },
};

const signalColor: Record<string, string> = {
  UP: "text-success",
  DOWN: "text-danger",
  WAIT: "text-text-muted",
};

export default function CurrentSignalCard({ decision, loading }: Props) {
  if (loading) return <CardSkeleton rows={3} height="h-48" />;
  if (!decision) return null;

  const { color: badgeColor } = labelStyles[decision.label];
  const sigColor = signalColor[decision.signal] ?? "text-text";

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 relative min-h-[260px] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-8 pl-1">
          <Radio className="size-4 text-text-muted animate-pulse" />
          <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Current Signal</h2>
        </div>

        {/* Primary signal */}
        <div className="flex items-end justify-between mb-8 pl-1">
          <p className={`text-6xl font-medium tracking-tighter leading-none ${sigColor}`}>
            {decision.signal}
          </p>

          <div className="flex flex-col items-end gap-1">
            <span className={`text-[11px] uppercase tracking-widest font-semibold ${badgeColor}`}>
              {decision.label}
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono">
              Score: {decision.confidenceScore}/100
            </span>
          </div>
        </div>

        {/* Minimal Progress Track */}
        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden mx-1">
          <div
            className="h-full bg-text transition-all duration-1000 ease-out"
            style={{ width: `${decision.confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Reasons */}
      {decision.reasons.length > 0 && (
        <ul className="mt-8 space-y-3 pl-1">
          {decision.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] text-text-muted leading-relaxed">
              <ChevronRight className="size-4 text-text-muted/50 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
