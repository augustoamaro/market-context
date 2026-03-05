# tasks2.md — README Polish & Repository Credibility

## Goal
Make the repository more **GitHub / recruiter friendly** with clearer setup,
better credibility, and fewer "reviewer red flags".

---

## P0 — Must-have (high impact)

### [x] Add screenshots / preview section

- Capture `public/preview.png` (or `docs/preview.png`) from the running app
- Add a `## Preview` section near the top of README, before Quick Start
- Optionally add a short GIF `public/demo.gif` showing timeframe switching or signal changing

Status: `public/preview.png` was added as an illustrative preview image and wired in README.

**Acceptance**
- README renders image correctly on GitHub
- Preview appears before the Quick Start section

---

### [x] Clarify Binance authentication requirements

Current situation: the README implies both `BINANCE_API_KEY` and `BINANCE_SECRET` are
needed. In practice:

- Public OHLCV endpoints (`/api/context`, `/api/candles`) work without any key
- `BINANCE_API_KEY` is optional — it adds the `X-MBX-APIKEY` header to public
  requests, which gives higher rate limits per-key instead of per-IP
- `BINANCE_SECRET` is only needed for HMAC-signed private endpoints. The signed
  client (`lib/binance/signedClient.ts`) and `/api/account` route exist in the
  codebase but the account card is not rendered in the UI by default.

**Tasks**
- Update env var table to distinguish required vs optional
- Add a note explaining the `BINANCE_SECRET` is for future private endpoint usage
  and is not required to run the dashboard

**Acceptance**
- A user with no Binance account can clone and run the app against public data
- Env var table clearly labels what is Required / Optional

---

### [x] Add Requirements section

Add a `## Requirements` section before Quick Start:

```
- Node.js >= 20
- pnpm >= 9 (npm install -g pnpm)
```

**Acceptance**
- A new developer can run the project without guessing required versions

---

### [x] Add Scripts section

Add `## Scripts` listing all commands from `package.json`:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server at localhost:3000 |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run all 38 unit tests (vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with v8 coverage report |
| `pnpm lint` | Run ESLint |

**Acceptance**
- README lists all supported scripts and their purpose

---

### [x] Add Security note for credentials

Add `## Security` section:

- Never commit `.env` (already in `.gitignore` via `.env*` pattern)
- `.env.local` works as an alternative — Next.js loads it automatically and it
  is also git-ignored
- `BINANCE_API_KEY` gives read-only market data access — low risk if exposed,
  but rotate it if leaked
- `BINANCE_SECRET` is highly sensitive — it can sign private requests. Do not
  log it, do not embed it in client-side code, do not commit it.

**Acceptance**
- README has explicit guidance about what each credential can do if leaked

---

### [x] Add LICENSE file

- Create `LICENSE` (MIT recommended for portfolio visibility)
- Add `## License` section at the bottom of README

**Acceptance**
- GitHub automatically detects the license and shows the badge on the repo page
- README references the license

---

## P1 — Nice-to-have (portfolio boost)

### [x] Add Deploy note

Add a `## Deploy` section:

- This is a standard Next.js app — deploy to Vercel with zero config
- All Binance calls are server-side (API routes), so no CORS issues
- Set env vars in Vercel project settings
- Note: free Vercel plan has 10s function timeout — fine for cached requests,
  may be tight on cold start with 300 candles × 4 timeframes

**Acceptance**
- README explains how to deploy (or why you chose local-only)

---

### [x] Add Roadmap section

Add `## Roadmap` with realistic next steps:

- [ ] WebSocket streaming for real-time price + volume updates (replace 60s poll)
- [ ] Signal change alerts via browser Notification API or Telegram webhook
- [ ] Custom symbol input — allow any Binance pair beyond the 4 hardcoded ones
- [ ] Persisted cache with Redis (survive server restarts, share across instances)
- [ ] Additional regime indicators: ATR-based volatility, Bollinger Band width
- [ ] Multi-exchange support (Bybit, OKX) via adapter pattern

**Acceptance**
- Roadmap is concise (max 6 bullets) and grounded in the existing architecture

---

### [x] Verify Confidence Score explanation is clear

The Trader's Guide in README already covers this. Review and confirm:

- Score is a heuristic (0–100), not a statistical probability
- 0 = NO TRADE (auto-blocked), 20 = WAIT (mixed signals),
  40–60 = LOW CONVICTION, 75–95 = HIGH CONVICTION
- Driven by how many of the 4 decision steps return `ok` vs `warn` vs `bad`

If the existing explanation is already clear enough, mark as done.

**Acceptance**
- No ambiguity about what the score represents for any reader

---

### [x] Add README badges

At top of README add a tasteful row of shields (max 4):

```md
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tests](https://img.shields.io/badge/tests-38%20passing-brightgreen?logo=vitest)
![License](https://img.shields.io/badge/license-MIT-green)
```

**Acceptance**
- Badges render correctly on GitHub
- They do not clutter — 3 to 4 maximum

---

## P2 — Optional / future hardening

### [x] Add CI workflow for tests

Add `.github/workflows/ci.yml`:

```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm test
```

**Acceptance**
- Every push shows green/red test status on GitHub
- PRs are gated on passing tests

---

### [ ] Add OpenAPI spec (optional)

Document the public API routes in `docs/openapi.json` or `openapi.yaml`:

- `GET /api/context` (single + batch)
- `GET /api/candles`
- `GET /api/symbols`
- `GET /api/timeframes`

**Acceptance**
- Spec can be imported into Postman or rendered via Swagger UI

---

## Notes

- Keep README top section short: **what it is → preview → requirements → quick start**
- Deep technical content (indicator math, trader guide) stays below the fold
- Avoid implying credentials are required to run — the app works with zero config
  against public Binance data
