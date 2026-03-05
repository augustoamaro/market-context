# Market Context Dashboard

A real-time market analysis dashboard built with **Next.js**, **TypeScript**, and **TailwindCSS**.
It fetches OHLCV data from **Binance** and classifies the current market context — **trend direction**, **price position within the range**, and **market regime** — to help traders avoid operating in the middle of a range or against the dominant trend.

Part of the **HardStop Trading Tools**: a set of practical market-analysis systems focused on liquidity, price action, and orderflow.

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| App (fullstack) | Next.js (App Router), TypeScript, TailwindCSS |
| Market Data | Binance REST API (OHLCV / klines) |
| Charts | TradingView Lightweight Charts |

--- 

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Trend** | EMA stack alignment (20/50/200). `up` = bullish order, `down` = bearish, `sideways` = mixed |
| **Range** | High/low over the last 20 candles. Price position expressed as 0–100% |
| **Market State** | Regime classification: `expansion` = directional conviction, `equilibrium` = consolidation |

**Rule of thumb**: favor `expansion` aligned with the trend. Avoid `equilibrium` and avoid trading against the trend direction.

---

## Market State Logic

Thresholds are configurable in `lib/config.ts`.

| Condition | State |
|-----------|-------|
| Price outside range AND volume > 130% of avg | `expansion` |
| Price inside range AND volume < 100% of avg | `equilibrium` |
| Volume > 130% of avg (mixed price position) | `expansion` |
| Otherwise | `equilibrium` |

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env

# 3. Run the app
pnpm dev
```

Open: `http://localhost:3000`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BINANCE_BASE_URL` | `https://api.binance.com` | Binance API base URL |
| `CACHE_TTL_SECONDS` | `60` | In-memory cache TTL |
| `DEFAULT_TIMEFRAME` | `4h` | Default chart interval |
| `DEFAULT_LIMIT` | `300` | Candles fetched per request (needed for EMA/RSI stability) |

---

## Project Structure

