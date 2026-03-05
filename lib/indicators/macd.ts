function emaArray(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let current = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  result.push(current);
  for (let i = period; i < values.length; i++) {
    current = values[i] * k + current * (1 - k);
    result.push(current);
  }
  return result;
}

export interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export function macd(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDResult {
  const minLength = slowPeriod + signalPeriod - 1;
  if (closes.length < minLength) {
    throw new Error(`Not enough data for MACD: need ${minLength}, got ${closes.length}`);
  }

  const fast = emaArray(closes, fastPeriod);
  const slow = emaArray(closes, slowPeriod);

  // Align: slow starts at index (slowPeriod - 1), fast starts at (fastPeriod - 1)
  // slow[i] corresponds to closes[slowPeriod - 1 + i]
  // fast[i] corresponds to closes[fastPeriod - 1 + i]
  // Offset: slow[i] aligns with fast[i + (slowPeriod - fastPeriod)]
  const offset = slowPeriod - fastPeriod;
  const macdLine = slow.map((s, i) => fast[i + offset] - s);

  const signalArray = emaArray(macdLine, signalPeriod);

  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalArray[signalArray.length - 1];

  return {
    macdLine:   lastMacd,
    signalLine: lastSignal,
    histogram:  lastMacd - lastSignal,
  };
}
