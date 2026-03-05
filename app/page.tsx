"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MarketContext, MultiTFRow } from "@/types/market";
import { computeDecision, deriveAlignment } from "@/lib/decision";
import Header from "./components/Header";
import RegimeHeroCard from "./components/RegimeHeroCard";
import RangePositionCard from "./components/RangePositionCard";
import TrendMonitorCard from "./components/TrendMonitorCard";
import DecisionLogicCard from "./components/DecisionLogicCard";
import CurrentSignalCard from "./components/CurrentSignalCard";
import ActionsCard from "./components/ActionsCard";

const ALL_TIMEFRAMES = ["15m", "1h", "4h", "1d"];
const REFRESH_INTERVAL = 60_000;

async function fetchContext(symbol: string, timeframe: string): Promise<MarketContext> {
  const res = await fetch(`/api/context?symbol=${symbol}&timeframe=${timeframe}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function contextToMultiTFRow(ctx: MarketContext): MultiTFRow {
  return {
    timeframe: ctx.timeframe,
    ema20: ctx.ema20,
    ema50: ctx.ema50,
    ema200: ctx.ema200,
    rsi14: ctx.rsi14,
    volumeRatioX: ctx.volumeRatioPct / 100,
    alignment: deriveAlignment(ctx.ema20, ctx.ema50, ctx.ema200),
  };
}

export default function DashboardPage() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("4h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCtx, setActiveCtx] = useState<MarketContext | null>(null);
  const [allRows, setAllRows] = useState<MultiTFRow[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all timeframes in parallel
      const results = await Promise.all(
        ALL_TIMEFRAMES.map((tf) => fetchContext(symbol, tf))
      );
      const rows = results.map(contextToMultiTFRow);
      setAllRows(rows);

      const active = results.find((r) => r.timeframe === timeframe) ?? results[0];
      setActiveCtx(active);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Reload when symbol changes (fetch all TFs fresh)
  useEffect(() => {
    load();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(load, REFRESH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  // When timeframe changes, update activeCtx from already-fetched rows without refetching
  useEffect(() => {
    setAllRows((prev) => {
      const match = prev.find((r) => r.timeframe === timeframe);
      if (!match) return prev; // will be loaded on next full refresh
      return prev;
    });
    // Re-derive activeCtx from cached results if available
    // (full refetch happens via `load` dependency on timeframe anyway)
  }, [timeframe]);

  const decision = activeCtx ? computeDecision(activeCtx, allRows) : null;

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E6EEF8]">
      <Header
        symbol={symbol}
        timeframe={timeframe}
        price={activeCtx?.price ?? 0}
        priceChangePct={activeCtx?.priceChangePct ?? 0}
        onSymbolChange={setSymbol}
        onTimeframeChange={setTimeframe}
      />

      <main className="mx-auto max-w-[1200px] px-6 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left column — 8/12 */}
          <div className="space-y-4 lg:col-span-8">
            <RegimeHeroCard ctx={activeCtx} loading={loading} error={error} />
            <RangePositionCard ctx={activeCtx} loading={loading} error={error} />
            <TrendMonitorCard
              rows={allRows}
              loading={loading}
              error={error}
              activeTimeframe={timeframe}
            />
          </div>

          {/* Right sidebar — 4/12 */}
          <div className="space-y-4 lg:col-span-4">
            <DecisionLogicCard decision={decision} loading={loading} />
            <CurrentSignalCard decision={decision} loading={loading} />
            <ActionsCard ctx={activeCtx} loading={loading} onRefresh={load} />
          </div>
        </div>
      </main>
    </div>
  );
}
