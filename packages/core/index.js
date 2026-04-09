const { calcSMA, buildSignal } = require('./strategy');
const { canBuy, canSell, computePnl } = require('./risk');

module.exports = {
  calcSMA,
  buildSignal,
  canBuy,
  canSell,
  computePnl,
};
