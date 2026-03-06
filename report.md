# Relatorio de Pente Fino - HardStop Market Context

Data: 2026-03-06

## Status Atual

Validacao desta rodada:

- `pnpm test`: ok, 59 testes passando
- `pnpm lint`: ok
- `pnpm build`: no sandbox ainda falha no modo padrao do Turbopack por restricao de processo/porta
- `pnpm exec next build --webpack`: ok

Resumo direto:

- O projeto ficou mais honesto para sinal confirmado.
- O range/regime deixou de ficar preso ao proprio candle atual.
- O journal deixou de gravar `confidenceScore` errado.
- O scanner da sidebar agora usa o motor global MTF.
- O `priceChangePct` passou a usar 24h real da Binance quando disponivel.
- Ainda faltam as partes que realmente transformam contexto em edge medido: analytics de expectancy, storage server-side e ranking por edge historico.

## Backlog Por Dificuldade

### Facil

- [x] Ignorar artefatos de build de docs no lint
  - Arquivo: `eslint.config.mjs`
  - Resultado: `pnpm lint` voltou a refletir o codigo-fonte, e nao `docs/.next`

- [x] Remover dependencia de Google Font no build
  - Arquivos: `app/layout.tsx`, `app/globals.css`
  - Resultado: o app nao depende mais de fetch para `fonts.googleapis.com` em build

- [x] Corrigir o journal para nao salvar sizing como confidence
  - Arquivos: `app/components/CurrentSignalCard.tsx`, `types/market.ts`, `lib/journal.ts`
  - Resultado: snapshot agora salva `confidenceScore`, `consensusScore`, `positionSizeModifier` e `signalMode`

- [x] Limpar warning real de props/imports nao usados
  - Arquivos: `app/components/Header.tsx`, `app/page.tsx`
  - Resultado: lint limpo

### Medio

- [x] Passar o motor de contexto para candle confirmada
  - Arquivos: `lib/candles.ts`, `lib/services/marketContext.ts`, `app/api/validate/route.ts`
  - Resultado: o sinal de producao ignora candle em formacao; o `validate` mostra preview separado

- [x] Corrigir o range para breakout real contra a janela anterior
  - Arquivos: `lib/indicators/range.ts`, `lib/indicators/__tests__/range.test.ts`
  - Resultado: `pricePositionPct` agora pode passar de `100` ou cair abaixo de `0` quando houver breakout/breakdown real

- [x] Alinhar o "best setup" da sidebar ao motor global MTF
  - Arquivo principal: `app/components/Sidebar.tsx`
  - Resultado: a estrela agora considera os 5 timeframes e promove apenas setup `READY` do motor global

- [x] Trocar `priceChangePct` por 24h real
  - Arquivos principais: `lib/services/marketContext.ts`, `app/api/validate/route.ts`
  - Resultado: `priceChangePct` passou a usar ticker 24h real com fallback candle-based

- [x] Expor falhas por simbolo no batch scan
  - Arquivo principal: `app/api/context/route.ts`
  - Resultado: batch pode retornar `results + errors` e a sidebar mostra quando o scan esta parcial

### Dificil

- [ ] Log server-side de sinais e resultados
  - Objetivo: sair de `localStorage` e criar trilha auditavel

- [ ] Analytics de expectancy, profit factor, drawdown e desempenho por bucket
  - Objetivo: descobrir quais sinais realmente ganham dinheiro liquido

- [ ] Ranking por edge historico em vez de score heuristico
  - Objetivo: a estrela e os alertas passarem a refletir expectativa real

- [ ] Playbooks operacionais fechados
  - Objetivo: separar `Trend Continuation` e `Range Fade` com regras, stop e alvo coerentes

- [ ] Universo dinamico de ativos
  - Objetivo: tirar pares fracos/obsoletos e priorizar liquidez + volatilidade util

## O Que Foi Feito Nesta Rodada

### 1. Sinal de producao agora usa candle confirmada

Arquivos:

- `lib/candles.ts`
- `lib/services/marketContext.ts`
- `app/api/validate/route.ts`

Antes:

- RSI, MACD, volume e range podiam mudar no meio da candle e disparar falso positivo.

Agora:

- O contexto de producao usa apenas candles fechadas.
- A candle em formacao continua visivel no `validate`, mas so como preview.

Impacto esperado:

- menos flip de sinal
- menos entrada cedo demais
- mais confianca estatistica no `READY`

### 2. Breakout de range agora e breakout de verdade

Arquivos:

- `lib/indicators/range.ts`
- `lib/indicators/__tests__/range.test.ts`

Antes:

- o range incluia a candle atual
- com isso, `pricePositionPct > 100` ou `< 0` ficava quase impossivel

