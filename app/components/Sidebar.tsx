"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface SidebarProps {
    currentSymbol: string;
    onSymbolChange: (symbol: string) => void;
}

const WATCHLIST = [
    { symbol: "BTCUSDT", type: "Perp", price: "64,230.50", change: "+1.96%", up: true },
    { symbol: "ETHUSDT", type: "Perp", price: "3,450.20", change: "-0.45%", up: false },
    { symbol: "SOLUSDT", type: "Perp", price: "142.85", change: "+4.20%", up: true },
];

export default function Sidebar({ currentSymbol, onSymbolChange }: SidebarProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Handle Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === "Escape" && isSearchOpen) {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSearchOpen]);

    const handleSelect = (sym: string) => {
        onSymbolChange(sym);
        setIsSearchOpen(false);
        setSearchQuery("");
    };

    const filteredWatchlist = WATCHLIST.filter(item =>
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <aside className="w-64 border-r border-[#ffffff14] bg-surface/50 flex flex-col h-screen overflow-y-auto flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                {/* Logo/Brand Area */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center font-bold text-white text-xs tracking-tighter shadow-sm shadow-primary/20">
                            HS
                        </div>
                        <span className="font-semibold text-sm tracking-tight text-text">HardStop</span>
                    </div>
                </div>

                {/* Search Button */}
                <div className="p-4">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-full bg-bg border rounded-md py-2 px-3 flex items-center justify-between text-sm text-text-muted hover:border-text-muted/50 transition-colors"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center">
                            <Search className="size-4 mr-2" />
                            <span>Search symbol...</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <kbd className="font-mono text-[10px] bg-surface border rounded px-1" style={{ borderColor: 'var(--color-border)' }}>⌘</kbd>
                            <kbd className="font-mono text-[10px] bg-surface border rounded px-1" style={{ borderColor: 'var(--color-border)' }}>K</kbd>
                        </div>
                    </button>
                </div>

                {/* Watchlist */}
                <div className="flex-1 overflow-y-auto py-2">
                    <div className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Watchlist
                    </div>
                    <div className="space-y-1 px-2">
                        {WATCHLIST.map((item) => {
                            const isActive = currentSymbol === item.symbol;
                            return (
                                <button
                                    key={item.symbol}
                                    onClick={() => onSymbolChange(item.symbol)}
                                    className={`w-full text-left block p-2 rounded-md border transition-colors ${isActive
                                            ? "bg-surface border-border"
                                            : "hover:bg-surface/50 border-transparent"
                                        }`}
                                    style={{ borderColor: isActive ? 'var(--color-border)' : 'transparent' }}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-sm ${isActive ? "font-semibold text-text" : "font-medium text-text-muted"}`}>
                                            {item.symbol}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isActive
                                                ? "text-primary bg-primary/10 border-primary/20"
                                                : "text-text-muted bg-bg border-border"
                                            }`}
                                            style={!isActive ? { borderColor: 'var(--color-border)' } : {}}
                                        >
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className={`font-mono text-sm tabular-nums ${isActive ? "text-text" : "text-text-muted"}`}>
                                            {item.price}
                                        </span>
                                        <span className={`text-xs font-medium ${item.up ? "text-success" : "text-danger"}`}>
                                            {item.change}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-32">
                    <div className="w-full max-w-xl bg-surface rounded-xl border shadow-2xl overflow-hidden flex flex-col" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="p-4 border-b flex items-center" style={{ borderColor: 'var(--color-border)' }}>
                            <Search className="text-text-muted mr-3 size-5" />
                            <input
                                autoFocus
                                className="w-full bg-transparent border-none p-0 text-lg focus:ring-0 text-text placeholder-text-muted outline-none"
                                placeholder="Search symbols..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <kbd className="font-mono text-[10px] bg-bg border rounded px-1.5 py-0.5 text-text-muted ml-2" style={{ borderColor: 'var(--color-border)' }}>
                                ESC
                            </kbd>
                        </div>
                        <div className="p-2 overflow-y-auto max-h-[400px]">
                            <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                {searchQuery ? "Results" : "Recent"}
                            </div>
                            {filteredWatchlist.map((item) => (
                                <button
                                    key={item.symbol}
                                    onClick={() => handleSelect(item.symbol)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-bg transition-colors group"
                                >
                                    <div className="flex items-center">
                                        <span className="font-medium mr-2 text-text group-hover:text-primary transition-colors">
                                            {item.symbol}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded border text-text-muted" style={{ borderColor: 'var(--color-border)' }}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="text-sm text-text-muted group-hover:text-text transition-colors">
                                        Select ↵
                                    </div>
                                </button>
                            ))}
                            {filteredWatchlist.length === 0 && (
                                <div className="p-4 text-center text-sm text-text-muted">
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
