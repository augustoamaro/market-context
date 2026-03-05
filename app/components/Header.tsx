"use client";

import { formatPrice, formatPct } from "@/lib/format";

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
  const changeColor = priceChangePct >= 0 ? "text-success" : "text-danger";

  return (
    <header className="sticky top-0 z-50 border-b border-[#1E2A40] bg-[#0B1220]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-4">
          <span className="size-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-semibold tracking-widest text-text uppercase">
            HardStop
          </span>
        </div>

        {/* Symbol select */}
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-wider text-muted">Symbol</label>
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="rounded-lg border border-[#1E2A40] bg-[#0F1B2D] px-3 py-1.5 text-sm text-text focus:outline-none focus:border-info cursor-pointer"
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Timeframe select */}
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-wider text-muted">TF</label>
          <div className="flex rounded-lg border border-[#1E2A40] bg-[#0F1B2D] overflow-hidden">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  tf === timeframe
                    ? "bg-info text-[#0B1220] font-semibold"
                    : "text-muted hover:text-text"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price ticker */}
        {price > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted font-mono">{symbol}</span>
            <span className="text-lg font-semibold font-mono text-text">
              ${formatPrice(price)}
            </span>
            <span className={`text-sm font-mono font-medium ${changeColor}`}>
              {formatPct(priceChangePct, true)}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
