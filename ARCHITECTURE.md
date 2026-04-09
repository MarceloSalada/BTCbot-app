# BTCbot-app Architecture

## Estrutura

```bash
BTCbot-app/
  apps/
    web/
    executor/
  packages/
    core/
```

## Responsabilidades

### apps/web
Painel em Next.js para deploy na Vercel.

### apps/executor
Executor do bot em Node.js para rodar em Termux, VPS ou máquina local.

### packages/core
Estratégia, regras de risco e utilitários compartilhados.

## Fluxo operacional

1. o executor lê mercado e saldo na Binance
2. o core gera sinal
3. o executor valida saldo, notional e risco
4. o executor envia ordem ou registra dry-run
5. o painel web exibe a configuração pública e a arquitetura de uso

## Observação importante

O painel web ainda não controla remotamente o executor de forma persistente.
Essa etapa vai exigir um storage/bridge adicional.
