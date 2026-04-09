function canBuy(quoteFree, requiredNotional) {
  return {
    ok: Number(quoteFree) >= Number(requiredNotional),
    free: Number(quoteFree),
    required: Number(requiredNotional),
  };
}

function canSell(baseFree, requiredQuantity) {
  return {
    ok: Number(baseFree) >= Number(requiredQuantity),
    free: Number(baseFree),
    required: Number(requiredQuantity),
  };
}

function computePnl(entryPrice, exitPrice, quantity) {
  return Number(((Number(exitPrice) - Number(entryPrice)) * Number(quantity)).toFixed(8));
}

module.exports = {
  canBuy,
  canSell,
  computePnl,
};
