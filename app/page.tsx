"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import { GlobalDecision, MarketContext, MultiTFRow } from "@/types/market";
import { computeGlobalDecision, computeMultiTFConsensus } from "@/lib/decision";
import { contextToMultiTFRow } from "@/lib/topSetup";
import Header from "./components/Header";
import CurrentSignalCard from "./components/CurrentSignalCard";
import CandleChart from "./components/CandleChart";
import NavigationSidebar from "./components/NavigationSidebar";
import WatchlistSidebar from "./components/Sidebar";
import MarketContextCard from "./components/MarketContextCard";
import SetupReadinessCard from "./components/SetupReadinessCard";
import ExecutionPlanCard from "./components/ExecutionPlanCard";
import {
  getVisibleSectionIds,
  isSectionId,
  type ContentSectionId,
  type SectionId,
} from "./components/dashboardSections";

const ALL_TIMEFRAMES = ["15m", "1h", "4h", "1d", "1w"];
const REFRESH_INTERVAL = 60_000;

async function fetchContext(symbol: string, timeframe: string): Promise<MarketContext> {
  const res = await fetch(`/api/context?symbol=${symbol}&timeframe=${timeframe}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export default function DashboardPage() {
  const [section, setSection] = useState<SectionId>(() => {
    if (typeof window === "undefined") return "overview";
    const hash = window.location.hash.replace("#", "");
    return isSectionId(hash) ? hash : "overview";
  });
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("4h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allContexts, setAllContexts] = useState<MarketContext[]>([]);
  const [activeCtx, setActiveCtx] = useState<MarketContext | null>(null);
  const [allRows, setAllRows] = useState<MultiTFRow[]>([]);
  const [globalDecision, setGlobalDecision] = useState<GlobalDecision | null>(null);

  const mainRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // load depends only on symbol — timeframe switching is instant from cache
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settled = await Promise.allSettled(
        ALL_TIMEFRAMES.map((tf) => fetchContext(symbol, tf))
      );
      const contexts = settled
        .filter((r): r is PromiseFulfilledResult<MarketContext> => r.status === "fulfilled")
        .map((r) => r.value)
        .sort(
          (a, b) => ALL_TIMEFRAMES.indexOf(a.timeframe) - ALL_TIMEFRAMES.indexOf(b.timeframe)
        );

      if (contexts.length === 0) throw new Error("All timeframes failed to load");

      setAllContexts(contexts);
      const rows = contexts.map(contextToMultiTFRow);
      const nextConsensus = rows.length > 0 ? computeMultiTFConsensus(rows) : null;
      const executionCtx = contexts.find((ctx) => ctx.timeframe === "1h") ?? contexts[0];
      const anchorCtx = contexts.find((ctx) => ctx.timeframe === "4h") ?? executionCtx;

      setAllRows(rows);
      setGlobalDecision(
        executionCtx && anchorCtx && nextConsensus
          ? computeGlobalDecision(rows, executionCtx, anchorCtx, nextConsensus)
          : null
      );
    } catch (e) {
      setAllContexts([]);
      setAllRows([]);
      setActiveCtx(null);
      setGlobalDecision(null);
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Reload when symbol changes and set up auto-refresh
  useEffect(() => {
    load();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(load, REFRESH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);


  // Derive activeCtx from cache when timeframe changes — no network call
  useEffect(() => {
    if (allContexts.length === 0) return;
    const match = allContexts.find((c) => c.timeframe === timeframe);
    setActiveCtx(match ?? allContexts[0]);
  }, [timeframe, allContexts]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      setSection(isSectionId(hash) ? hash : "overview");
    };

    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { pathname, search } = window.location;
    const nextUrl =
      section === "overview"
        ? `${pathname}${search}`
        : `${pathname}${search}#${section}`;

    window.history.replaceState(null, "", nextUrl);
  }, [section]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [section]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const executionCtx = allContexts.find((ctx) => ctx.timeframe === "1h") ?? allContexts[0] ?? null;
  const visibleSectionIds = getVisibleSectionIds(section);

  function renderSection(sectionId: ContentSectionId) {
    if (sectionId === "current-state") {
      return (
        <CurrentSignalCard
          globalDecision={globalDecision}
          executionCtx={executionCtx}
          loading={loading}
          error={error}
        />
      );
    }

    if (sectionId === "market-context") {
      return (
        <MarketContextCard
          globalDecision={globalDecision}
          rows={allRows}
          activeCtx={activeCtx}
          loading={loading}
          error={error}
        />
      );
    }

    if (sectionId === "setup-readiness") {
      return (
        <SetupReadinessCard
          globalDecision={globalDecision}
          loading={loading}
          error={error}
        />
      );
    }

    if (sectionId === "execution") {
      return (
        <ExecutionPlanCard
          globalDecision={globalDecision}
          loading={loading}
          error={error}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                Chart
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
                The chart confirms the engine verdict instead of competing with it.
              </p>
            </div>

            {activeCtx && (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-text-muted">
                  View {timeframe}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-text-muted">
                  Price {activeCtx.price}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-text-muted">
                  Range {Math.round(activeCtx.pricePositionPct)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <CandleChart symbol={symbol} timeframe={timeframe} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg lg:h-screen lg:flex-row lg:overflow-hidden">
      <NavigationSidebar symbol={symbol} timeframe={timeframe} activeId={section} onNavigate={setSection} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          symbol={symbol}
          timeframe={timeframe}
          price={activeCtx?.price ?? 0}
          priceChangePct={activeCtx?.priceChangePct ?? 0}
          onTimeframeChange={setTimeframe}
        />

        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-[1280px]">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {visibleSectionIds.map((sectionId) => (
                <motion.div key={sectionId} variants={itemVariants}>
                  {renderSection(sectionId)}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>
      </div>

      <WatchlistSidebar currentSymbol={symbol} onSymbolChange={setSymbol} />
    </div>
  );
}
