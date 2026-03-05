export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

export function formatPriceShort(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(1)}k`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

export function formatPct(value: number, sign = false): string {
  const s = sign && value > 0 ? "+" : "";
  return `${s}${value.toFixed(2)}%`;
}

export function formatVolumeX(pct: number): string {
  return `${(pct / 100).toFixed(2)}x`;
}

export function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}
