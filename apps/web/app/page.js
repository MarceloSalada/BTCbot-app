async function getConfig() {
  return {
    symbol: process.env.BOT_SYMBOL || 'BTCUSDT',
    quantity: process.env.BOT_QUANTITY || '0.001',
    timeframe: process.env.BOT_TIMEFRAME || '15m',
    short: process.env.BOT_SMA_SHORT_PERIOD || '9',
    long: process.env.BOT_SMA_LONG_PERIOD || '21',
    stop: process.env.BOT_STOP_LOSS_PCT || '1.5',
    take: process.env.BOT_TAKE_PROFIT_PCT || '3',
    dryRun: process.env.DRY_RUN || 'true',
    statusJsonUrl: process.env.STATUS_JSON_URL || '',
  };
}

const fallbackStatus = {
  updatedAt: 'aguardando bridge',
  tickerPrice: '—',
  latestClose: '—',
  previousClose: '—',
  shortSma: '—',
  longSma: '—',
  action: 'HOLD',
  reason: 'Quando a bridge estiver conectada, o painel exibirá o status salvo pelo executor.',
  inPosition: false,
  entryPrice: '—',
  realizedPnl: 0,
  forced: false,
  quantity: '—',
  estimatedNotional: '—',
  minNotionalRequired: '—',
  balances: {
    base: { asset: 'BTC', free: '—' },
    quote: { asset: 'USDT', free: '—' },
  },
};

function mergeStatus(data) {
  return {
    ...fallbackStatus,
    ...data,
    balances: {
      base: {
        ...fallbackStatus.balances.base,
        ...(data?.balances?.base || {}),
      },
      quote: {
        ...fallbackStatus.balances.quote,
        ...(data?.balances?.quote || {}),
      },
    },
  };
}

async function getStatus() {
  const url = process.env.STATUS_JSON_URL;

  if (!url) {
    return fallbackStatus;
  }

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      return {
        ...fallbackStatus,
        reason: `Bridge configurada, mas o JSON remoto respondeu HTTP ${response.status}.`,
      };
    }

    const data = await response.json();
    return mergeStatus(data);
  } catch {
    return {
      ...fallbackStatus,
      reason: 'Bridge configurada, mas o painel não conseguiu ler o JSON remoto.',
    };
  }
}

export default async function Page() {
  const config = await getConfig();
  const status = await getStatus();

  return (
    <main className="container">
      <div className="badge">BTCbot App</div>
      <h1>Painel pessoal do bot</h1>
      <p>Executor fora da Vercel. Painel web pronto para receber status do bot via bridge.</p>

      <section className="grid">
        <div className="card">
          <div className="label">Ativo</div>
          <div className="value">{config.symbol}</div>
          <div className="kv"><span>Quantidade</span><strong>{config.quantity}</strong></div>
          <div className="kv"><span>Timeframe</span><strong>{config.timeframe}</strong></div>
          <div className="kv"><span>Modo</span><strong>{config.dryRun === 'true' ? 'SEGURO' : 'REAL'}</strong></div>
        </div>

        <div className="card">
          <div className="label">Estratégia</div>
          <div className="value">SMA Cross</div>
          <div className="kv"><span>SMA curta</span><strong>{config.short}</strong></div>
          <div className="kv"><span>SMA longa</span><strong>{config.long}</strong></div>
          <div className="kv"><span>Stop loss</span><strong>{config.stop}%</strong></div>
          <div className="kv"><span>Take profit</span><strong>{config.take}%</strong></div>
        </div>

        <div className="card">
          <div className="label">Status do bot</div>
          <div className="value">{status.action}</div>
          <div className="kv"><span>Último preço</span><strong>{status.tickerPrice}</strong></div>
          <div className="kv"><span>Último fechamento</span><strong>{status.latestClose}</strong></div>
          <div className="kv"><span>Atualizado</span><strong>{status.updatedAt}</strong></div>
        </div>
      </section>

      <section className="grid" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="label">Posição</div>
          <div className="value">{status.inPosition ? 'ABERTA' : 'FECHADA'}</div>
          <div className="kv"><span>Entry price</span><strong>{status.entryPrice}</strong></div>
          <div className="kv"><span>PnL realizado</span><strong>{status.realizedPnl}</strong></div>
          <div className="kv"><span>Sinal</span><strong>{status.forced ? 'FORÇADO' : 'NORMAL'}</strong></div>
        </div>

        <div className="card">
          <div className="label">Saldo</div>
          <div className="kv"><span>{status.balances.base.asset}</span><strong>{status.balances.base.free}</strong></div>
          <div className="kv"><span>{status.balances.quote.asset}</span><strong>{status.balances.quote.free}</strong></div>
          <div className="kv"><span>Notional</span><strong>{status.estimatedNotional}</strong></div>
        </div>

        <div className="card">
          <div className="label">Bridge</div>
          <div className="kv"><span>STATUS_JSON_URL</span><strong>{config.statusJsonUrl ? 'configurada' : 'não configurada'}</strong></div>
          <div className="kv"><span>Status file</span><strong>apps/executor/status/latest-status.json</strong></div>
          <div className="kv"><span>Motivo</span><strong>{status.reason}</strong></div>
        </div>
      </section>
    </main>
  );
    }
