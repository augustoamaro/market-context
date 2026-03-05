"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import { MarketContext, MultiTFRow } from "@/types/market";
import { computeDecision, deriveAlignment } from "@/lib/decision";
import Header from "./components/Header";
import RegimeHeroCard from "./components/RegimeHeroCard";
import RangePositionCard from "./components/RangePositionCard";
import TrendMonitorCard from "./components/TrendMonitorCard";
import DecisionLogicCard from "./components/DecisionLogicCard";
import CurrentSignalCard from "./components/CurrentSignalCard";
import CandleChart from "./components/CandleChart";
import Sidebar from "./components/Sidebar";

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
  const [allContexts, setAllContexts] = useState<MarketContext[]>([]);
  const [activeCtx, setActiveCtx] = useState<MarketContext | null>(null);
  const [allRows, setAllRows] = useState<MultiTFRow[]>([]);

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
        .map((r) => r.value);

      if (contexts.length === 0) throw new Error("All timeframes failed to load");

      setAllContexts(contexts);
      setAllRows(contexts.map(contextToMultiTFRow));
    } catch (e) {
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

  const decision = activeCtx ? computeDecision(activeCtx, allRows) : null;

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg">
      <Sidebar currentSymbol={symbol} onSymbolChange={setSymbol} timeframe={timeframe} />

      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header
          symbol={symbol}
          timeframe={timeframe}
          price={activeCtx?.price ?? 0}
          priceChangePct={activeCtx?.priceChangePct ?? 0}
          onSymbolChange={setSymbol}
          onTimeframeChange={setTimeframe}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-[1200px]">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 lg:grid-cols-12"
            >
              {/* Left column — 8/12 */}
              <div className="space-y-6 lg:col-span-8">
                <motion.div variants={itemVariants}>
                  <RegimeHeroCard ctx={activeCtx} loading={loading} error={error} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <RangePositionCard ctx={activeCtx} loading={loading} error={error} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <TrendMonitorCard
                    rows={allRows}
                    loading={loading}
                    error={error}
                    activeTimeframe={timeframe}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <CandleChart symbol={symbol} timeframe={timeframe} />
                </motion.div>
              </div>

              {/* Right sidebar — 4/12, self-start so cards don't stretch */}
              <div className="space-y-6 lg:col-span-4 lg:self-start">
                <motion.div variants={itemVariants}>
                  <DecisionLogicCard decision={decision} loading={loading} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <CurrentSignalCard decision={decision} loading={loading} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
