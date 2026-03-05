# Memory

## Market Model

- `TIMEFRAMES` now includes `15m`, `1h`, `4h`, `1d`, `1w`.
- `MarketContext` includes `ema12` alongside `ema20`, `ema50`, and `ema200`.
- `MultiTFRow` also carries `ema12` so UI and decision logic use the same momentum input.

## Multi-Timeframe Consensus

- `MultiTFConsensus` summarizes weighted directional agreement across timeframes.
- Weights are hierarchical:
  - `1w`: `40`
  - `1d`: `25`
  - `4h`: `15`
  - `1h`: `12`
  - `15m`: `8`
- `weightedScore` is normalized to `-100..100` from the rows provided.
- `htfBias` is computed from `1w` + `1d`.
- `ltfBias` is computed from `1h` + `15m`.
- `recommendedAction` is `LONG_BIAS`, `SHORT_BIAS`, or `WAIT`.
- `positionSizeModifier` is `1`, `0.5`, or `0.25`.
- `conflictLevel` is:
  - `high` when HTF and LTF disagree directionally
  - `none` when the structure is aligned or fully sideways
  - `low` for partial disagreement or mixed bias

## Decision Rules

- `deriveAlignment(ema12, ema20, ema50, ema200)` still returns `bullish | bearish | sideways`.
- `ema12` is used as a slope filter: bullish requires `ema12 > ema20`, bearish requires `ema12 < ema20`.
- `computeDecision` now carries `consensus` in the `Decision` object.
- A high HTF/LTF conflict normally forces `signal = WAIT` with label `NO TRADE — Conflito HTF/LTF`.
- If high conflict happens in `equilibrium` and price is at a range extreme, the system emits `WATCH` with label `LOW CONVICTION — Range apenas`.

## Global Decision

- `GlobalDecision` is separate from `Decision`.
- `CurrentSignalCard` uses `computeGlobalDecision(rows, executionCtx)` with `executionCtx` fixed to `1h`.
- The timeframe dropdown no longer changes the primary signal; it only changes local diagnostics.
- `GlobalDecision.signal` is `WAIT | WATCH | READY`.
- `GlobalDecision.bias` is `LONG | SHORT | NONE`.
