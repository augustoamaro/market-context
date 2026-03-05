# Tasks — Market Context Dashboard

## Status: Core funcionality complete and working

---

## Bugs / Correcoes

- [x] **`.env.example` ausente** — criado com todas as variaveis documentadas; `.gitignore` atualizado para nao ignorar o arquivo de exemplo.

- [x] **Endpoint batch nao implementado** — `app/api/context/route.ts` agora suporta `?symbols=BTCUSDT,ETHUSDT&timeframe=4h`; falhas individuais usam `Promise.allSettled` e nao abortam os demais.

- [x] **`Promise.all` falha tudo ou nada** — trocado por `Promise.allSettled` em `app/page.tsx`; dados parciais sao exibidos quando um TF nao carrega.

- [x] **README desatualizado** — secao "Project Structure" reescrita com os componentes e arquivos reais.

- [x] **`timeframe` change nao atualiza `activeCtx`** — `load` removeu `timeframe` das suas deps; todos os contextos sao guardados em `allContexts`; troca de timeframe deriva `activeCtx` do cache instantaneamente sem nova chamada de rede.

---

## Features Faltando

- [x] **Testes** — vitest configurado (`vitest.config.ts`); 38 testes passando em 5 arquivos: `ema`, `rsi`, `macd`, `marketState`, `decision`. Scripts: `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`.

- [x] **Error Boundary** — `app/error.tsx` criado com o padrao Next.js App Router; captura excecoes em runtime e exibe pagina de erro com botao "Try again".

- [x] **Rate limiting nas API routes** — `lib/rateLimit.ts` com sliding window em memoria (30 req/min para `/api/context` e `/api/candles`, 10 req/min para `/api/account`). Retorna HTTP 429 ao exceder.

- [x] **Grafico de precos (TradingView Lightweight Charts)** — `lightweight-charts` instalado; endpoint `GET /api/candles` criado; `CandleChart.tsx` com candlesticks coloridos (verde/vermelho) adicionado na coluna esquerda abaixo da tabela multi-timeframe.

- [x] **Indicador adicional: MACD** — `lib/indicators/macd.ts` implementado (EMA12-EMA26, signal EMA9, histogram); campos `macdLine`, `macdSignal`, `macdHistogram` adicionados ao `MarketContext`; histogram exibido no `RegimeHeroCard` em verde/vermelho.

---

## Melhorias / Quality of Life

- [ ] **Alertas de mudanca de sinal** — nenhuma notificacao quando o sinal muda de UP para DOWN ou de WAIT para UP entre refreshes. Implementar com `Notification API` do browser ou um badge piscante no header.

- [ ] **Historico de sinais (sessao)** — os sinais se perdem a cada refresh. Armazenar os ultimos N sinais em `sessionStorage` ou estado React para mostrar "ultimo sinal: UP as 14:32".

- [ ] **Simbolos customizados** — lista hardcoded em 4 pares. Adicionar input no Header para o usuario digitar qualquer par Binance (ex: `XRPUSDT`, `AVAXUSDT`). Validar contra `/api/symbols` ou direto na Binance.

- [ ] **Layout mobile** — colunas EMA (20/50/200) ocultas em mobile na `TrendMonitorCard`. Considerar card colapsavel ou visualizacao alternativa no mobile em vez de tabela.

- [ ] **Deploy / infra** — sem `Dockerfile`, `.dockerignore`, ou config Vercel. Adicionar pelo menos um `Dockerfile` multi-stage para self-hosting, ou `vercel.json` com as variaveis de ambiente documentadas.

- [ ] **`lib/indicators/trend.ts`** — o README menciona este arquivo mas a logica de trend esta inline em `lib/services/marketContext.ts:35-37`. Extrair para arquivo dedicado para manter consistencia com a arquitetura descrita.

---

## Concluido

- [x] Next.js App Router + TypeScript
- [x] Binance OHLCV client com cache em memoria (60s TTL)
- [x] Indicadores: EMA(20/50/200), RSI(14), Volume Ratio, Price Range
- [x] Classificacao de regime: expansion / equilibrium
- [x] Motor de decisao: 4 steps + sinal (UP/DOWN/WAIT) + conviction score
- [x] Multi-timeframe (15m/1h/4h/1d) em paralelo
- [x] UI: Header, RegimeHeroCard, RangePositionCard, TrendMonitorCard, DecisionLogicCard, CurrentSignalCard, CandleChart
- [x] API routes: /api/context, /api/symbols, /api/timeframes, /api/account
- [x] Credenciais Binance integradas: `X-MBX-APIKEY` nas requests publicas (rate limit maior), cliente HMAC-SHA256 para endpoints privados (`lib/binance/signedClient.ts`)
- [x] Credenciais Binance usadas para rate limits maiores nas requests publicas
- [x] Auto-refresh a cada 60s
- [x] Animacoes Framer Motion (stagger + spring)
- [x] Design system dark bento-card com Tailwind v4
- [x] Acoes: copiar resumo, abrir TradingView
- [x] Loading skeletons
- [x] Responsive grid 12-col (sidebar direito em lg+)
