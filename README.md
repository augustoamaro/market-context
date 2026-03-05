# HardStop — Market Context Dashboard

A real-time market analysis dashboard built with **Next.js**, **TypeScript**, and **TailwindCSS**.
Fetches OHLCV data from Binance and classifies market context across **15m, 1h, 4h, 1d, and 1w** — trend direction, price position within the range, market regime, EMA structure, RSI, volume, and MACD — then combines them into a **stable global decision** that does not change when the user switches the dropdown timeframe.

Part of the **HardStop Trading Tools**: a set of practical market-analysis systems focused on price action, liquidity, and orderflow.

---

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen?logo=vitest)
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
| `pnpm test` | Run the unit test suite (Vitest) |
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
| Tests | Vitest |

---

## Core Decision Model

The app now separates **global bias** from **timeframe diagnosis**:

- **Global Decision**: uses weighted multi-timeframe consensus plus a fixed `1h` execution timeframe to emit `WAIT`, `WATCH`, or `READY`.
- **Local Diagnosis**: the selected dropdown timeframe still drives `DecisionLogicCard`, `RegimeHeroCard`, `RangePositionCard`, and the chart.
- **Stable signal**: switching the dropdown no longer changes the main signal shown in `CurrentSignalCard`.

Timeframe weights used by the consensus engine:

| Timeframe | Weight |
|-----------|--------|
| `1w` | 40 |
| `1d` | 25 |
| `4h` | 15 |
| `1h` | 12 |
| `15m` | 8 |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BINANCE_API_KEY` | Optional | — | Adds `X-MBX-APIKEY` header for public endpoints (`/api/context`, `/api/candles`) to improve per-key rate limits |
| `BINANCE_SECRET` | Optional | — | Only for HMAC-signed private endpoints (`lib/binance/signedClient.ts`, `/api/account`) |
| `BINANCE_BASE_URL` | No | `https://api.binance.com` | Binance base URL |
| `CACHE_TTL_SECONDS` | No | `60` | In-memory cache TTL per symbol/timeframe |
| `DEFAULT_LIMIT` | No | `500` | Candles fetched per request (500 gives EMA-200 ~300 candles of convergence, ±0.3% from TradingView) |
| `RATE_LIMIT_RPM` | No | `120` | Max API requests per minute per IP. The dashboard fires ~6 requests on load; 120 gives headroom for normal use and dev reloads |

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
│   │   ├── context/route.ts          # GET /api/context  — single or chunked batch (50/chunk)
│   │   ├── ticker/route.ts           # GET /api/ticker   — lightweight 24h price + change
│   │   ├── validate/route.ts         # GET /api/validate — indicator cross-check vs TradingView
│   │   ├── symbols/route.ts          # GET /api/symbols
│   │   └── timeframes/route.ts       # GET /api/timeframes
│   │
│   ├── components/
│   │   ├── CandleChart.tsx           # TradingView candlestick chart (SSR-safe)
│   │   ├── CurrentSignalCard.tsx     # Global decision card (LONG/SHORT/NONE + WAIT/WATCH/READY)
│   │   ├── DecisionLogicCard.tsx     # Local TF diagnosis timeline + score breakdown bars
│   │   ├── Header.tsx                # Timeframe tabs + price ticker
│   │   ├── RangePositionCard.tsx     # Price position within 20-candle range
│   │   ├── RegimeHeroCard.tsx        # Market regime + RSI/Volume/MACD stats
│   │   ├── Sidebar.tsx               # Watchlist (favorites) + best-setup star + search
│   │   ├── Skeleton.tsx              # Loading skeleton
│   │   └── TrendMonitorCard.tsx      # Multi-timeframe EMA table + weighted consensus bar
│   │
│   ├── error.tsx                     # Global error boundary (Next.js App Router)
│   ├── globals.css                   # Design tokens + bento-card utilities
│   ├── layout.tsx
│   └── page.tsx                      # State orchestration + global/local decision split
│
├── lib/
│   ├── config.ts                     # Symbols, timeframes, thresholds, env vars
│   ├── decision.ts                   # Consensus engine + local decision + global decision
│   ├── format.ts                     # Price, percent, volume formatters
│   ├── journal.ts                    # localStorage helpers for context snapshots (client-only)
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
├── types/market.ts                   # MarketContext, Decision, GlobalDecision, MultiTFRow, etc.
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
  "ema12": 72780,
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

