# HardStop - Market Context Dashboard

Real-time crypto market context dashboard built with Next.js 16, React 19, and TypeScript.

Detailed documentation, architecture notes, task tracking, and project history live in Notion:
`Leônidas / Startup / Trading Projects / Market Context Dashboard`

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://localhost:3000`.

Public market-data flows work without Binance credentials. `BINANCE_SECRET` is only required for `/api/account`.

## Scripts

- `pnpm dev` - start the dev server
- `pnpm build` - production build
- `pnpm start` - start production server
- `pnpm test` - run unit tests
- `pnpm test:watch` - run tests in watch mode
- `pnpm test:coverage` - run coverage
- `pnpm lint` - run ESLint

## Environment

- `BINANCE_API_KEY` - optional header for public Binance endpoints
- `BINANCE_SECRET` - required only for signed private requests
- `BINANCE_BASE_URL` - defaults to `https://api.binance.com`
- `CACHE_TTL_SECONDS` - defaults to `60`
- `DEFAULT_LIMIT` - defaults to `500`
- `RATE_LIMIT_RPM` - defaults to `120`

## Current Snapshot

- 5 monitored timeframes: `15m`, `1h`, `4h`, `1d`, `1w`
- 7 API routes under `app/api`
- 51 configured symbols
- Global decision engine with context, readiness, and execution guidance

## Notes

- `.env*` files are git-ignored and should never be committed.
- Use `pnpm test`, `pnpm lint`, and `pnpm build` before shipping changes.
- The Notion workspace is the source of truth for detailed project documentation.
