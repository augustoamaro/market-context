import { Crosshair, ShieldAlert, Target, TrendingUp, ShieldQuestion } from "lucide-react";
import { GlobalDecision } from "@/types/market";
import { formatPriceShort } from "@/lib/format";
import CardSkeleton from "./Skeleton";

interface Props {
  globalDecision: GlobalDecision | null;
  loading: boolean;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-[17px] font-semibold tracking-tight text-text">{value}</p>
    </div>
  );
}

export default function ExecutionPlanCard({ globalDecision, loading }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-56" />;
  if (!globalDecision) return null;

  const plan = globalDecision.execution;
  if (!plan) {
    return (
      <div className="bento-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Execution
          </h2>
        </div>
        <div className="mt-8 mb-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-14 text-center">
          <ShieldQuestion className="mb-4 size-8 text-text-muted/30" />
          <p className="text-[13px] font-medium text-text-muted">
            Execution Pending
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-text-muted/50 max-w-[280px]">
            Execution stays secondary until the engine sees a clear directional bias.
          </p>
        </div>
      </div>
    );
  }

  const accent =
    globalDecision.bias === "BULLISH"
      ? "border-success/20 bg-success/10"
      : globalDecision.bias === "BEARISH"
        ? "border-danger/20 bg-danger/10"
        : "border-white/8 bg-white/[0.03]";

  const tone =
    globalDecision.signal === "READY"
      ? "text-text"
      : "text-text-muted";

  return (
    <div className="bento-card rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Execution
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
            Operational guidance only when the setup deserves attention.
          </p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${accent}`}>
          {plan.allowed ? "Execution enabled" : "Secondary plan"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className={`rounded-2xl border p-5 ${plan.emphasis === "primary" ? accent : "border-white/8 bg-black/20"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Entry Model</p>
              <p className={`mt-2 text-2xl font-semibold tracking-tight ${tone}`}>{plan.entryModel}</p>
            </div>
            <TrendingUp className="size-5 text-text-muted/70" />
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-text-muted">{plan.trigger}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Entry"
              value={plan.suggestedEntry !== null ? formatPriceShort(plan.suggestedEntry) : "Wait"}
            />
            <Metric
              label="Invalidation"
              value={plan.invalidation !== null ? formatPriceShort(plan.invalidation) : "Wait"}
            />
            <Metric
              label="Target 1"
              value={plan.target1 !== null ? formatPriceShort(plan.target1) : "Wait"}
            />
            <Metric
              label="Target 2"
              value={plan.target2 !== null ? formatPriceShort(plan.target2) : "Wait"}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Crosshair className="size-4 text-text-muted/70" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">R:R</p>
                <p className="mt-1 text-[18px] font-semibold tracking-tight text-text">
                  {plan.rr !== null ? `${plan.rr.toFixed(2)}R` : "Pending"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldAlert className="size-4 text-text-muted/70" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Suggested Risk</p>
                <p className="mt-1 text-[18px] font-semibold tracking-tight text-text">
                  {plan.suggestedRiskPct !== null ? `${plan.suggestedRiskPct}%` : "None"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Target className="size-4 text-text-muted/70" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">State</p>
                <p className="mt-1 text-[18px] font-semibold tracking-tight text-text">
                  {globalDecision.signal}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/8 pt-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Execution Notes</p>
            <ul className="mt-3 space-y-2">
              {plan.notes.map((note) => (
                <li key={note} className="text-[12px] leading-relaxed text-text-muted">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