Agora:

- o fechamento atual e comparado contra a janela fechada anterior
- breakout e breakdown passaram a existir de fato no pipeline

Impacto esperado:

- `marketState` menos dependente de volume puro
- leitura de regime mais coerente com a tese do produto

### 3. O journal parou de gravar dado enganoso

Arquivos:

- `app/components/CurrentSignalCard.tsx`
- `types/market.ts`
- `lib/journal.ts`

Antes:

- `confidenceScore` era apenas `positionSizeModifier * 100`

Agora:

- `confidenceScore` reflete a forca absoluta do consenso
- `consensusScore` e salvo separadamente
- `positionSizeModifier` continua salvo, mas no campo certo
- `signalMode` tambem fica registrado

Impacto esperado:

- snapshots mais uteis para futura analise de edge
- menor risco de conclusao falsa sobre "conviccao"

### 4. Tooling ficou utilizavel para continuar evoluindo

Arquivos:

- `eslint.config.mjs`
- `app/layout.tsx`
- `app/globals.css`
- `app/components/Header.tsx`
- `app/page.tsx`

Feito:

- lint limpo
- build sem dependencia de Google Fonts
- build de producao validado com webpack

Observacao:

- o `pnpm build` padrao ainda bate em limitacao do sandbox com Turbopack (`Operation not permitted` ao criar processo/porta), mas o problema anterior de fonte remota saiu do caminho

### 5. A estrela da sidebar agora respeita o motor global

Arquivos:

- `app/components/Sidebar.tsx`
- `lib/topSetup.ts`
- `lib/__tests__/topSetup.test.ts`

Antes:

- a estrela era baseada em um unico timeframe
- isso podia destacar ativo contra o proprio viés estrutural do produto

Agora:

- o scan monta os 5 timeframes por simbolo
- o ranking usa `computeGlobalDecision()`
- somente setups `READY` entram na disputa

Impacto esperado:

- menos contradicao entre sidebar e card principal
- melhor coerencia do produto inteiro

### 6. O batch scan agora expoe falhas por simbolo

Arquivos:

- `app/api/context/route.ts`
- `types/market.ts`
- `app/components/Sidebar.tsx`

Antes:

- o batch retornava apenas sucessos
- simbolos com erro simplesmente sumiam

Agora:

- o endpoint aceita `includeMeta=1`
- a resposta pode trazer `results`, `errors`, `requestedCount`, `fulfilledCount` e `failedCount`
- a sidebar mostra quando o scan ficou parcial

Impacto esperado:

- mais transparencia operacional
- menos risco de confiar em scan incompleto sem perceber

### 7. O `priceChangePct` passou a usar 24h real da Binance

Arquivos:

- `lib/binance/client.ts`
- `app/api/ticker/route.ts`
- `app/api/context/route.ts`
- `lib/services/marketContext.ts`
- `app/api/validate/route.ts`

Antes:

- o contexto usava aproximacao por candles

Agora:

- o contexto busca ticker 24h real da Binance
- existe fallback candle-based se o ticker falhar
- o `validate` informa tambem a origem do dado

Impacto esperado:

- header e contexto com leitura mais fiel de momentum 24h
- menos diferenca entre a UI e o ticker oficial da exchange

## O Que Mais Ajuda a Ganhar Dinheiro Agora

Se eu tiver que priorizar o que falta pelo impacto economico:

1. Criar coleta historica de sinais e medir expectativa liquida por setup
2. Sair de ranking heuristico e migrar para edge historico
3. Fechar playbooks e universo de ativos com base em desempenho real

A formula mais proxima da "formula magica", dentro do produto atual, continua sendo:

`sinal confirmado + breakout real + alinhamento MTF + execucao fora do mid-range + analytics de expectancy`

## Proxima Sequencia Recomendada

### Bloco 1

- salvar sinais server-side
- calcular retorno futuro em `+1h`, `+4h`, `+24h`
- incluir fees e slippage

### Bloco 2

- construir ranking por expectancy
- separar playbooks
- medir desempenho por regime, bias e range position

### Bloco 3

- restringir universo aos ativos que realmente prestam para o metodo
- automatizar exclusao de pares fracos
- priorizar liquidez e volatilidade util

## Conclusao

O projeto saiu de um estado "bom para leitura de contexto, mas vulneravel a falso positivo" para um estado melhor e mais consistente com a ideia de sinal operacional.

Ainda nao existe edge provado. O que existe agora e uma base melhor para provar edge.

O gargalo principal deixou de ser engenharia basica e passou a ser produto quantitativo:

- medir resultado
- rankear por expectativa
- parar de promover setup que parece bonito, mas nao paga no historico
