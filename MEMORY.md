# Memory

## Market Model

- `TIMEFRAMES` now includes `15m`, `1h`, `4h`, `1d`, `1w`.
- `MarketContext` includes `ema12` alongside `ema20`, `ema50`, and `ema200`.
- `MultiTFRow` also carries `ema12` so UI and decision logic use the same momentum input.

## Multi-Timeframe Consensus

- `MultiTFConsensus` summarizes weighted directional agreement across timeframes.
- Weights are hierarchical:
  - `1w`: `40`
  - `1d`: `30`
  - `4h`: `15`
  - `1h`: `10`
  - `15m`: `5`
- `weightedScore` is normalized to `-100..100` from the rows provided.
- `htfBias` is computed from `1w` + `1d`.
- `ltfBias` is computed from `1h` + `15m`.
- `conflictLevel` is:
  - `high` when HTF and LTF disagree directionally
  - `none` when all rows are aligned bullish or bearish
  - `low` for partial disagreement, sideways mixes, or incomplete alignment

## Decision Rules

- `deriveAlignment(ema12, ema20, ema50, ema200)` still returns `bullish | bearish | sideways`.
- `ema12` is used as a momentum tie-break when the `20/50/200` stack is not clean.
- `computeDecision` now carries `consensus` in the `Decision` object.
- A high HTF/LTF conflict forces `signal = WAIT` and `label = LOW CONVICTION`.