Returns an array of `MarketContext`. Individual failures are skipped — only successfully loaded symbols are returned. Processes in chunks of 50 server-side to avoid overwhelming Binance on cold start.

### `GET /api/ticker?symbols=BTCUSDT,ETHUSDT`

Lightweight 24h price ticker — does **not** fetch candles. Used by the watchlist sidebar for live prices.

```json
[
  { "symbol": "BTCUSDT", "lastPrice": "71396.10", "priceChange": "-1270.50", "priceChangePercent": "-1.75" },
  { "symbol": "ETHUSDT", "lastPrice": "2080.92",  "priceChange":   "-46.30", "priceChangePercent": "-2.18" }
]
```

### `GET /api/candles?symbol=BTCUSDT&timeframe=4h`

Returns the last 100 OHLCV bars formatted for TradingView Lightweight Charts:

```json
[{ "time": 1709640000, "open": 71200, "high": 73100, "low": 70900, "close": 72917 }]
```

### `GET /api/validate?symbol=BTCUSDT&timeframe=4h`

Debug endpoint for cross-checking computed indicators against TradingView. Returns raw candle data, all computed indicator values, candle progress %, and warnings about potential divergence.

```json
{
  "symbol": "BTCUSDT", "timeframe": "4h", "candleCount": 500,
  "lastClosed": { "open": 84200, "high": 85100, "low": 83900, "close": 84750, "volume": 1234.5 },
  "current":    { "open": 84750, "close": 84820, "progressPct": 62 },
  "computed":   { "ema12": 84510.7, "ema20": 84320.1, "ema50": 82100.4, "ema200": 71500.8, "rsi14": 61.4,
                  "volumeRatioPct": 138, "macdHistogram": 30.3, "priceChangePct24h": 1.75 },
  "howToVerify": ["1. Open TradingView → BTCUSDT → 4h", "2. Add EMA(12/20/50/200), RSI(14), MACD(12,26,9)", "..."],
  "warnings": ["Current candle is 62% complete — values will change at close"]
}
```

### `GET /api/symbols` / `GET /api/timeframes`

