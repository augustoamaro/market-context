import type { ReactNode } from "react";
import { CheckCircle2, Crosshair, GitBranch, Radar, ScanSearch, Sparkles, Waves } from "lucide-react";
import { GlobalDecision, SetupStage, StepStatus } from "@/types/market";
import CardSkeleton from "./Skeleton";
import SectionStatusCard from "./SectionStatusCard";

interface Props {
  globalDecision: GlobalDecision | null;
  loading: boolean;
  error?: string | null;
}

const toneStyles: Record<StepStatus, string> = {
  ok: "border-success/20 bg-success/10 hover:bg-success/15 transition-colors",
  warn: "border-warn/20 bg-warn/10 hover:bg-warn/15 transition-colors",
  bad: "border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors",
};

const textStyles: Record<StepStatus, string> = {
  ok: "text-success",
  warn: "text-warn",
  bad: "text-text",
};

const stageLabel: Record<SetupStage, string> = {
  NO_SETUP: "No setup",
  CONTEXT_FORMING: "Context forming",
  SETUP_DEVELOPING: "Setup developing",
  EXECUTION_READY: "Execution-ready",
};

const stageStyles: Record<SetupStage, string> = {
  NO_SETUP: "border-white/10 bg-white/5 text-text-muted",
  CONTEXT_FORMING: "border-primary/20 bg-primary/10 text-primary/80",
  SETUP_DEVELOPING: "border-warn/20 bg-warn/10 text-warn",
  EXECUTION_READY: "border-success/20 bg-success/10 text-success",
};

const breakdownStatus: Record<StepStatus, string> = {
  ok: "Ready",
  warn: "Building",
  bad: "Blocked",
};

function SetupBlock({
  title,
  value,
  detail,
  tone,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  tone: StepStatus;
  icon: ReactNode;
}) {
  return (
    <div className={`group rounded-2xl border p-5 ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{title}</p>
        <div className="opacity-50 transition-opacity group-hover:opacity-80">{icon}</div>
      </div>
      <div className="mt-4">
        <p className={`text-[17px] font-semibold tracking-tight ${textStyles[tone]}`}>{value}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed opacity-70">{detail}</p>
      </div>
    </div>
  );
}

function scoreLabel(score: number): string {
  if (score <= 25) return "No setup";
  if (score <= 50) return "Context forming";
  if (score <= 75) return "Setup developing";
  return "Execution-ready";
}

function toneScore(tone: StepStatus): number {
  if (tone === "ok") return 10;
  if (tone === "warn") return 5;
  return 0;
}

function getExecutionTriggerBlock(decision: GlobalDecision) {
  if (decision.signal === "READY") {
    return {
      label: "Trigger armed",
      detail: decision.execution.trigger,
      tone: "ok" as const,
      score: 10,
    };
  }

  if (decision.signal === "LOOK_FOR_LONGS" || decision.signal === "LOOK_FOR_SHORTS" || decision.signal === "WAIT") {
    return {
      label: "Trigger pending",
      detail: decision.execution.requiredTrigger,
      tone: "warn" as const,
      score: 5,
    };
  }

  return {
    label: "Execution blocked",
    detail: decision.execution.trigger,
    tone: "bad" as const,
    score: 0,
  };
}

export default function SetupReadinessCard({ globalDecision, loading, error }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-64" />;
  if (error) {
    return (
      <SectionStatusCard
        title="Setup Readiness"
        tone="error"
        message={`Unable to build setup-readiness diagnostics because market context failed to load. ${error}`}
      />
    );
  }
  if (!globalDecision) {
    return (
      <SectionStatusCard
        title="Setup Readiness"
        tone="empty"
        message="Readiness diagnostics are not available yet for this market."
      />
    );
  }

  const { readinessBreakdown, readinessScore, readinessStage, setup } = globalDecision;
  const executionTrigger = getExecutionTriggerBlock(globalDecision);
  const componentBreakdown = [
    {
      title: "Liquidity",
      value: setup.liquidity.label,
      detail: setup.liquidity.detail,
      tone: setup.liquidity.tone,
      icon: <Radar className="size-4" />,
      score: readinessBreakdown.liquidity,
      max: 10,
    },
    {
      title: "Sweep",
      value: setup.sweep.label,
      detail: setup.sweep.detail,
      tone: setup.sweep.tone,
      icon: <Waves className="size-4" />,
      score: readinessBreakdown.sweep,
      max: 10,
    },
    {
      title: "Structure",
      value: setup.structure.label,
      detail: setup.structure.detail,
      tone: setup.structure.tone,
      icon: <GitBranch className="size-4" />,
      score: readinessBreakdown.structure,
      max: 10,
    },
    {
      title: "Confirmation",
      value: setup.confirmation.label,
      detail: setup.confirmation.detail,
      tone: setup.confirmation.tone,
      icon: <CheckCircle2 className="size-4" />,
      score: readinessBreakdown.executionTrigger,
      max: 10,
    },
    {
      title: "Archetype",
      value: setup.archetype.label,
      detail: setup.archetype.detail,
      tone: setup.archetype.tone,
      icon: <Sparkles className="size-4" />,
      score: toneScore(setup.archetype.tone),
      max: 10,
    },
    {
      title: "Execution Trigger",
      value: executionTrigger.label,
      detail: executionTrigger.detail,
      tone: executionTrigger.tone,
      icon: <Crosshair className="size-4" />,
      score: executionTrigger.score,
      max: 10,
    },
  ];

  return (
    <div className="bento-card rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Setup Readiness
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
            Pre-execution intelligence across liquidity, sweep, structure, confirmation, archetype, and trigger quality.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80">Readiness Score</p>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${stageStyles[readinessStage]}`}
              >
                {stageLabel[readinessStage]}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-3xl font-semibold tracking-tight text-text">
                {readinessScore}
              </p>
              <span className="text-sm text-primary/50">/100</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-primary/70">{scoreLabel(readinessScore)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {componentBreakdown.map((component) => (
          <SetupBlock
            key={component.title}
            title={component.title}
            value={component.value}
            detail={component.detail}
            tone={component.tone}
            icon={component.icon}
          />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-5">
        <div className="flex items-center gap-2">
          <ScanSearch className="size-4 text-text-muted" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Readiness Breakdown</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {componentBreakdown.map((component) => {
            const width = `${Math.max((component.score / component.max) * 100, 4)}%`;

            return (
              <div
                key={component.title}
                className="group rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 transition-all hover:border-white/12 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-text-muted transition-colors group-hover:text-text-muted/90">
                      {component.title}
                    </span>
                    <p className={`mt-1 text-[12px] font-medium ${textStyles[component.tone]}`}>
                      {breakdownStatus[component.tone]}
                    </p>
                  </div>
                  <span className="font-mono text-[12px] text-text/90 transition-colors group-hover:text-text">
                    {component.score}/{component.max}
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-text-muted">
                  {component.value}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-primary/80 shadow-[0_0_8px_rgba(var(--primary),0.3)] transition-all duration-500 group-hover:bg-primary"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-text-muted">
          This breakdown isolates the six execution blocks. The engine score above still layers bias alignment,
          range position, and volume context into the final readiness calculation.
        </p>
      </div>
    </div>
  );
}
