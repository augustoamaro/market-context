# HardStop — Market Context Dashboard

A real-time market analysis dashboard built with **Next.js**, **TypeScript**, and **TailwindCSS**.
Fetches OHLCV data from Binance and classifies the current market context across multiple timeframes — trend direction, price position within the range, market regime, momentum, and MACD — to help traders identify high-probability setups and avoid low-conviction environments.

Part of the **HardStop Trading Tools**: a set of practical market-analysis systems focused on price action, liquidity, and orderflow.

---

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tests](https://img.shields.io/badge/tests-45%20passing-brightgreen?logo=vitest)
![License](https://img.shields.io/badge/license-MIT-green)

## Preview

![HardStop dashboard preview](./public/preview.png)
_Illustrative preview image. Replace `public/preview.png` with a live screenshot after UI updates._

---

## Requirements

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Optional: copy env defaults (works without Binance credentials)
cp .env.example .env

# 3. Run the app
pnpm dev
```

This dashboard runs against Binance public OHLCV endpoints out of the box.
`BINANCE_API_KEY` is optional and only improves rate limits for public requests.

Open: `http://localhost:3000`

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server at `localhost:3000` |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run all 45 unit tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with v8 coverage report |
| `pnpm lint` | Run ESLint |

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| App (fullstack) | Next.js 16 (App Router), TypeScript, TailwindCSS v4 |
| Market Data | Binance REST API (OHLCV / klines), optional API key header |
| Indicators | EMA, RSI (Wilder), Volume Ratio, Price Range, MACD |
| Charts | TradingView Lightweight Charts v5 |
| Animations | Framer Motion |
| Tests | Vitest (45 tests) |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BINANCE_API_KEY` | Optional | — | Adds `X-MBX-APIKEY` header for public endpoints (`/api/context`, `/api/candles`) to improve per-key rate limits |
| `BINANCE_SECRET` | Optional | — | Only for HMAC-signed private endpoints (`lib/binance/signedClient.ts`, `/api/account`) |
| `BINANCE_BASE_URL` | No | `https://api.binance.com` | Binance base URL |
| `CACHE_TTL_SECONDS` | No | `60` | In-memory cache TTL per symbol/timeframe |
| `DEFAULT_LIMIT` | No | `300` | Candles fetched per request (300 needed for EMA-200 stability) |

`/api/context` and `/api/candles` use public OHLCV endpoints and work with zero credentials.
`BINANCE_SECRET` is kept for private-account features and is not required to run the current dashboard UI.

---

## Security

- Never commit `.env` files (`.env*` is already git-ignored).
- Prefer `.env.local` for local secrets; Next.js loads it automatically and it is also git-ignored.
- `BINANCE_API_KEY` is low-risk (read-only market data header), but rotate it if leaked.
- `BINANCE_SECRET` is highly sensitive: it can sign private requests. Never log it, expose it client-side, or commit it.

---

## Project Structure

```
market-context/
├── app/
│   ├── api/
│   │   ├── candles/route.ts          # GET /api/candles  — raw OHLCV for chart
│   │   ├── context/route.ts          # GET /api/context  — single or batch symbols
│   │   ├── symbols/route.ts          # GET /api/symbols
│   │   └── timeframes/route.ts       # GET /api/timeframes
│   │
│   ├── components/
│   │   ├── CandleChart.tsx           # TradingView candlestick chart (SSR-safe)
│   │   ├── CurrentSignalCard.tsx     # Final signal (UP/DOWN/WAIT) + conviction score
│   │   ├── DecisionLogicCard.tsx     # 5-step decision timeline + score breakdown bars
│   │   ├── Header.tsx                # Symbol selector, timeframe tabs, price ticker
│   │   ├── RangePositionCard.tsx     # Price position within 20-candle range
│   │   ├── RegimeHeroCard.tsx        # Market regime + RSI/Volume/MACD stats
│   │   ├── Skeleton.tsx              # Loading skeleton
│   │   └── TrendMonitorCard.tsx      # Multi-timeframe EMA alignment table
│   │
│   ├── error.tsx                     # Global error boundary (Next.js App Router)
│   ├── globals.css                   # Design tokens + bento-card utilities
│   ├── layout.tsx
│   └── page.tsx                      # State orchestration + auto-refresh (60s)
│
├── lib/
│   ├── config.ts                     # Symbols, timeframes, thresholds, env vars
│   ├── decision.ts                   # Decision engine: 5 weighted steps → signal + conviction score
│   ├── format.ts                     # Price, percent, volume formatters
│   ├── rateLimit.ts                  # Sliding-window rate limiter (per IP)
│   ├── binance/
│   │   ├── client.ts                 # OHLCV fetch + 60s in-memory cache
│   │   ├── signedClient.ts           # HMAC-SHA256 signed requests
│   │   └── types.ts                  # RawKline, OHLCV types
│   │
│   ├── indicators/
│   │   ├── ema.ts                    # EMA (SMA seed + exponential smoothing)
│   │   ├── macd.ts                   # MACD line, signal, histogram
│   │   ├── marketState.ts            # Expansion vs equilibrium classification
│   │   ├── range.ts                  # 20-candle high/low + price position %
│   │   ├── rsi.ts                    # RSI-14 Wilder's method (RMA)
│   │   ├── volume.ts                 # Volume ratio vs 20-candle average
│   │   └── index.ts                  # Re-exports
│   │
│   └── services/
│       └── marketContext.ts          # Orchestrates fetch + all indicators
│
├── lib/__tests__/decision.test.ts
├── lib/indicators/__tests__/
│   ├── ema.test.ts
│   ├── macd.test.ts
│   ├── marketState.test.ts
│   └── rsi.test.ts
│
├── types/market.ts                   # MarketContext, Decision, MultiTFRow, etc.
├── .env.example
├── vitest.config.ts
└── package.json
```

---

## API Reference

### `GET /api/context?symbol=BTCUSDT&timeframe=4h`

```json
{
  "symbol": "BTCUSDT",
  "timeframe": "4h",
  "price": 72917.76,
  "priceChangePct": 0.82,
  "trend": "up",
  "marketState": "expansion",
  "stateReason": "Price broke above range with volume 38% above average",
  "pricePositionPct": 83,
  "rangeHigh": 75000,
  "rangeLow": 68000,
  "ema20": 72400,
  "ema50": 70100,
  "ema200": 58200,
  "rsi14": 61.4,
  "volumeRatioPct": 138,
  "macdLine": 210.4,
  "macdSignal": 180.1,
  "macdHistogram": 30.3,
  "updatedAt": "2026-03-05T14:32:00.000Z"
}
```

### `GET /api/context?symbols=BTCUSDT,ETHUSDT&timeframe=4h`

Returns an array of `MarketContext`. Individual failures are skipped — only successfully loaded symbols are returned.

### `GET /api/candles?symbol=BTCUSDT&timeframe=4h`

Returns the last 100 OHLCV bars formatted for TradingView Lightweight Charts:

```json
[{ "time": 1709640000, "open": 71200, "high": 73100, "low": 70900, "close": 72917 }]
```

### `GET /api/symbols` / `GET /api/timeframes`

```json
["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "AVAXUSDT", "..."]
["15m", "1h", "4h", "1d"]
```

50 symbols are configured by default, organized by category in `lib/config.ts`:
- **L1 majors** — BTC, ETH, BNB, SOL, ADA, AVAX, DOT, NEAR, ATOM, APT, SUI, SEI, TON, TRX, MATIC, ICP, ALGO, VET, HBAR, XLM, KAS, TIA
- **L2 / rollups** — ARB, OP, STX
- **DeFi** — UNI, AAVE, MKR, CRV, COMP, LDO, RUNE, INJ, PENDLE
- **AI / Data** — FET, RNDR, TAO, WLD, AGIX
- **Infrastructure** — LINK, FIL, SAND, MANA
- **Meme / high-volume** — DOGE, SHIB, PEPE, FLOKI
- **Other** — LTC, JUP, PYTH, ENA

---

## Indicator Calculations

### EMA (Exponential Moving Average)

```
k = 2 / (period + 1)
seed    = SMA of first `period` candles
EMA[i]  = price[i] * k + EMA[i-1] * (1 - k)
```

Used: EMA-20, EMA-50, EMA-200 for trend classification.

### RSI — Wilder's Smoothing (RMA), period = 14

```
avgGain[i] = (avgGain[i-1] * 13 + gain[i]) / 14
avgLoss[i] = (avgLoss[i-1] * 13 + loss[i]) / 14
RSI        = 100 - 100 / (1 + avgGain / avgLoss)
```

### MACD (12, 26, 9)

```
MACD Line    = EMA(12) - EMA(26)
Signal Line  = EMA(9) of MACD Line
Histogram    = MACD Line - Signal Line
```

Histogram > 0 = bullish momentum building. Histogram < 0 = bearish pressure.

### Price Range Position

```
rangeHigh        = max(high)  over last 20 candles
rangeLow         = min(low)   over last 20 candles
pricePositionPct = (price - rangeLow) / (rangeHigh - rangeLow) * 100
```

Values outside 0–100 indicate a breakout (> 100) or breakdown (< 0).

### Volume Ratio

```
avgVolume   = mean(volume) over last 20 candles (excluding current)
volumeRatio = currentVolume / avgVolume
```

Ratio ≥ 1.3 signals above-average participation (expansion pressure).

### Market Regime

| Condition | State |
|-----------|-------|
| Price outside range AND volume ≥ 1.3× avg | `expansion` |
| Volume ≥ 1.3× avg (any price position) | `expansion` |
| Price inside range AND volume < 1.0× avg | `equilibrium` |
| Otherwise | `equilibrium` |

---

## How to Read the Dashboard (Trader's Guide)

This section explains how to interpret each panel and combine them into a trading decision.

---

### 1. Market Regime — the first filter

**Where:** top-left card.

The regime tells you whether the market is *doing something* or *waiting*.

| Regime | Meaning | What to do |
|--------|---------|------------|
| **Expansion** (green pulse) | Price is moving with volume behind it — directional conviction exists | Look for entries aligned with the trend |
| **Equilibrium** (neutral) | Market is ranging, volume is low — no side has control | Reduce size, avoid directional bets, wait |

> **Rule #1:** Never force a trade in Equilibrium. The market will tell you when it's ready.

The stats row below the title gives you supporting context:

- **Trend** — EMA stack direction (`Uptrend / Downtrend / Sideways`). The sublabel shows the actual EMA order (`EMA 20 > 50 > 200`).
- **RSI 14** — momentum reading. Labels: `Healthy` (45–65), `Strong` (65–75), `Overbought` (>75), `Weak` (30–45), `Oversold` (<30). The mini bar shows position in the 0–100 range.
- **Volume** — current candle vs 20-candle average. `Above avg` or `Very high` confirms expansion. `Below avg` in a move = suspect.
- **MACD Histogram** — positive = bullish momentum building, negative = bearish. A histogram crossing zero often precedes a trend shift.

---

### 2. Range Strategy — where in the range is price?

**Where:** second card on the left.

The 20-candle high/low defines the current range. The percentage tells you where price sits within it.

| Position | Zone | Interpretation |
|----------|------|----------------|
| < 0% | Breakdown | Price broke below — bearish expansion underway |
| 0–25% | Support | Near range low — potential support or breakdown zone |
| 25–45% | Low-Mid | Below midpoint — mild bearish lean |
| 45–55% | Mid Range | Equilibrium midline — **avoid entries here** |
| 55–75% | High-Mid | Above midpoint — mild bullish lean |
| 75–100% | Resistance | Near range high — potential resistance or breakout zone |
| > 100% | Breakout | Price broke above — bullish expansion underway |

The **distance to high/low** (`To High` / `To Low`) shows how much room price has before hitting the boundary. A large "To High" with an Uptrend means there is room to run. A small "To High" with an Uptrend means you are entering near resistance — risky.

> **Rule #2:** Avoid the mid-range (45–55%). Entries here have low directional probability. Wait for price to test a boundary.

---

### 3. Trend Monitor — multi-timeframe alignment

**Where:** third card on the left.

The table shows EMA stack alignment across all four timeframes (15m, 1h, 4h, 1d):

| Alignment | Meaning |
|-----------|---------|
| **Bullish** (green dot) | EMA 20 > EMA 50 > EMA 200 on that timeframe |
| **Bearish** (red dot) | EMA 20 < EMA 50 < EMA 200 on that timeframe |
| **Sideways** (yellow dot) | EMAs are mixed — no clear order |

**How to use it:** count how many timeframes agree. 3 or 4 bullish = strong trend. 2/4 = mixed, reduce confidence. 1/4 or 0/4 = no directional edge.

The RSI and Volume columns per timeframe let you spot divergences — e.g., price making higher highs while RSI weakens across multiple timeframes is a warning sign.

---

### 4. Decision Logic — the 5-step checklist + score breakdown

**Where:** top-right card.

Every trade setup passes through 5 filters. Each returns a status and contributes a weighted score:

| Icon | Status | Meaning |
|------|--------|---------|
| ✓ | OK (white) | Filter passed |
| ⚠ | Warn (yellow) | Marginal — proceed with reduced size |
| ✗ | Bad (red) | Filter failed — significant headwind |

**The 5 filters and their weight in the 0–100 score:**

| # | Filter | Max pts | Scoring |
|---|--------|---------|---------|
| 1 | **Trend Alignment** | 30 | 4/4 TFs aligned = 30, 3/4 = 22, 2/4 = 12, 1/4 = 5, sideways = 0 |
| 2 | **Regime** | 20 | Expansion = 20, Equilibrium = 10 |
| 3 | **Momentum** | 15 | RSI 45–65 = 15, 35–45 or 65–75 = 10, 25–35 or 75–85 = 5, extreme = 0 |
| 4 | **Position** | 20 | Range extreme (< 25% or > 75%) = 20, mid-approach = 12, mid-range 40–60% = 0 |
| 5 | **Volume** | 15 | ≥ 130% avg = 15, ≥ 100% = 10, ≥ 70% = 5, < 70% = 0 |

The **Score Breakdown** bars are displayed at the bottom of the card, showing per-dimension contribution and total out of 100.

> **Rule #3:** A HIGH CONVICTION signal requires a total score ≥ 65. Below that = LOW CONVICTION — smaller size or no trade.

---

### 5. Current Signal — the final verdict

**Where:** bottom-right card.

| Signal | Conviction | Condition |
|--------|-----------|-----------|
| **UP** HIGH CONVICTION | ≥3 checks OK, no fails | Trend up + Expansion + RSI healthy + price not mid-range |
| **UP** LOW CONVICTION | Bullish setup with caveats | Some checks warn or fail |
| **DOWN** HIGH CONVICTION | ≥3 checks OK, no fails | Trend down + Expansion + RSI healthy + price not mid-range |
| **DOWN** LOW CONVICTION | Bearish setup with caveats | Some checks warn or fail |
| **WAIT** NO TRADE | Auto-blocked | Equilibrium + price in mid-range (40–60%) |
| **WAIT** LOW CONVICTION | Mixed signals | No clear trend or regime alignment |

The **Confidence Score (0–100)** is not a probability — it is a relative strength indicator. It is computed as the sum of five weighted dimensions (Trend 30 + Regime 20 + Position 20 + Momentum 15 + Volume 15). A score of 85 means all filters aligned cleanly. A score of 45 means the setup exists but has meaningful headwinds.

Reference scale:
- `0` = **NO TRADE** (auto-blocked: Equilibrium + mid-range)
- `< 40` = **WAIT / LOW CONVICTION** (multiple headwinds)
- `40–64` = **LOW CONVICTION** (directional setup with caveats)
- `≥ 65` = **HIGH CONVICTION** (most filters aligned)
- `100` = perfect setup (all five dimensions maxed)

---

### Reading the Dashboard Together — Example Scenarios

**Ideal long setup:**
- Regime: Expansion ✓
- Trend: Uptrend — EMA 20 > 50 > 200 ✓
- Trend Monitor: 3–4/4 timeframes bullish ✓
- Range: Price at 20–30% (support zone) or just broke > 100% (breakout) ✓
- RSI: 50–65 (healthy, room to run) ✓
- MACD Histogram: positive and widening ✓
- Decision Logic: 4/4 OK → **UP / HIGH CONVICTION**

**Stay out scenario:**
- Regime: Equilibrium
- Range: 50% (mid-range)
- Decision Logic: Position = bad, Regime = warn
- Signal: **WAIT / NO TRADE** — the tool blocks the trade automatically

**Wait for confirmation:**
- Regime: Expansion but Trend = Sideways
- Trend Monitor: 2/4 bullish, 2/4 sideways
- RSI: 72 (approaching overbought)
- Signal: **WAIT / LOW CONVICTION** — setup exists but not clean enough

---

## How to Extend

### Add a symbol or timeframe

Edit `lib/config.ts`:

```ts
export const SYMBOLS    = ["BTCUSDT", "ETHUSDT", ..., "ENAUSDT"]; // 50 symbols, see lib/config.ts
export const TIMEFRAMES = ["15m", "1h", "4h", "1d", "1w"];
```

### Add a new indicator

1. Create `lib/indicators/myIndicator.ts`
2. Export it from `lib/indicators/index.ts`
3. Call it in `lib/services/marketContext.ts`
4. Add the field to `types/market.ts`
5. Display it in the relevant component

### Adjust market state thresholds

Edit `lib/config.ts`:

```ts
export const EXPANSION_VOLUME_RATIO   = 1.3;  // 130% of avg = expansion
export const EQUILIBRIUM_VOLUME_RATIO = 1.0;  // below 100% = equilibrium
export const RANGE_LOOKBACK           = 20;   // candles for high/low range
export const VOLUME_LOOKBACK          = 20;   // candles for volume avg
```

---

## Deploy

- This is a standard Next.js app and deploys to Vercel with zero config.
- All Binance calls run server-side via API routes, so browser CORS is not a blocker.
- Set env vars in Vercel project settings (only if you plan to use private account endpoints).
- On the free Vercel plan, 10s function timeout is usually fine with cache hits, but cold starts with heavier fetches can be tight.

---

## Roadmap

- [ ] WebSocket streaming for real-time price and volume (replace 60s polling)
- [ ] Signal change alerts via Notification API or Telegram webhook
- [ ] Custom symbol input (user-defined pairs beyond the 50 configured defaults)
- [ ] Persisted cache with Redis (survive restarts and share across instances)
- [ ] Extra regime indicators: ATR volatility and Bollinger Band width
- [ ] Multi-exchange adapters (Bybit, OKX)

---

## Sanity Check

After running `pnpm dev`, cross-check values against TradingView:

1. Open TradingView → select symbol → select timeframe
2. Add EMA(20), EMA(50), EMA(200), RSI(14), MACD(12,26,9)
3. Compare with:

```bash
curl "http://localhost:3000/api/context?symbol=BTCUSDT&timeframe=4h"
```

Minor differences are expected due to candle history depth and EMA seed. RSI should match within ±0.5 with 300 candles. MACD histogram may differ by a small amount for the same reason.

---

## Engineering Notes

- **Cache:** each symbol/timeframe pair is cached in-memory for 60s. The UI auto-refreshes on the same interval. Timeframe switching is instant (served from cache, no new request).
- **Rate limiting:** sliding window per IP — 30 req/min on market data endpoints, 10 req/min on account.
- **Tests:** 45 unit tests covering EMA, RSI, MACD, market state classification, and the full decision engine (including per-dimension volume scoring).
- **Error boundary:** `app/error.tsx` catches runtime errors and shows a recoverable error screen.

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
