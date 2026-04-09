const { buildSignal, canBuy, canSell, computePnl } = require('@btcbot/core');
const { config, validateConfig } = require('./config/env');
const logger = require('./utils/logger');
const { loadState, saveState } = require('./state/store');
const {
  getKlines,
  getTickerPrice,
  getExchangeInfo,
  getAccountInfo,
  placeMarketOrder,
} = require('./services/binance');

let isProcessing = false;
let exchangeInfoCache = null;

function parseForceSignal(state) {
  const normalized = String(config.forceSignal || 'NONE').toUpperCase();

  if (normalized === 'NONE') {
    if (state.forceSignalConsumed) state.forceSignalConsumed = false;
    return null;
  }

  if (config.forceSignalOnce && state.forceSignalConsumed) return null;
  return normalized;
}

function extractBalances(accountInfo, baseAsset, quoteAsset) {
  const balances = new Map((accountInfo?.balances || []).map((item) => [item.asset, item]));
  const base = balances.get(baseAsset) || { free: '0', locked: '0' };
  const quote = balances.get(quoteAsset) || { free: '0', locked: '0' };

  return {
    base: { asset: baseAsset, free: Number(base.free), locked: Number(base.locked) },
    quote: { asset: quoteAsset, free: Number(quote.free), locked: Number(quote.locked) },
  };
}

function normalizeQuantity(rawQuantity, lotSizeFilter) {
  if (!lotSizeFilter) {
    return { quantity: String(rawQuantity), quantityNumber: Number(rawQuantity) };
  }

  const stepSize = Number(lotSizeFilter.stepSize);
  const minQty = Number(lotSizeFilter.minQty);
  const maxQty = Number(lotSizeFilter.maxQty);
  const requested = Number(rawQuantity);
  const decimals = String(lotSizeFilter.stepSize).includes('.')
    ? String(lotSizeFilter.stepSize).split('.')[1].replace(/0+$/, '').length
    : 0;

  const floored = Math.floor(requested / stepSize) * stepSize;
  const bounded = Math.max(minQty, Math.min(maxQty, floored));
  const quantityNumber = Number(bounded.toFixed(decimals));

  return {
    quantity: quantityNumber.toFixed(decimals),
    quantityNumber,
  };
}

async function bootstrap() {
  validateConfig();
  exchangeInfoCache = await getExchangeInfo(config.symbol);
  const accountInfo = await getAccountInfo();
  const balances = extractBalances(accountInfo, exchangeInfoCache.baseAsset, exchangeInfoCache.quoteAsset);
  const tickerPrice = await getTickerPrice(config.symbol);

  logger.info('Executor inicializado', {
    symbol: config.symbol,
    timeframe: config.timeframe,
    intervalMs: config.intervalMs,
    smaShortPeriod: config.smaShortPeriod,
    smaLongPeriod: config.smaLongPeriod,
    stopLossPct: config.stopLossPct,
    takeProfitPct: config.takeProfitPct,
    dryRun: config.dryRun,
    forceSignal: config.forceSignal,
    baseBalance: balances.base.free,
    quoteBalance: balances.quote.free,
    currentTickerPrice: tickerPrice,
  });
}

