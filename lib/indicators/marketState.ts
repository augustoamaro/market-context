import { EXPANSION_VOLUME_RATIO, EQUILIBRIUM_VOLUME_RATIO } from "@/lib/config";

export interface MarketStateResult {
  state: "expansion" | "equilibrium";
  reason: string;
}

export function classifyMarketState(
  pricePositionPct: number,
  volRatio: number
): MarketStateResult {
  const isOutside = pricePositionPct > 100 || pricePositionPct < 0;
  const isInside  = !isOutside;
  const volPct    = Math.round(volRatio * 100);

  if (isOutside && volRatio >= EXPANSION_VOLUME_RATIO) {
    const dir = pricePositionPct > 100 ? "above" : "below";
    return {
      state: "expansion",
      reason: `Price broke ${dir} range with volume ${volPct - 100}% above average`,
    };
  }
  if (isInside && volRatio < EQUILIBRIUM_VOLUME_RATIO) {
    return {
      state: "equilibrium",
      reason: `Price inside range with volume ${100 - volPct}% below average`,
    };
  }
  if (volRatio >= EXPANSION_VOLUME_RATIO) {
    return {
      state: "expansion",
      reason: `Volume ${volPct - 100}% above average — expansive pressure`,
    };
  }
  return {
    state: "equilibrium",
    reason: `Price in equilibrium with volume at ${volPct}% of average`,
  };
}
