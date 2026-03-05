"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Star, X, Plus } from "lucide-react";
import { SYMBOLS } from "@/lib/config";
import { computeDecision, computeMultiTFConsensus, deriveAlignment } from "@/lib/decision";
import { MarketContext, Signal } from "@/types/market";
import { formatPrice } from "@/lib/format";

const FAVORITES_KEY = "hsc_favorites";
const DEFAULT_FAVORITES = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const TICKER_REFRESH_MS = 30_000;
const SCAN_REFRESH_MS = 60_000;
const MIN_SCORE_FOR_STAR = 60;

interface TickerEntry {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
}

interface TopSetup {
  symbol: string;
  signal: Signal;
  confidenceScore: number;
}

function getFavorites(): string[] {
  if (typeof window === "undefined") return DEFAULT_FAVORITES;
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_FAVORITES;
  } catch {
    return DEFAULT_FAVORITES;
  }
}

function saveFavorites(favs: string[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

interface SidebarProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  timeframe: string;
}

export default function Sidebar({ currentSymbol, onSymbolChange, timeframe }: SidebarProps) {
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [ticker, setTicker] = useState<Record<string, TickerEntry>>({});
  const [topSetup, setTopSetup] = useState<TopSetup | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const tickerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keyboard shortcut ⌘K / Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch ticker prices for current favorites
  const loadTicker = useCallback(async (syms: string[]) => {
    if (syms.length === 0) return;
    try {
      const res = await fetch(`/api/ticker?symbols=${syms.join(",")}`);
      if (!res.ok) return;
      const data: TickerEntry[] = await res.json();
      setTicker((prev) => {
        const next = { ...prev };
        for (const entry of data) next[entry.symbol] = entry;
        return next;
      });
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void loadTicker(favorites);
    }, 0);
    if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    tickerTimerRef.current = setInterval(() => {
      void loadTicker(favorites);
    }, TICKER_REFRESH_MS);
    return () => {
      clearTimeout(initialLoad);
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    };
  }, [favorites, loadTicker]);

  // Scan all symbols in chunks to find the best setup
  const scanBestSetup = useCallback(async () => {
    try {
      const CHUNK = 50;
      let best: TopSetup | null = null;
      for (let i = 0; i < SYMBOLS.length; i += CHUNK) {
        const chunk = SYMBOLS.slice(i, i + CHUNK);
        const res = await fetch(`/api/context?symbols=${chunk.join(",")}&timeframe=${timeframe}`);
        if (!res.ok) continue;
        const contexts: MarketContext[] = await res.json();
        for (const ctx of contexts) {
          const row = {
            timeframe: ctx.timeframe,
            ema12: ctx.ema12,
            ema20: ctx.ema20,
            ema50: ctx.ema50,
            ema200: ctx.ema200,
            rsi14: ctx.rsi14,
            volumeRatioX: ctx.volumeRatioPct / 100,
            alignment: deriveAlignment(ctx.ema12, ctx.ema20, ctx.ema50, ctx.ema200),
          };
          const decision = computeDecision(ctx, [row], computeMultiTFConsensus([row]));
          if (
            decision.signal !== "WAIT" &&
            decision.confidenceScore >= MIN_SCORE_FOR_STAR &&
            (best === null || decision.confidenceScore > best.confidenceScore)
          ) {
            best = { symbol: ctx.symbol, signal: decision.signal, confidenceScore: decision.confidenceScore };
          }
        }
      }
      setTopSetup(best);
    } catch { /* non-critical */ }
  }, [timeframe]);

  useEffect(() => {
    const initialScan = setTimeout(() => {
      void scanBestSetup();
    }, 0);
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = setInterval(scanBestSetup, SCAN_REFRESH_MS);
    return () => {
      clearTimeout(initialScan);
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, [scanBestSetup]);

  const addFavorite = (sym: string) => {
    if (favorites.includes(sym)) {
      onSymbolChange(sym);
      setIsSearchOpen(false);
      setSearchQuery("");
      return;
    }
    const updated = [...favorites, sym];
    setFavorites(updated);
    saveFavorites(updated);
    loadTicker([sym]);
    onSymbolChange(sym);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const removeFavorite = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.filter((f) => f !== sym);
    setFavorites(updated);
    saveFavorites(updated);
    if (currentSymbol === sym && updated.length > 0) {
      onSymbolChange(updated[0]);
    }
  };

  const filteredSymbols = SYMBOLS.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <aside
        className="w-52 border-r border-[#ffffff14] bg-surface/50 flex flex-col h-screen overflow-hidden flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        {/* Logo */}
        <div
          className="px-4 py-3.5 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center font-bold text-white text-xs tracking-tighter shadow-sm shadow-primary/20">
              HS
            </div>
            <span className="font-semibold text-sm tracking-tight text-text">HardStop</span>
          </div>
        </div>

        {/* Watchlist header */}
        <div className="px-4 pt-3.5 pb-2 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
            Watchlist
          </span>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1 text-text-muted hover:text-text transition-colors"
            title="Add symbol (⌘K)"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {/* Watchlist rows */}
        <div className="flex-1 overflow-y-auto">
          {favorites.length === 0 && (
            <p className="px-4 py-8 text-[12px] text-text-muted/50 text-center leading-relaxed">
              No symbols.<br />Press ⌘K to add.
            </p>
          )}

          {favorites.map((sym) => {
            const isActive = currentSymbol === sym;
            const isTop = topSetup?.symbol === sym;
            const t = ticker[sym];
            const base = sym.replace("USDT", "");
            const pct = t ? parseFloat(t.priceChangePercent) : null;
            const price = t ? parseFloat(t.lastPrice) : null;
            const isUp = pct !== null ? pct >= 0 : null;

            return (
              <div
                key={sym}
                onClick={() => onSymbolChange(sym)}
                className={`group w-full text-left px-3.5 py-2.5 border-l-2 transition-colors relative cursor-pointer ${
                  isActive
                    ? "bg-white/[0.04] border-primary"
                    : "border-transparent hover:bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {/* Remove on hover */}
                <button
                  onClick={(e) => removeFavorite(sym, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted/40 hover:text-danger p-0.5 rounded"
                  title="Remove from watchlist"
                >
                  <X className="size-3" />
                </button>

                {/* Symbol name + star */}
                <div className="flex items-center justify-between pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[13px] font-semibold leading-none ${isActive ? "text-text" : "text-text-muted"}`}>
                      {base}
                    </span>
                    {isTop && (
                      <Star
                        className={`size-3 ${topSetup.signal === "UP" ? "text-success" : "text-danger"}`}
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    )}
                  </div>
                  {/* Change % */}
                  {pct !== null && (
                    <span className={`text-[12px] font-mono font-medium ${isUp ? "text-success" : "text-danger"}`}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                    </span>
                  )}
                </div>

                {/* Price + absolute change */}
                <div className="flex items-center justify-between mt-0.5 pr-4">
                  {price !== null ? (
                    <span className="text-[12px] font-mono text-text-muted tabular-nums">
                      {formatPrice(price)}
                    </span>
                  ) : (
                    <div className="h-3 w-14 bg-white/5 rounded animate-pulse mt-0.5" />
                  )}
                  {t && pct !== null && (
                    <span className={`text-[11px] font-mono tabular-nums ${isUp ? "text-success/50" : "text-danger/50"}`}>
                      {parseFloat(t.priceChange) >= 0 ? "+" : ""}
                      {formatPrice(Math.abs(parseFloat(t.priceChange)))}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Search button at bottom */}
        <div className="px-3 py-3 border-t flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full bg-bg border rounded-md py-1.5 px-3 flex items-center justify-between text-[12px] text-text-muted hover:border-text-muted/30 transition-colors"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span>Search symbol</span>
            </div>
            <div className="flex items-center gap-0.5">
              <kbd className="font-mono text-[10px] bg-surface border rounded px-1" style={{ borderColor: "var(--color-border)" }}>⌘</kbd>
              <kbd className="font-mono text-[10px] bg-surface border rounded px-1" style={{ borderColor: "var(--color-border)" }}>K</kbd>
            </div>
          </button>
        </div>
      </aside>

      {/* Search / Add Symbol Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-28"
          onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
        >
          <div
            className="w-full max-w-xl bg-surface rounded-xl border shadow-2xl overflow-hidden flex flex-col"
            style={{ borderColor: "var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center" style={{ borderColor: "var(--color-border)" }}>
              <Search className="text-text-muted mr-3 size-5 shrink-0" />
              <input
                autoFocus
                className="w-full bg-transparent border-none p-0 text-lg focus:ring-0 text-text placeholder-text-muted outline-none"
                placeholder="Search to add to watchlist..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd
                className="font-mono text-[10px] bg-bg border rounded px-1.5 py-0.5 text-text-muted ml-2 shrink-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                ESC
              </kbd>
            </div>

            <div className="overflow-y-auto max-h-[420px] p-2">
              <div className="px-3 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                {searchQuery ? `Results (${filteredSymbols.length})` : `All symbols (${SYMBOLS.length})`}
              </div>

              {filteredSymbols.map((sym) => {
                const inList = favorites.includes(sym);
                const isTop = topSetup?.symbol === sym;
                const base = sym.replace("USDT", "");
                const t = ticker[sym];
                const pct = t ? parseFloat(t.priceChangePercent) : null;

                return (
                  <button
                    key={sym}
                    onClick={() => addFavorite(sym)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-bg transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-left">
                        <span className="font-semibold text-text group-hover:text-primary transition-colors text-[14px]">
                          {base}
                        </span>
                        <span className="text-text-muted/40 font-normal text-[13px]">/USDT</span>
                      </div>
                      {isTop && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                          topSetup.signal === "UP" ? "text-success bg-success/10" : "text-danger bg-danger/10"
                        }`}>
                          <Star className="size-2.5" fill="currentColor" strokeWidth={0} />
                          {topSetup.signal} · {topSetup.confidenceScore}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {pct !== null && (
                        <span className={`text-[12px] font-mono ${pct >= 0 ? "text-success" : "text-danger"}`}>
                          {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                        </span>
                      )}
                      {inList ? (
                        <span className="text-[11px] text-text-muted/50">In watchlist</span>
                      ) : (
                        <span className="text-[11px] text-text-muted/50 group-hover:text-primary transition-colors flex items-center gap-1">
                          <Plus className="size-3" /> Add
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredSymbols.length === 0 && (
                <div className="p-6 text-center text-sm text-text-muted">
                  No symbols found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