async function executeCycle() {
  if (isProcessing) {
    logger.warn('Ciclo ignorado porque ainda existe processamento em andamento.');
    return;
  }

  isProcessing = true;

  try {
    const state = loadState();
    const klines = await getKlines(config.symbol, config.timeframe, Math.max(config.smaLongPeriod + 5, 60));
    const closes = klines.map((candle) => Number(candle[4]));
    const tickerPrice = await getTickerPrice(config.symbol);
    const accountInfo = await getAccountInfo();
    const balances = extractBalances(accountInfo, exchangeInfoCache.baseAsset, exchangeInfoCache.quoteAsset);

    const baseSignal = buildSignal({
      closes,
      shortPeriod: config.smaShortPeriod,
      longPeriod: config.smaLongPeriod,
      inPosition: state.inPosition,
      entryPrice: state.entryPrice,
      stopLossPct: config.stopLossPct,
      takeProfitPct: config.takeProfitPct,
    });

    const forced = parseForceSignal(state);
    const signal = forced
      ? {
          ...baseSignal,
          action: forced,
          reason: `Sinal forçado manualmente via .env (${forced}).`,
          forced: true,
        }
      : { ...baseSignal, forced: false };

    const lotSizeFilter = exchangeInfoCache?.filters?.find((item) => item.filterType === 'LOT_SIZE') || null;
    const notionalFilter =
      exchangeInfoCache?.filters?.find((item) => item.filterType === 'NOTIONAL') ||
      exchangeInfoCache?.filters?.find((item) => item.filterType === 'MIN_NOTIONAL') ||
      null;

    const normalized = normalizeQuantity(config.quantity, lotSizeFilter);
    const estimatedNotional = Number((signal.latestClose * normalized.quantityNumber).toFixed(2));
    const minNotional = Number(notionalFilter?.minNotional || notionalFilter?.notional || 0);

    logger.info('Leitura de mercado', {
      tickerPrice,
      latestClose: signal.latestClose,
      previousClose: signal.previousClose,
      shortSma: Number(signal.shortSma.toFixed(2)),
      longSma: Number(signal.longSma.toFixed(2)),
      action: signal.action,
      reason: signal.reason,
      forced: signal.forced,
      inPosition: state.inPosition,
      entryPrice: state.entryPrice,
      requestedQuantity: config.quantity,
      normalizedQuantity: normalized.quantity,
      estimatedNotional,
      minNotionalRequired: minNotional,
    });

    if (signal.action === 'HOLD') {
      state.lastPrice = signal.latestClose;
      state.lastSignal = signal.action;
      saveState(state);
      return;
    }

    if (estimatedNotional < minNotional) {
      logger.warn('Ordem bloqueada por notional insuficiente.', {
        estimatedNotional,
        minNotionalRequired: minNotional,
      });
      return;
    }

    if (signal.action === 'BUY') {
      const balanceCheck = canBuy(balances.quote.free, estimatedNotional);
      if (!balanceCheck.ok) {
        logger.warn('Compra bloqueada por saldo insuficiente de USDT.', balanceCheck);
        return;
      }
    }

    if (signal.action === 'SELL') {
      const balanceCheck = canSell(balances.base.free, normalized.quantityNumber);
      if (!balanceCheck.ok) {
        logger.warn('Venda bloqueada por saldo insuficiente de BTC.', balanceCheck);
        return;
      }
    }

    if (config.dryRun) {
      logger.warn('DRY_RUN ativo: nenhuma ordem real foi enviada.', {
        intendedAction: signal.action,
        forced: signal.forced,
        normalizedQuantity: normalized.quantity,
      });
    } else {
      const order = await placeMarketOrder(config.symbol, normalized.quantity, signal.action);
      logger.info('Ordem executada', {
        orderId: order.orderId,
        side: order.side,
        status: order.status,
        executedQty: order.executedQty,
        transactTime: order.transactTime,
        forced: signal.forced,
      });
    }

    if (signal.action === 'BUY') {
      state.inPosition = true;
      state.entryPrice = signal.latestClose;
    } else {
      state.inPosition = false;
      if (state.entryPrice) {
        state.realizedPnl = Number((state.realizedPnl + computePnl(state.entryPrice, signal.latestClose, normalized.quantityNumber)).toFixed(8));
      }
      state.entryPrice = null;
    }

    state.lastSide = signal.action;
    state.lastOrderAt = new Date().toISOString();
    state.lastPrice = signal.latestClose;
    state.lastSignal = signal.action;
    state.lastQuantity = normalized.quantity;
    state.lastNotional = estimatedNotional;

    if (signal.forced && config.forceSignalOnce) {
      state.forceSignalConsumed = true;
    }

    saveState(state);
  } catch (error) {
    logger.error('Erro no executor', {
      message: error?.message,
      response: error?.response?.data || null,
    });
  } finally {
    isProcessing = false;
  }
}

async function main() {
  try {
    await bootstrap();
    await executeCycle();
    setInterval(executeCycle, config.intervalMs);
  } catch (error) {
    logger.error('Falha ao iniciar o executor', {
      message: error?.message,
      response: error?.response?.data || null,
    });
    process.exit(1);
  }
}

main();
