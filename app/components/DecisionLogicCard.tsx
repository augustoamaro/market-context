import { Decision, StepStatus } from "@/types/market";
import CardSkeleton from "./Skeleton";
import { Check, AlertTriangle, X } from "lucide-react";

interface Props {
  decision: Decision | null;
  loading: boolean;
}

const statusStyles: Record<StepStatus, { color: string; Icon: any }> = {
  ok: { color: "text-text", Icon: Check },
  warn: { color: "text-warn", Icon: AlertTriangle },
  bad: { color: "text-danger", Icon: X },
};

export default function DecisionLogicCard({ decision, loading }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-64" />;
  if (!decision) return null;

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 relative min-h-[300px]">
      <div className="mb-8 pl-1">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Decision Logic</h2>
      </div>

      <div className="relative pl-3">
        {decision.steps.map((step, idx) => {
          const { color, Icon } = statusStyles[step.status];
          const isLast = idx === decision.steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-6 pb-8 last:pb-0">
              {/* Timeline Track */}
              {!isLast && (
                <div className="absolute left-[7px] top-6 bottom-[-8px] w-px bg-white/5" />
              )}

              {/* Timeline Marker */}
              <div className="relative mt-1.5 flex flex-col items-center shrink-0">
                <div className={`size-4 rounded-full flex items-center justify-center bg-[#111] border ${step.status === 'ok' ? 'border-white/10' : 'border-transparent'} ${color}`}>
                  <Icon className="size-2.5" strokeWidth={3} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <h3 className={`text-[13px] font-medium leading-none mb-2 ${color === 'text-text' ? 'text-text' : color}`}>
                  {step.title}
                </h3>
                <p className="text-[12px] text-text-muted mb-2 leading-relaxed">
                  {step.description}
                </p>
                <div className="inline-block px-2 py-1 bg-white/[0.03] rounded text-[11px] text-text-muted/80 font-mono">
                  {step.details}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
