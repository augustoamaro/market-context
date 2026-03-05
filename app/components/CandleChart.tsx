"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  symbol: string;
  timeframe: string;
}

const CHART_HEIGHT = 400;

function ChartInner({ symbol, timeframe }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bars, setBars] = useState<Bar[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBars(null);
    setError(null);
    fetch(`/api/candles?symbol=${symbol}&timeframe=${timeframe}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBars(data);
      })
      .catch((e: Error) => setError(e.message));
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!bars || !containerRef.current) return;

    // Closed-over variables — accessible by cleanup even after async import
    let active = true;
    let chartInstance: { remove: () => void; applyOptions: (o: object) => void; timeScale: () => { fitContent: () => void } } | null = null;
    let roInstance: ResizeObserver | null = null;

    import("lightweight-charts").then(({ createChart, CandlestickSeries }) => {
      // Guard: effect may have been cleaned up before the import resolved
      if (!active || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth,
        height: CHART_HEIGHT,
        layout: {
          background: { color: "#111111" },
          textColor:  "#A1A1AA",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        crosshair: {
          vertLine: { color: "rgba(255,255,255,0.2)" },
          horzLine: { color: "rgba(255,255,255,0.2)" },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
        timeScale:        { borderColor: "rgba(255,255,255,0.08)", timeVisible: true },
      });

      chartInstance = chart;

      const series = chart.addSeries(CandlestickSeries, {
        upColor:         "#10B981",
        downColor:       "#EF4444",
        borderUpColor:   "#10B981",
        borderDownColor: "#EF4444",
        wickUpColor:     "#10B981",
        wickDownColor:   "#EF4444",
      });

      series.setData(bars as Parameters<typeof series.setData>[0]);
      chart.timeScale().fitContent();

      roInstance = new ResizeObserver(() => {
        if (containerRef.current && chartInstance) {
          chartInstance.applyOptions({ width: containerRef.current.clientWidth });
        }
      });
      roInstance.observe(containerRef.current);
    });

    return () => {
      active = false;
      roInstance?.disconnect();
      chartInstance?.remove();
    };
  }, [bars]);

  if (error) {
    return <p className="text-[13px] text-danger/80 p-4">{error}</p>;
  }

  if (!bars) {
    return (
      <div style={{ height: CHART_HEIGHT }} className="flex items-center justify-center">
        <span className="text-[12px] text-text-muted animate-pulse">Loading chart...</span>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}

const CandleChartDynamic = dynamic(() => Promise.resolve(ChartInner), { ssr: false });

export default function CandleChart(props: Props) {
  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8">
      <div className="mb-6 pl-1">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">
          Price Chart — {props.symbol} / {props.timeframe}
        </h2>
      </div>
      <CandleChartDynamic {...props} />
    </div>
  );
}
