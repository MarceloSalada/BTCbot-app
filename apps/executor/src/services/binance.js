const axios = require('axios');
const crypto = require('crypto');
const { config } = require('../config/env');

const client = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
});

function signParams(params) {
  return crypto
    .createHmac('sha256', config.secretKey)
    .update(new URLSearchParams(params).toString())
    .digest('hex');
}

async function getServerTime() {
  const { data } = await client.get('/api/v3/time');
  return data.serverTime;
}

async function getKlines(symbol, interval, limit) {
  const { data } = await client.get('/api/v3/klines', {
    params: { symbol, interval, limit },
  });
  return data;
}

async function getTickerPrice(symbol) {
  const { data } = await client.get('/api/v3/ticker/price', {
    params: { symbol },
  });
  return Number(data.price);
}

async function getExchangeInfo(symbol) {
  const { data } = await client.get('/api/v3/exchangeInfo', {
    params: { symbol },
  });
  return data.symbols?.[0] || null;
}

async function getAccountInfo() {
  const timestamp = await getServerTime();
  const params = { timestamp };
  const signature = signParams(params);
  const { data } = await client.get('/api/v3/account', {
    params: { ...params, signature },
    headers: { 'X-MBX-APIKEY': config.apiKey },
  });
  return data;
}

async function placeMarketOrder(symbol, quantity, side) {
  const timestamp = await getServerTime();
  const params = { symbol, quantity, side, type: 'MARKET', timestamp };
  const signature = signParams(params);
  const body = new URLSearchParams({ ...params, signature }).toString();

  const { data } = await client.post('/api/v3/order', body, {
    headers: {
      'X-MBX-APIKEY': config.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return data;
}

module.exports = {
  getServerTime,
  getKlines,
  getTickerPrice,
  getExchangeInfo,
  getAccountInfo,
  placeMarketOrder,
};
