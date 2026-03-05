"use client";

import { formatPrice, formatPct } from "@/lib/format";
import { LayoutGrid } from "lucide-react";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

interface HeaderProps {
  symbol: string;
  timeframe: string;
  price: number;
  priceChangePct: number;
  onSymbolChange: (s: string) => void;
  onTimeframeChange: (t: string) => void;
}

export default function Header({
  symbol,
  timeframe,
  price,
  priceChangePct,
  onSymbolChange,
  onTimeframeChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
      <div className="mx-auto flex max-w-[1200px] items-center h-14 px-6 md:px-8">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-8">
          <LayoutGrid className="size-4 text-text" strokeWidth={2} />
          <span className="text-[13px] font-semibold tracking-wide text-text">
            HardStop
          </span>
        </div>

        {/* Controls Container */}
        <div className="flex items-center gap-6 text-[12px] font-medium text-text-muted">

          {/* Symbol select */}
          <div className="flex items-center gap-3">
            <span className="select-none">Symbol</span>
            <div className="relative">
              <select
                value={symbol}
                onChange={(e) => onSymbolChange(e.target.value)}
                className="appearance-none bg-transparent text-text pr-4 py-1 focus:outline-none cursor-pointer"
              >
                {SYMBOLS.map((s) => (
                  <option key={s} value={s} className="bg-surface text-text">{s}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                <svg className="size-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="w-px h-3 bg-white/10" />

          {/* Timeframe select */}
          <div className="flex items-center gap-3">
            <span className="select-none">View</span>
            <div className="flex items-center gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-2 py-1 rounded-[4px] transition-colors duration-200 cursor-pointer ${tf === timeframe
                      ? "bg-white/10 text-text font-medium"
                      : "text-text-muted hover:text-text hover:bg-white/[0.04]"
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price ticker */}
        {price > 0 && (
          <div className="flex items-center gap-4 text-[12px]">
            <span className="font-mono text-text-muted">{symbol}</span>
            <span className="font-mono font-medium text-text">
              ${formatPrice(price)}
            </span>
            <span className={`font-mono font-medium px-1.5 py-0.5 rounded-[4px] ${priceChangePct >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
              {formatPct(priceChangePct, true)}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
