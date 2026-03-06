import {
  LayoutDashboard,
  Layers3,
  LineChart,
  Radio,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

export const dashboardSections = [
  { id: "overview", label: "Overview", hint: "Resumo do contexto", Icon: LayoutDashboard },
  { id: "current-state", label: "Current State", hint: "Veredito e explicacao", Icon: Radio },
  { id: "market-context", label: "Market Context", hint: "Regime, range e consenso", Icon: Layers3 },
  { id: "setup-readiness", label: "Setup Readiness", hint: "Liquidez, sweep e estrutura", Icon: ScanSearch },
  { id: "execution", label: "Execution", hint: "Plano operacional", Icon: ShieldCheck },
  { id: "chart", label: "Chart", hint: "Execucao visual", Icon: LineChart },
] as const;

export type SectionId = (typeof dashboardSections)[number]["id"];
export type ContentSectionId = Exclude<SectionId, "overview">;

export const contentSectionIds = dashboardSections
  .filter((section): section is (typeof dashboardSections)[number] & { id: ContentSectionId } => section.id !== "overview")
  .map((section) => section.id);

export function isSectionId(value: string): value is SectionId {
  return dashboardSections.some((section) => section.id === value);
}

export function getVisibleSectionIds(activeId: SectionId): ContentSectionId[] {
  return activeId === "overview" ? [...contentSectionIds] : [activeId];
}
