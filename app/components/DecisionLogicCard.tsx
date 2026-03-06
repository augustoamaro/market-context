import type { LucideProps } from "lucide-react";
import { GlobalDecision, StepStatus } from "@/types/market";
import CardSkeleton from "./Skeleton";
import { Check, AlertTriangle, X } from "lucide-react";
import SectionStatusCard from "./SectionStatusCard";

interface Props {
  globalDecision: GlobalDecision | null;
  loading: boolean;
}

const statusStyles: Record<StepStatus, { color: string; chipBg: string; Icon: React.ComponentType<LucideProps> }> = {
  ok:   { color: "text-text",   chipBg: "bg-white/[0.04] text-text-muted/80",    Icon: Check },
  warn: { color: "text-warn",   chipBg: "bg-warn/[0.08] text-warn/80",           Icon: AlertTriangle },
  bad:  { color: "text-danger", chipBg: "bg-danger/[0.08] text-danger/80",       Icon: X },
};

const conflictLabels = {
  none: "nenhum",
  low: "baixo",
  high: "alto",
} as const;

export default function DecisionLogicCard({ globalDecision, loading }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-64" />;
  if (!globalDecision) {
    return (
      <SectionStatusCard
        title="Decision Logic"
        tone="empty"
        message="Decision logic is not available yet for this market."
      />
    );
  }

  const sizePct = Math.round(globalDecision.positionSizeModifier * 100);
  const barTone =
    sizePct >= 100
      ? "bg-text"
      : sizePct >= 50
        ? "bg-warn"
        : sizePct > 0
          ? "bg-danger"
          : "bg-white/10";

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8">
      <div className="mb-5 pl-1">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Decision Logic</h2>
      </div>

      <div className="relative pl-3">
        {globalDecision.steps.map((step, idx) => {
          const { color, chipBg, Icon } = statusStyles[step.status];
          const isLast = idx === globalDecision.steps.length - 1;

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

      <div className="mt-6 pt-5 border-t border-white/5">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted mb-4">Sizing</h3>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.16em] text-text-muted">Tamanho sugerido</span>
            <span className="text-[13px] font-mono text-text">{sizePct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barTone}`}
              style={{ width: `${sizePct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-text-muted/70">
            <span>Conflito MTF</span>
            <span className="font-mono uppercase">{conflictLabels[globalDecision.consensus.conflictLevel]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
