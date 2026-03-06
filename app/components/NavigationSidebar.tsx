"use client";

import {
  LayoutDashboard,
  Layers3,
  LineChart,
  Radio,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

export const menuItems = [
  { id: "overview", label: "Overview", hint: "Resumo do contexto", Icon: LayoutDashboard },
  { id: "current-state", label: "Current State", hint: "Veredito e explicacao", Icon: Radio },
  { id: "market-context", label: "Market Context", hint: "Regime, range e consenso", Icon: Layers3 },
  { id: "setup-readiness", label: "Setup Readiness", hint: "Liquidez, sweep e estrutura", Icon: ScanSearch },
  { id: "execution", label: "Execution", hint: "Plano operacional", Icon: ShieldCheck },
  { id: "chart", label: "Chart", hint: "Execucao visual", Icon: LineChart },
] as const;

export type SectionId = (typeof menuItems)[number]["id"];

interface NavigationSidebarProps {
  symbol: string;
  timeframe: string;
  activeId: SectionId;
  onNavigate: (id: SectionId) => void;
}

export default function NavigationSidebar({
  symbol,
  timeframe,
  activeId,
  onNavigate,
}: NavigationSidebarProps) {

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
        <div className="rounded-xl border border-white/6 bg-bg/70 px-3.5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-[15px] font-bold text-primary">
              {symbol.replace("USDT", "").charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight text-text">{symbol.replace("USDT", "")}</p>
              <p className="text-[11px] text-text-muted">{symbol.replace("USDT", "")} / USDT · {timeframe}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Live · 60s refresh</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-3.5">
        {menuItems.map(({ id, label, hint, Icon }) => {
          const active = id === activeId;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
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
    </aside>
  );
}
