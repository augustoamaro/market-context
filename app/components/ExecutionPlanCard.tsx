import { Compass, Crosshair, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { GlobalDecision } from "@/types/market";
import { formatPriceShort } from "@/lib/format";
import CardSkeleton from "./Skeleton";
import SectionStatusCard from "./SectionStatusCard";

interface Props {
  globalDecision: GlobalDecision | null;
  loading: boolean;
  error?: string | null;
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

function GuidanceBlock({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-[16px] font-semibold tracking-tight text-text">{value}</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-text-muted">{detail}</p>
    </div>
  );
}

export default function ExecutionPlanCard({ globalDecision, loading, error }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-56" />;
  if (error) {
    return (
      <SectionStatusCard
        title="Execution"
        tone="error"
        message={`Unable to build the execution plan because market context failed to load. ${error}`}
      />
    );
  }
  if (!globalDecision) {
    return (
      <SectionStatusCard
        title="Execution"
        tone="empty"
        message="Execution guidance is not available yet because the engine has not produced a valid decision."
      />
    );
  }

  const plan = globalDecision.execution;
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
          {plan.allowed ? "Allowed: Yes" : "Allowed: No"}
        </span>
      </div>

      <div className="mt-6 grid gap-3 xl:grid-cols-3">
        <GuidanceBlock
          label="Preferred Direction"
          value={plan.preferredDirection}
          detail="Directional preference from the engine, even if execution is blocked."
        />
        <GuidanceBlock
          label="Required Trigger"
          value={plan.allowed ? "Present or near" : "Still missing"}
          detail={plan.requiredTrigger}
        />
        <GuidanceBlock
          label="Execution State"
          value={plan.allowed ? "Execution enabled" : "Stand by"}
          detail={plan.trigger}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
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
              <Compass className="size-4 text-text-muted/70" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Preferred Direction</p>
                <p className="mt-1 text-[18px] font-semibold tracking-tight text-text">
                  {plan.preferredDirection}
                </p>
              </div>
            </div>

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
