import { describe, it, expect } from "vitest";
import { classifyMarketState } from "../marketState";

describe("classifyMarketState()", () => {
  it("expansion: price above range + high volume", () => {
    const { state } = classifyMarketState(110, 1.5);
    expect(state).toBe("expansion");
  });

  it("expansion: price below range + high volume", () => {
    const { state } = classifyMarketState(-5, 1.4);
    expect(state).toBe("expansion");
  });

  it("equilibrium: price inside range + low volume", () => {
    const { state } = classifyMarketState(50, 0.8);
    expect(state).toBe("equilibrium");
  });

  it("expansion: high volume regardless of price position inside range", () => {
    const { state } = classifyMarketState(50, 1.5);
    expect(state).toBe("expansion");
  });

  it("equilibrium: price inside range, volume just at threshold", () => {
    // volume = 1.0 (EQUILIBRIUM_VOLUME_RATIO), not below → falls through to default equilibrium
    const { state } = classifyMarketState(50, 1.0);
    expect(state).toBe("equilibrium");
  });

  it("reason includes direction (above) for breakout", () => {
    const { reason } = classifyMarketState(105, 1.4);
    expect(reason).toContain("above");
  });

  it("reason includes direction (below) for breakdown", () => {
    const { reason } = classifyMarketState(-10, 1.4);
    expect(reason).toContain("below");
  });

  it("reason includes volume percentage", () => {
    // volRatio = 1.5 → volPct = 150 → 50% above average
    const { reason } = classifyMarketState(110, 1.5);
    expect(reason).toContain("50");
  });
});
