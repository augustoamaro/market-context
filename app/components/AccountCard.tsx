"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import CardSkeleton from "./Skeleton";
import SectionStatusCard from "./SectionStatusCard";

interface Balance {
  asset: string;
  free: string;
  locked: string;
}

const ASSET_ORDER = ["USDT", "BTC", "ETH", "SOL", "BNB"];

function fmt(value: string, asset: string): string {
  const n = parseFloat(value);
  if (asset === "USDT") return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

export default function AccountCard() {
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccount() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/account", { signal: controller.signal });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error ?? `HTTP ${response.status}`);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid account response");
        }

        // Sort by ASSET_ORDER
        const sorted = [...data].sort((a: Balance, b: Balance) => {
          const ia = ASSET_ORDER.indexOf(a.asset);
          const ib = ASSET_ORDER.indexOf(b.asset);
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        if (!controller.signal.aborted) {
          setBalances(sorted);
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load account balances");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => controller.abort();
  }, []);

  if (loading) return <CardSkeleton rows={3} height="h-40" />;

  if (error) {
    return (
      <SectionStatusCard
        title="Account"
        tone="error"
        message={`Unable to load account balances. ${error}`}
      />
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <SectionStatusCard
        title="Account"
        tone="empty"
        message="No balances were returned by the account endpoint."
      />
    );
  }

  return (
    <div className="bento-card hover:bento-card-hover rounded-xl p-6 sm:p-8 relative">
      <div className="flex items-center gap-2 mb-6 pl-1">
        <Wallet className="size-4 text-text-muted/60" />
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">Account</h2>
      </div>

      <div className="space-y-0 divide-y divide-white/[0.04]">
        {balances.map((b) => {
          const locked = parseFloat(b.locked);
          return (
            <div key={b.asset} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-[12px] font-mono font-medium text-text-muted">{b.asset}</span>
              <div className="text-right">
                <span className="text-[13px] font-mono text-text">{fmt(b.free, b.asset)}</span>
                {locked > 0 && (
                  <span className="ml-2 text-[11px] font-mono text-warn/70">+{fmt(b.locked, b.asset)} lk</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