```json
["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "AVAXUSDT", "..."]
["15m", "1h", "4h", "1d", "1w"]
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

Used: EMA-12 as a short-term slope proxy, plus EMA-20 / EMA-50 / EMA-200 for trend classification and alignment.

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

### 0. Watchlist Sidebar — symbol selection and best-setup signal

**Where:** left panel.

The sidebar shows your personal watchlist with live prices and 24h change, updated every 30s.

- **⌘K** (or the search button) opens a modal to search across all configured symbols and add them to the watchlist
- Click any symbol to switch the analysis to it
- Hover a symbol to reveal the **×** button and remove it from the watchlist
- Favorites are saved in `localStorage` and persist across sessions
- The ★ scanner remains a **local timeframe** ranking: it uses the currently selected dropdown timeframe and the local `Decision` score, not `GlobalDecision`

**The star ★** appears on the symbol with the best setup at the current timeframe:
- Green ★ → best **long** setup (highest score with UP signal)
- Red ★ → best **short** setup (highest score with DOWN signal)
- Only shows when score ≥ 60 — if no symbol qualifies, no star is displayed

The star updates every 60s. After the first scan warms the cache, subsequent scans are fast.

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

The table shows EMA structure across all five timeframes (`15m`, `1h`, `4h`, `1d`, `1w`).
It now includes:

- **EMA 12** — short-term slope proxy
- **EMA 20 / 50 / 200** — structure stack
- **RSI / Volume** per timeframe
- **Alignment** — bullish, bearish, or sideways
- **MTF consensus footer** — weighted score, directional bar, action badge, and summary

| Alignment | Meaning |
|-----------|---------|
| **Bullish** (green dot) | EMA 20 > EMA 50 > EMA 200 and EMA 12 > EMA 20 |
| **Bearish** (red dot) | EMA 20 < EMA 50 < EMA 200 and EMA 12 < EMA 20 |
| **Sideways** (yellow dot) | Structure or slope is mixed |

The consensus footer uses hierarchical weights:

- `1w` = 40
- `1d` = 25
- `4h` = 15
- `1h` = 12
- `15m` = 8

This prevents lower timeframes from overwhelming the structural bias of higher ones.

The action badge summarizes what the engine thinks about the market:

- **Bom para longs** — `LONG_BIAS`
- **Bom para shorts** — `SHORT_BIAS`
- **Aguardar** — no actionable directional bias

The RSI and Volume columns still help spot divergences — e.g. higher highs with weakening RSI across multiple timeframes is a warning sign.

---

### 4. Decision Logic — local timeframe diagnosis

**Where:** top-right card.

This card is **diagnostic**, not the final signal. It changes with the dropdown timeframe and helps you inspect the selected context in detail.

It now runs a **6-step local checklist**:

| Icon | Status | Meaning |
|------|--------|---------|
| ✓ | OK (white) | Filter passed |
| ⚠ | Warn (yellow) | Marginal — proceed with reduced size |
| ✗ | Bad (red) | Filter failed — significant headwind |

**The 6 timeline steps:**

| # | Step | What it checks |
|---|------|----------------|
| 1 | **Trend Alignment** | Whether the selected timeframe agrees with weighted MTF direction |
| 2 | **Alinhamento MTF** | HTF vs LTF conflict status and consensus summary |
| 3 | **Regime** | Expansion vs equilibrium |
| 4 | **Momentum** | RSI confirmation / excess |
| 5 | **Position** | Whether price is in a tradable part of the range |
| 6 | **Volume** | Participation / confirmation |

**Score Breakdown (still 0–100) uses 5 weighted dimensions:**

| # | Filter | Max pts | Scoring |
|---|--------|---------|---------|
| 1 | **Trend Alignment** | 30 | Weighted consensus in active trend direction: `>= 60 = 30`, `>= 35 = 22`, `>= 15 = 12`, `> 0 = 5` |
| 2 | **Regime** | 20 | Expansion = 20, Equilibrium = 10 |
| 3 | **Momentum** | 15 | RSI 45–65 = 15, 35–45 or 65–75 = 10, 25–35 or 75–85 = 5, extreme = 0 |
| 4 | **Position** | 20 | Range extreme (< 25% or > 75%) = 20, mid-approach = 12, mid-range 40–60% = 0 |
| 5 | **Volume** | 15 | ≥ 130% avg = 15, ≥ 100% = 10, ≥ 70% = 5, < 70% = 0 |

The chip at the top of the card shows which timeframe you are diagnosing, so it is clear this panel is contextual to the dropdown.

---

### 5. Current Signal — stable global decision

**Where:** bottom-right card.

This card is now driven by **GlobalDecision**, not by the selected dropdown timeframe.
The dropdown can change the chart and the diagnosis cards, but it does **not** change the main signal.

The card combines:

- **Bias** — `LONG`, `SHORT`, or `NONE`
- **State** — `WAIT`, `WATCH`, or `READY`
- **Execution TF** — fixed to `1h`
- **Position size** — `0%`, `25%`, `50%`, or `100%`
- **Reasons** — consensus summary first, then execution-TF-specific constraints

| State | Bias | Meaning |
|-------|------|---------|
| **WAIT** | `NONE` | No global bias, weak consensus, or high conflict without a valid range-fade exception |
| **WATCH** | `LONG` / `SHORT` | Directional bias exists, but `1h` entry conditions are poor (mid-range or RSI extreme) |
| **WATCH** | `NONE` | High-conflict range-fade exception in equilibrium near a range extreme |
| **READY** | `LONG` / `SHORT` | Global bias is clear and the `1h` execution context is acceptable |

The label shown beside the state is driven by conviction:

- **HIGH CONVICTION** — `READY` with `conflictLevel = none`
- **LOW CONVICTION** — `READY` with `conflictLevel = low`
- **AGUARDANDO SETUP — Posição desfavorável** — bias exists, but entry quality on `1h` is not good enough
- **NO TRADE** — no actionable bias
- **LOW CONVICTION — Range apenas** — high-conflict equilibrium fade at a range extreme

This means a trader can inspect `15m`, `4h`, or `1d` in the diagnostics without losing the stable execution verdict.

#### Save Snapshot

Click **Save Snapshot** at the bottom of the card to save the current **global decision + execution context** to `localStorage` (`hsc_snapshots` key). After saving, an inline form appears to record your trade decision:

- **Long** / **Short** / **No Trade** — attached to the snapshot immediately
- **Skip** — saves the snapshot without a decision

A **60-second duplicate guard** prevents saving the same symbol + timeframe + signal twice within a minute. All snapshot data is stored locally for future journal/analytics features.

---

### Reading the Dashboard Together — Example Scenarios

**Ideal long setup:**
- Regime: Expansion ✓
- Trend: Uptrend — EMA 20 > 50 > 200 and EMA 12 > EMA 20 ✓
- Trend Monitor: `LONG_BIAS`, positive weighted score, no HTF/LTF conflict ✓
- Range: Price at 20–30% (support zone) or just broke > 100% (breakout) ✓
- Execution TF (`1h`): price position good, RSI 50–65 ✓
- MACD Histogram: positive and widening ✓
- Global Decision: **LONG / READY / HIGH CONVICTION**

**Stay out scenario:**
- Consensus: weak or conflicting
- Execution TF: mid-range or structurally poor
- Global Decision: **NONE / WAIT / NO TRADE**

**Watch but not ready:**
- Consensus: `LONG_BIAS`
- Execution TF (`1h`): mid-range or RSI overbought
- Global Decision: **LONG / WATCH / AGUARDANDO SETUP — Posição desfavorável**

**High-conflict range fade:**
- HTF bearish, LTF bullish (or the opposite)
- Market in `equilibrium`
- Execution TF near range extreme
- Global Decision: **NONE / WATCH / LOW CONVICTION — Range apenas**

---

## How to Extend

### Add a symbol or timeframe

Edit `lib/config.ts`:

```ts
export const SYMBOLS    = ["BTCUSDT", "ETHUSDT", ..., "ENAUSDT"]; // 50 symbols by default, supports up to ~500
export const TIMEFRAMES = ["15m", "1h", "4h", "1d", "1w"];
```

Symbols added here become searchable in the sidebar (⌘K). The `/api/context` batch endpoint processes them in chunks of 50, so cold-start load is safe regardless of list size. After 60s the in-memory cache covers all symbols and the best-setup scan becomes instant.

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

After running `pnpm dev`, use the validate endpoint to cross-check all computed values against TradingView in one call:

```bash
curl "http://localhost:3000/api/validate?symbol=BTCUSDT&timeframe=4h" | jq .
```

The response includes the last closed candle OHLCV, all indicator values, candle progress %, and explicit warnings if anything looks off (e.g. EMA seed depth, partial candle).

Compare `lastClosed` + `computed` values against TradingView with EMA(12/20/50/200), RSI(14), MACD(12,26,9), and Volume MA(20) enabled.

**Expected accuracy with 500 candles:**
- EMA(200): within ±0.3% of TradingView
- RSI(14): within ±0.3
- MACD histogram: within ±0.5% of value
- `priceChangePct24h`: matches Binance 24h ticker within ±0.1% (slight difference at exact 24h boundary)

---

## Engineering Notes

- **Cache and refresh:** each symbol/timeframe pair is cached in-memory for 60s. On symbol change the app reloads all five timeframes; switching only the dropdown timeframe is instant because it reuses the in-memory snapshot already loaded for that symbol.
- **Signal architecture:** `CurrentSignalCard` is driven by `computeGlobalDecision(rows, executionCtx)` with a fixed `1h` execution timeframe. `DecisionLogicCard`, `RegimeHeroCard`, `RangePositionCard`, and the chart remain local to the selected dropdown timeframe.
- **Rate limiting:** sliding window per IP — 30 req/min on market data endpoints, 10 req/min on account.
- **Batch chunking:** `/api/context` batch mode processes up to 500 symbols in chunks of 50 to avoid overwhelming Binance on cold start. After the 60s cache warms up, subsequent scans are served entirely from memory.
- **Watchlist:** favorites are persisted in `localStorage`. Ticker prices refresh every 30s via `/api/ticker` (lightweight — no candles fetched). The best-setup star scans all configured symbols every 60s in 50-symbol chunks using the active dropdown timeframe and the local `Decision` engine.
- **Tests:** unit tests cover EMA, RSI, MACD, volume normalization, market state classification, weighted MTF consensus, local decision scoring, conflict overrides, and `computeGlobalDecision`.
- **Error boundary:** `app/error.tsx` catches runtime errors and shows a recoverable error screen.
- **Journal / snapshots:** `lib/journal.ts` provides client-side localStorage helpers (`saveSnapshot`, `getSnapshots`, `updateSnapshot`, `deleteSnapshot`, `exportSnapshots`). All snapshot I/O goes through these helpers — localStorage is never called directly from components. A 60s duplicate guard prevents accidental double-saves.

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