```
market-context-dashboard/
├── app/
│   ├── api/
│   │   ├── context/
│   │   │   └── route.ts              # GET /api/context (single + multi via query)
│   │   ├── symbols/
│   │   │   └── route.ts              # GET /api/symbols
│   │   └── timeframes/
│   │       └── route.ts              # GET /api/timeframes
│   │
│   ├── components/
│   │   ├── Dashboard.tsx             # root component + auto-refresh
│   │   ├── SymbolCard.tsx            # card per symbol
│   │   ├── TrendBadge.tsx            # UP / DOWN / SIDEWAYS badge
│   │   ├── RangeBar.tsx              # 0–100% range bar
│   │   ├── MarketStateBadge.tsx      # EQUILIBRIUM / EXPANSION badge
│   │   └── IndicatorTable.tsx        # EMA / RSI / Volume table
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── lib/
│   ├── config.ts                     # symbols, timeframes, thresholds
│   ├── binance/
│   │   ├── client.ts                 # fetch OHLCV + in-memory cache
│   │   └── types.ts                  # raw Binance kline type
│   │
│   ├── indicators/
│   │   ├── ema.ts                    # EMA via SMA seed + exponential smoothing
│   │   ├── rsi.ts                    # RSI(14) Wilder's method
│   │   ├── volume.ts                 # volume vs 20-candle average
│   │   ├── range.ts                  # high/low 20 candles + position %
│   │   ├── trend.ts                  # up/down/sideways via EMA stack
│   │   ├── marketState.ts            # equilibrium vs expansion classification
│   │   └── index.ts                  # re-exports
│   │
│   └── services/
│       └── marketContext.ts          # orchestrates fetch + all indicators
│
├── types/
│   └── market.ts                     # MarketContext, Trend, MarketState, OHLCV
│
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## API Reference

### `GET /api/symbols`

```json
["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]
```

### `GET /api/timeframes`

```json
["15m", "1h", "4h", "1d"]
```

### `GET /api/context?symbol=BTCUSDT&timeframe=4h`

```json
{
  "symbol": "BTCUSDT",
  "timeframe": "4h",
  "price": 67450.12,
  "trend": "up",
  "pricePositionPct": 73,
  "rangeHigh": 69000,
  "rangeLow": 62000,
  "ema20": 67200,
  "ema50": 65800,
  "ema200": 58400,
  "rsi14": 62.4,
  "volumeRatioPct": 140,
  "marketState": "expansion",
  "stateReason": "Price broke above range with volume 40% above average",
  "updatedAt": "2024-06-15T14:32:00.000Z"
}
```

### `GET /api/context?symbols=BTCUSDT,ETHUSDT&timeframe=4h`

Returns an array of `MarketContext` objects for multiple symbols on the same timeframe.

---

## Indicator Calculations

### EMA

```
k = 2 / (period + 1)
EMA[i] = price[i] * k + EMA[i-1] * (1 - k)
```

Seeded with an SMA over the first `period` candles.

### RSI — Wilder's method (RMA), period = 14

```
avgGain[i] = (avgGain[i-1] * (period - 1) + gain[i]) / period
avgLoss[i] = (avgLoss[i-1] * (period - 1) + loss[i]) / period
RSI = 100 - 100 / (1 + avgGain / avgLoss)
```

### Price Range Position

```
rangeHigh        = max(high) over last 20 candles
rangeLow         = min(low)  over last 20 candles
pricePositionPct = (price - rangeLow) / (rangeHigh - rangeLow) * 100
```

- `> 100` → price broke above the range
- `< 0` → price broke below the range

### Volume Ratio

```
avgVolume    = mean(volume) over last 20 candles (excluding current)
volumeRatio  = currentVolume / avgVolume
volumeRatioPct = volumeRatio * 100
```

### Trend

```
ema20 > ema50 > ema200  →  "up"
ema20 < ema50 < ema200  →  "down"
otherwise               →  "sideways"
```

---

## How to Read the Dashboard

| Signal | Interpretation |
|--------|---------------|
| UP + EXPANSION | Strong trending move with volume — favor trend-following entries |
| DOWN + EXPANSION | Strong bearish move — avoid longs, consider shorts |
| SIDEWAYS + EQUILIBRIUM | Consolidation — avoid directional trades |
| Any trend + EQUILIBRIUM | Low conviction — wait for expansion |
| Range 0–30% | Price near range low (support zone) |
| Range 70–100% | Price near range high (resistance zone) |
| RSI > 70 | Overbought — caution on longs |
| RSI < 30 | Oversold — caution on shorts |
| Volume > 1.3x | High participation / momentum |
| Volume < 0.8x | Low conviction move |

---

## How to Extend

### Add a symbol or timeframe

Edit `lib/config.ts`:

```ts
export const SYMBOLS    = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
export const TIMEFRAMES = ["15m", "1h", "4h", "1d", "1w"];
```

### Add a new indicator

1. Create `lib/indicators/myIndicator.ts`
2. Export it from `lib/indicators/index.ts`
3. Call it in `lib/services/marketContext.ts` and include the result in the returned object
4. Add the field to `types/market.ts`
5. Display it in the relevant UI component (e.g. `IndicatorTable.tsx`)

### Adjust market state thresholds

Edit `lib/config.ts`:

```ts
export const EXPANSION_VOLUME_RATIO   = 1.3;  // 130% of average
export const EQUILIBRIUM_VOLUME_RATIO = 1.0;  // 100% of average
```

---

## Sanity Check

After running `pnpm dev`, cross-check values against TradingView:

1. Open TradingView → BTCUSDT → 4h
2. Add EMA(20), EMA(50), EMA(200), RSI(14)
3. Compare with:

```bash
curl "http://localhost:3000/api/context?symbol=BTCUSDT&timeframe=4h"
```

Minor differences are expected due to candle history length and EMA seeding. RSI should match within ~±0.5 with 300 candles.

---

## Engineering Goals

- Market data ingestion from public exchange APIs
- Technical indicator computation from raw OHLCV
- Market regime classification
- Modular, reusable indicator architecture
- Fully typed API responses with TypeScript
