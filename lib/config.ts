export const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];

export const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

export const BINANCE_BASE_URL =
  process.env.BINANCE_BASE_URL ?? "https://api.binance.com";

export const BINANCE_API_KEY = process.env.BINANCE_API_KEY ?? "";
export const BINANCE_SECRET  = process.env.BINANCE_SECRET  ?? "";

export const CACHE_TTL_MS =
  parseInt(process.env.CACHE_TTL_SECONDS ?? "60", 10) * 1000;

// Enough candles for EMA(200) to stabilize
export const CANDLE_LIMIT =
  parseInt(process.env.DEFAULT_LIMIT ?? "300", 10);

export const RANGE_LOOKBACK = 20;
export const VOLUME_LOOKBACK = 20;

export const EXPANSION_VOLUME_RATIO = 1.3;
export const EQUILIBRIUM_VOLUME_RATIO = 1.0;
