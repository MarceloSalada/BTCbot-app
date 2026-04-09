# Setup

## Instalação raiz

```bash
npm install
```

## Executor

```bash
cp apps/executor/.env.example apps/executor/.env
npm run start:executor
```

## Backtest

```bash
npm run backtest
```

## Painel web local

```bash
npm run dev:web
```

## Deploy na Vercel

- Importar o repositório no GitHub
- Root Directory: `apps/web`
- Framework: Next.js
- Install Command: `npm install`
- Build Command: `npm run build`

## Variáveis principais do executor

- `BOT_SYMBOL`
- `BOT_QUANTITY`
- `BOT_TIMEFRAME`
- `BOT_SMA_SHORT_PERIOD`
- `BOT_SMA_LONG_PERIOD`
- `BOT_STOP_LOSS_PCT`
- `BOT_TAKE_PROFIT_PCT`
- `DRY_RUN`
- `FORCE_SIGNAL`
