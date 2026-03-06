"use client";

import { formatPrice, formatPct } from "@/lib/format";
import { TIMEFRAMES } from "@/lib/config";

interface HeaderProps {
  symbol: string;
  timeframe: string;
  price: number;
  priceChangePct: number;
  onTimeframeChange: (t: string) => void;
}

export default function Header({
  symbol,
  timeframe,
  price,
  priceChangePct,
  onTimeframeChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
      <div className="mx-auto flex max-w-[1200px] items-center h-14 px-6 md:px-8">

        {/* Controls Container (Moved to right side alignment) */}
        <div className="flex items-center gap-6 text-[12px] font-medium text-text-muted">
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
