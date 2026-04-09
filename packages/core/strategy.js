function calcSMA(closes, period) {
  if (!Array.isArray(closes) || closes.length < period) {
    throw new Error(`Dados insuficientes para SMA ${period}`);
  }

  const slice = closes.slice(-period);
  const sum = slice.reduce((acc, value) => acc + Number(value), 0);
  return sum / slice.length;
}

function buildSignal({ closes, shortPeriod, longPeriod, inPosition, entryPrice, stopLossPct, takeProfitPct }) {
  if (closes.length < longPeriod + 2) {
    throw new Error("Dados insuficientes para gerar sinal.");
  }

  const currentShort = calcSMA(closes.slice(0, -1), shortPeriod);
  const previousShort = calcSMA(closes.slice(0, -2), shortPeriod);
  const currentLong = calcSMA(closes.slice(0, -1), longPeriod);
  const previousLong = calcSMA(closes.slice(0, -2), longPeriod);

  const latestClose = Number(closes[closes.length - 2]);
  const previousClose = Number(closes[closes.length - 3]);

  const crossedUp = previousShort <= previousLong && currentShort > currentLong;
  const crossedDown = previousShort >= previousLong && currentShort < currentLong;

  let action = "HOLD";
  let reason = "Sem cruzamento válido.";

  if (inPosition && entryPrice) {
    const stopPrice = entryPrice * (1 - stopLossPct / 100);
    const takePrice = entryPrice * (1 + takeProfitPct / 100);

    if (latestClose <= stopPrice) {
      action = "SELL";
      reason = `Stop loss acionado em ${stopLossPct}% abaixo da entrada.`;
    } else if (latestClose >= takePrice) {
      action = "SELL";
      reason = `Take profit acionado em ${takeProfitPct}% acima da entrada.`;
    }
  }

  if (action === "HOLD") {
    if (!inPosition && crossedUp) {
      action = "BUY";
      reason = "SMA curta cruzou acima da SMA longa no candle fechado.";
    } else if (inPosition && crossedDown) {
      action = "SELL";
      reason = "SMA curta cruzou abaixo da SMA longa no candle fechado.";
    }
  }

  return {
    action,
    reason,
    latestClose,
    previousClose,
    shortSma: currentShort,
    longSma: currentLong,
  };
}

module.exports = {
  calcSMA,
  buildSignal,
};
