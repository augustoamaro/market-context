import { Decision, StepStatus } from "@/types/market";
import CardSkeleton from "./Skeleton";

interface Props {
  decision: Decision | null;
  loading: boolean;
}

const statusStyles: Record<StepStatus, { dot: string; line: string }> = {
  ok:   { dot: "bg-success border-success", line: "border-success/30" },
  warn: { dot: "bg-warn border-warn",       line: "border-warn/30" },
  bad:  { dot: "bg-danger border-danger",   line: "border-danger/30" },
};

const statusIcons: Record<StepStatus, string> = {
  ok:   "✓",
  warn: "⚠",
  bad:  "✕",
};

export default function DecisionLogicCard({ decision, loading }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-64" />;
  if (!decision) return null;

  return (
    <div className="rounded-2xl border border-[#1E2A40] bg-[#0F1B2D] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <p className="text-xs uppercase tracking-wider text-muted mb-4">Decision Logic</p>

      <div className="relative">
        {decision.steps.map((step, idx) => {
          const { dot, line } = statusStyles[step.status];
          const isLast = idx === decision.steps.length - 1;

          return (
            <div key={step.id} className="flex gap-3">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div className={`size-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-[#0B1220] shrink-0 ${dot}`}>
                  {statusIcons[step.status]}
                </div>
                {!isLast && <div className={`w-px flex-1 border-l-2 border-dashed my-1 ${line}`} />}
              </div>

              {/* Content */}
              <div className={`pb-4 ${isLast ? "" : ""}`}>
                <p className="text-sm font-semibold text-text leading-tight">{step.title}</p>
                <p className="text-xs text-muted">{step.description}</p>
                <p className="mt-1 text-xs text-muted/80 italic">{step.details}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
