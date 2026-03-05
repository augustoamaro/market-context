export const SYMBOLS = [
  // Layer 1 majors
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "AVAXUSDT",
  "DOTUSDT", "NEARUSDT", "ATOMUSDT", "APTUSDT", "SUIUSDT", "SEIUSDT",
  "TONUSDT", "TRXUSDT", "MATICUSDT", "ICPUSDT", "ALGOUSDT", "VETUSDT",
  "HBARUSDT", "XLMUSDT", "KASUSDT", "TIAUSDT",

  // Layer 2 / rollups
  "ARBUSDT", "OPUSDT", "STXUSDT",

  // DeFi
  "UNIUSDT", "AAVEUSDT", "MKRUSDT", "CRVUSDT", "COMPUSDT",
  "LDOUSDT", "RUNEUSDT", "INJUSDT", "PENDLEUSDT",

  // AI / Data
  "FETUSDT", "RNDRUSDT", "TAOUSDT", "WLDUSDT", "AGIXUSDT",

  // Infrastructure / Other
  "LINKUSDT", "FILUSDT", "SANDUSDT", "MANAUSDT",

  // Meme / high-volume
  "DOGEUSDT", "SHIBUSDT", "PEPEUSDT", "FLOKIUSDT",

  // Derivatives / Liquid staking
  "LTCUSDT", "JUPUSDT", "PYTHUSDT", "ENAUSDT",
];

export const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

export const BINANCE_BASE_URL =
  process.env.BINANCE_BASE_URL ?? "https://api.binance.com";

export const BINANCE_API_KEY = process.env.BINANCE_API_KEY ?? "";
export const BINANCE_SECRET  = process.env.BINANCE_SECRET  ?? "";

export const CACHE_TTL_MS =
  parseInt(process.env.CACHE_TTL_SECONDS ?? "60", 10) * 1000;

// 500 candles gives EMA(200) ~300 candles of convergence after the SMA seed,
// which reduces divergence from TradingView to ~0.3% vs ~2% with 300 candles.
export const CANDLE_LIMIT =
  parseInt(process.env.DEFAULT_LIMIT ?? "500", 10);

export const RANGE_LOOKBACK = 20;
export const VOLUME_LOOKBACK = 20;

export const EXPANSION_VOLUME_RATIO = 1.3;
export const EQUILIBRIUM_VOLUME_RATIO = 1.0;
