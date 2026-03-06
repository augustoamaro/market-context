import type { ReactNode } from "react";
import { CheckCircle2, GitBranch, Radar, ScanSearch, Sparkles, Waves } from "lucide-react";
import { GlobalDecision, StepStatus } from "@/types/market";
import CardSkeleton from "./Skeleton";

interface Props {
  globalDecision: GlobalDecision | null;
  loading: boolean;
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

export default function SetupReadinessCard({ globalDecision, loading }: Props) {
  if (loading) return <CardSkeleton rows={4} height="h-64" />;
  if (!globalDecision) return null;

  const { setup, readinessBreakdown, readinessScore } = globalDecision;

  return (
    <div className="bento-card rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Setup Readiness
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
            Pre-execution intelligence: liquidity, sweep, structure, confirmation, and archetype.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80">Readiness Score</p>
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

      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3">
        <SetupBlock
          title="Liquidity"
          value={setup.liquidity.label}
          detail={setup.liquidity.detail}
          tone={setup.liquidity.tone}
          icon={<Radar className="size-4" />}
        />
        <SetupBlock
          title="Sweep"
          value={setup.sweep.label}
          detail={setup.sweep.detail}
          tone={setup.sweep.tone}
          icon={<Waves className="size-4" />}
        />
        <SetupBlock
          title="Structure"
          value={setup.structure.label}
          detail={setup.structure.detail}
          tone={setup.structure.tone}
          icon={<GitBranch className="size-4" />}
        />
        <SetupBlock
          title="Confirmation"
          value={setup.confirmation.label}
          detail={setup.confirmation.detail}
          tone={setup.confirmation.tone}
          icon={<CheckCircle2 className="size-4" />}
        />
        <SetupBlock
          title="Archetype"
          value={setup.archetype.label}
          detail={setup.archetype.detail}
          tone={setup.archetype.tone}
          icon={<Sparkles className="size-4" />}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-5">
        <div className="flex items-center gap-2">
          <ScanSearch className="size-4 text-text-muted" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Readiness Breakdown</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Bias alignment", readinessBreakdown.biasAlignment, 25],
            ["Range position", readinessBreakdown.rangePosition, 20],
            ["Volume", readinessBreakdown.volume, 15],
            ["Liquidity", readinessBreakdown.liquidity, 10],
            ["Sweep", readinessBreakdown.sweep, 10],
            ["Structure", readinessBreakdown.structure, 10],
            ["Trigger", readinessBreakdown.executionTrigger, 10],
          ].map(([label, score, max]) => {
            const width = `${Math.max((Number(score) / Number(max)) * 100, 4)}%`;

            return (
              <div key={String(label)} className="group rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 hover:bg-white/[0.04] hover:border-white/12 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-text-muted group-hover:text-text-muted/90 transition-colors">{label}</span>
                  <span className="font-mono text-[12px] text-text/90 group-hover:text-text transition-colors">
                    {score}/{max}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all duration-500 group-hover:bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
