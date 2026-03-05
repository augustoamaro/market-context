import { Decision, ConvictionLabel } from "@/types/market";
import CardSkeleton from "./Skeleton";

interface Props {
  decision: Decision | null;
  loading: boolean;
}

const labelStyles: Record<ConvictionLabel, { badge: string; glow: string }> = {
  "HIGH CONVICTION": {
    badge: "bg-success/15 text-success border-success/30",
    glow:  "shadow-[0_0_24px_rgba(34,197,94,0.15)]",
  },
  "LOW CONVICTION": {
    badge: "bg-warn/15 text-warn border-warn/30",
    glow:  "shadow-[0_0_24px_rgba(245,158,11,0.1)]",
  },
  "NO TRADE": {
    badge: "bg-danger/15 text-danger border-danger/30",
    glow:  "shadow-[0_0_24px_rgba(239,68,68,0.1)]",
  },
};

const signalColor: Record<string, string> = {
  UP:   "text-success",
  DOWN: "text-danger",
  WAIT: "text-warn",
};

export default function CurrentSignalCard({ decision, loading }: Props) {
  if (loading) return <CardSkeleton rows={3} height="h-48" />;
  if (!decision) return null;

  const { badge, glow } = labelStyles[decision.label];
  const sigColor = signalColor[decision.signal] ?? "text-text";

  return (
    <div className={`rounded-2xl border border-[#1E2A40] bg-[#0F1B2D] p-5 ${glow}`}>
      <p className="text-xs uppercase tracking-wider text-muted mb-3">Current Signal</p>

      {/* Primary signal */}
      <p className={`text-2xl font-semibold tracking-tight ${sigColor}`}>
        {decision.signal}
      </p>

      {/* Conviction badge */}
      <div className="mt-2 flex items-center gap-2">
        <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${badge}`}>
          {decision.label}
        </span>
      </div>

      {/* Confidence score */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Confidence</span>
          <span className="font-mono font-semibold text-text">{decision.confidenceScore}/100</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#1E2A40] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${decision.confidenceScore}%`,
              background:
                decision.confidenceScore >= 70
                  ? "#22C55E"
                  : decision.confidenceScore >= 40
                  ? "#F59E0B"
                  : "#EF4444",
            }}
          />
        </div>
      </div>

      {/* Reasons */}
      {decision.reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {decision.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted">
              <span className="mt-0.5 text-info">›</span>
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
