import type { LucideProps } from "lucide-react";
import { Decision, StepStatus } from "@/types/market";
import CardSkeleton from "./Skeleton";
import { Check, AlertTriangle, X } from "lucide-react";

interface Props {
  decision: Decision | null;
  loading: boolean;
}

const statusStyles: Record<StepStatus, { color: string; chipBg: string; Icon: React.ComponentType<LucideProps> }> = {
  ok:   { color: "text-text",   chipBg: "bg-white/[0.04] text-text-muted/80",    Icon: Check },
  warn: { color: "text-warn",   chipBg: "bg-warn/[0.08] text-warn/80",           Icon: AlertTriangle },
  bad:  { color: "text-danger", chipBg: "bg-danger/[0.08] text-danger/80",       Icon: X },
};

export default function DecisionLogicCard({ decision, loading }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-64" />;
  if (!decision) return null;

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8">
      <div className="mb-5 pl-1">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Decision Logic</h2>
      </div>

      <div className="relative pl-3">
        {decision.steps.map((step, idx) => {
          const { color, chipBg, Icon } = statusStyles[step.status];
          const isLast = idx === decision.steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-5 pb-5 last:pb-0">
              {/* Timeline Track */}
              {!isLast && (
                <div className="absolute left-[7px] top-5 bottom-0 w-px bg-white/5" />
              )}

              {/* Timeline Marker */}
              <div className="relative mt-1 flex flex-col items-center shrink-0">
                <div className={`size-4 rounded-full flex items-center justify-center bg-[#111] border ${step.status === 'ok' ? 'border-white/10' : 'border-transparent'} ${color}`}>
                  <Icon className="size-2.5" strokeWidth={3} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <h3 className={`text-[13px] font-medium leading-none mb-1.5 ${color}`}>
                  {step.title}
                </h3>
                <p className="text-[11px] text-text-muted/60 mb-2 leading-relaxed">
                  {step.description}
                </p>
                <div className={`inline-block px-2 py-1 rounded text-[11px] font-mono ${chipBg}`}>
                  {step.details}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Breakdown */}
      <div className="mt-6 pt-5 border-t border-white/5">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted mb-4">Score Breakdown</h3>
        {(
          [
            { label: "Trend",    value: decision.scoreBreakdown.trend,    max: 30 },
            { label: "Regime",   value: decision.scoreBreakdown.regime,   max: 20 },
            { label: "Position", value: decision.scoreBreakdown.position, max: 20 },
            { label: "Momentum", value: decision.scoreBreakdown.momentum, max: 15 },
            { label: "Volume",   value: decision.scoreBreakdown.volume,   max: 15 },
          ] as const
        ).map(({ label, value, max }) => (
          <div key={label} className="flex items-center gap-3 mb-2.5">
            <span className="text-[11px] text-text-muted/60 w-16 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-text-muted/40 rounded-full transition-all duration-300"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-text-muted/60 w-10 text-right shrink-0">
              {value}/{max}
            </span>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
          <span className="text-[11px] text-text-muted/60">Total</span>
          <span className="text-[13px] font-mono text-text">{decision.confidenceScore}/100</span>
        </div>
      </div>
    </div>
  );
}
