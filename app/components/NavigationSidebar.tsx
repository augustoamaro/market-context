"use client";

import { useState } from "react";
import {
  Activity,
  Compass,
  Crosshair,
  GitBranch,
  LayoutDashboard,
  LineChart,
  Radio,
} from "lucide-react";

const menuItems = [
  { id: "overview", label: "Overview", hint: "Resumo do contexto", Icon: LayoutDashboard },
  { id: "current-signal", label: "Current Signal", hint: "Bias e prontidao", Icon: Radio },
  { id: "decision-logic", label: "Decision Logic", hint: "Checklist do motor", Icon: GitBranch },
  { id: "trend-monitor", label: "Trend Monitor", hint: "Consenso multi-TF", Icon: Activity },
  { id: "regime", label: "Regime", hint: "Estado do mercado", Icon: Compass },
  { id: "range", label: "Range", hint: "Posicao no range", Icon: Crosshair },
  { id: "chart", label: "Chart", hint: "Execucao visual", Icon: LineChart },
] as const;

interface NavigationSidebarProps {
  symbol: string;
  timeframe: string;
}

export default function NavigationSidebar({
  symbol,
  timeframe,
}: NavigationSidebarProps) {
  const [activeId, setActiveId] = useState<(typeof menuItems)[number]["id"]>("overview");

  function scrollToSection(id: (typeof menuItems)[number]["id"]) {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <aside
      className="w-full border-b bg-surface/55 backdrop-blur-md lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:flex-shrink-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div
        className="flex items-center justify-between border-b px-4 h-[57px]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold tracking-tight text-white shadow-sm shadow-primary/20">
            HS
          </div>
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-text">HardStop</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Navigation</p>
          </div>
        </div>
      </div>

      <div className="border-b px-4 py-4" style={{ borderColor: "var(--color-border)" }}>
        <div className="rounded-xl border border-white/6 bg-bg/70 px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Workspace</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[18px] font-semibold tracking-tight text-text">{symbol.replace("USDT", "")}</p>
              <p className="text-[11px] text-text-muted">Execution view em {timeframe}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-text-muted">
              60s refresh
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-3.5">
        {menuItems.map(({ id, label, hint, Icon }) => {
          const active = id === activeId;

          return (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`group flex min-w-[168px] items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors lg:min-w-0 ${active
                  ? "border-primary/30 bg-primary/10"
                  : "border-white/6 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]"
                }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${active
                    ? "bg-primary text-white"
                    : "bg-white/[0.04] text-text-muted group-hover:text-text"
                  }`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className={`text-[12px] font-semibold ${active ? "text-text" : "text-text-muted"}`}>
                  {label}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-text-muted/70">
                  {hint}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden px-4 pb-4 pt-2 lg:block">
        <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Notes</p>
          <p className="mt-2 text-[11px] leading-relaxed text-text-muted/75">
            A watchlist agora fica do lado direito. Esta coluna da esquerda serve como
            navegação rápida entre as seções do dashboard.
          </p>
        </div>
      </div>
    </aside>
  );
}
