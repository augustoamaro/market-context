export function ema(values: number[], period: number): number {
  if (values.length < period) {
    throw new Error(`Not enough data for EMA(${period}): got ${values.length}`);
  }
  const k = 2 / (period + 1);
  let result = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < values.length; i++) {
    result = values[i] * k + result * (1 - k);
  }
  return result;
}
