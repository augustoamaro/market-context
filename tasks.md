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

- [ ] **Testes** — zero cobertura. Adicionar vitest com testes unitarios para: `lib/indicators/ema.ts`, `lib/indicators/rsi.ts`, `lib/indicators/marketState.ts`, `lib/decision.ts`. Casos basicos: EMA seed correto, RSI Wilder, classificacao expansion/equilibrium, logica de sinal UP/DOWN/WAIT.

- [ ] **Error Boundary** — nenhum `ErrorBoundary` React na arvore. Se um componente lancar excecao em runtime, a pagina inteira crasha sem feedback. Criar um boundary em `app/layout.tsx`.

- [ ] **Rate limiting nas API routes** — sem throttle; um cliente pode disparar centenas de requests por segundo para `/api/context`, consumindo todas as conexoes com a Binance. Adicionar rate limiting por IP (ex: `lru-cache` + contador por janela de 1min).

- [ ] **Grafico de precos (TradingView Lightweight Charts)** — o README lista no Tech Stack mas nenhum grafico existe na UI. Considerar adicionar um sparkline ou mini chart de candles no `RegimeHeroCard` ou em card dedicado.

- [ ] **Indicador adicional: MACD ou ADX** — apenas EMA/RSI/Volume no momento. MACD adicionaria confirmacao de divergencia; ADX mediria forca da tendencia sem direcao. Util para filtrar sinais fracos em mercados laterais.

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
- [x] UI: Header, RegimeHeroCard, RangePositionCard, TrendMonitorCard, DecisionLogicCard, CurrentSignalCard, ActionsCard
- [x] API routes: /api/context, /api/symbols, /api/timeframes, /api/account
- [x] Credenciais Binance integradas: `X-MBX-APIKEY` nas requests publicas (rate limit maior), cliente HMAC-SHA256 para endpoints privados (`lib/binance/signedClient.ts`)
- [x] Card de saldo da conta (`AccountCard`) — mostra USDT/BTC/ETH/SOL/BNB disponiveis e bloqueados
- [x] Auto-refresh a cada 60s
- [x] Animacoes Framer Motion (stagger + spring)
- [x] Design system dark bento-card com Tailwind v4
- [x] Acoes: copiar resumo, abrir TradingView
- [x] Loading skeletons
- [x] Responsive grid 12-col (sidebar direito em lg+)
