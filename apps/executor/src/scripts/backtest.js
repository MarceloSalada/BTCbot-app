const { buildSignal, computePnl } = require('@btcbot/core');
const { config } = require('../config/env');
const { getKlines } = require('../services/binance');

async function run() {
  const klines = await getKlines(config.symbol, config.timeframe, 300);
  const closes = klines.map((candle) => Number(candle[4]));

  let inPosition = false;
  let entryPrice = null;
  let trades = 0;
  let wins = 0;
  let losses = 0;
  let realizedPnl = 0;

  for (let i = config.smaLongPeriod + 5; i < closes.length; i += 1) {
    const window = closes.slice(0, i + 1);
    const signal = buildSignal({
      closes: window,
      shortPeriod: config.smaShortPeriod,
      longPeriod: config.smaLongPeriod,
      inPosition,
      entryPrice,
      stopLossPct: config.stopLossPct,
      takeProfitPct: config.takeProfitPct,
    });

    if (!inPosition && signal.action === 'BUY') {
      inPosition = true;
      entryPrice = signal.latestClose;
      trades += 1;
    } else if (inPosition && signal.action === 'SELL') {
      const pnl = computePnl(entryPrice, signal.latestClose, 1);
      realizedPnl += pnl;
      if (pnl >= 0) wins += 1;
      else losses += 1;
      inPosition = false;
      entryPrice = null;
    }
  }

  console.log('=== BACKTEST RESUMO ===');
  console.log(`Ativo: ${config.symbol}`);
  console.log(`Timeframe: ${config.timeframe}`);
  console.log(`SMA curta: ${config.smaShortPeriod}`);
  console.log(`SMA longa: ${config.smaLongPeriod}`);
  console.log(`Stop loss %: ${config.stopLossPct}`);
  console.log(`Take profit %: ${config.takeProfitPct}`);
  console.log(`Trades: ${trades}`);
  console.log(`Wins: ${wins}`);
  console.log(`Losses: ${losses}`);
  console.log(`PnL bruto por unidade: ${realizedPnl.toFixed(2)}`);
}

run().catch((error) => {
  console.error('Falha no backtest', error?.message || error);
  process.exit(1);
});
