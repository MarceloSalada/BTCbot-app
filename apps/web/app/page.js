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

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function getActionTone(action) {
  if (action === 'BUY') return 'tone-buy';
  if (action === 'SELL') return 'tone-sell';
  return 'tone-hold';
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
  const actionTone = getActionTone(status.action);

  return (
    <main className="container">
      <section className="hero">
        <div>
          <div className="badge">BTCbot App</div>
          <h1 className="hero-title">Painel operacional</h1>
          <p className="hero-copy">
            Visual renovado com leitura rápida para preço, posição, estratégia e status da bridge.
          </p>
        </div>

        <div className={`hero-status ${actionTone}`}>
          <span className="hero-status-label">Status atual</span>
          <strong>{status.action}</strong>
          <small>{status.forced ? 'Sinal forçado manualmente' : 'Sinal normal da estratégia'}</small>
        </div>
      </section>

      <section className="grid grid-primary">
        <div className="card metric-card metric-card-wide">
          <div className="label">Preço atual</div>
          <div className="metric-main">{formatValue(status.tickerPrice)}</div>
          <div className="metric-subgrid">
            <div className="metric-chip">
              <span>Último fechamento</span>
              <strong>{formatValue(status.latestClose)}</strong>
            </div>
            <div className="metric-chip">
              <span>Fechamento anterior</span>
              <strong>{formatValue(status.previousClose)}</strong>
            </div>
            <div className="metric-chip">
              <span>Atualizado</span>
              <strong>{formatValue(status.updatedAt)}</strong>
            </div>
          </div>
        </div>

        <div className={`card signal-card ${actionTone}`}>
          <div className="label">Sinal do bot</div>
          <div className="signal-value">{status.action}</div>
          <p className="signal-reason">{formatValue(status.reason)}</p>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="section-title">Configuração</div>
          <div className="kv"><span>Ativo</span><strong>{config.symbol}</strong></div>
          <div className="kv"><span>Quantidade</span><strong>{config.quantity}</strong></div>
          <div className="kv"><span>Timeframe</span><strong>{config.timeframe}</strong></div>
          <div className="kv"><span>Modo</span><strong>{config.dryRun === 'true' ? 'SEGURO' : 'REAL'}</strong></div>
        </div>

        <div className="card">
          <div className="section-title">Estratégia SMA</div>
          <div className="kv"><span>SMA curta</span><strong>{config.short}</strong></div>
          <div className="kv"><span>SMA longa</span><strong>{config.long}</strong></div>
          <div className="kv"><span>Leitura SMA curta</span><strong>{formatValue(status.shortSma)}</strong></div>
          <div className="kv"><span>Leitura SMA longa</span><strong>{formatValue(status.longSma)}</strong></div>
          <div className="kv"><span>Stop loss</span><strong>{config.stop}%</strong></div>
          <div className="kv"><span>Take profit</span><strong>{config.take}%</strong></div>
        </div>

        <div className="card">
          <div className="section-title">Posição</div>
          <div className="kv"><span>Status</span><strong>{status.inPosition ? 'ABERTA' : 'FECHADA'}</strong></div>
          <div className="kv"><span>Preço de entrada</span><strong>{formatValue(status.entryPrice)}</strong></div>
          <div className="kv"><span>PnL realizado</span><strong>{formatValue(status.realizedPnl)}</strong></div>
          <div className="kv"><span>Tipo de sinal</span><strong>{status.forced ? 'FORÇADO' : 'NORMAL'}</strong></div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="section-title">Saldo</div>
          <div className="kv"><span>{status.balances.base.asset}</span><strong>{formatValue(status.balances.base.free)}</strong></div>
          <div className="kv"><span>{status.balances.quote.asset}</span><strong>{formatValue(status.balances.quote.free)}</strong></div>
          <div className="kv"><span>Notional estimado</span><strong>{formatValue(status.estimatedNotional)}</strong></div>
          <div className="kv"><span>Notional mínimo</span><strong>{formatValue(status.minNotionalRequired)}</strong></div>
        </div>

        <div className="card">
          <div className="section-title">Bridge</div>
          <div className="kv"><span>STATUS_JSON_URL</span><strong>{config.statusJsonUrl ? 'configurada' : 'não configurada'}</strong></div>
          <div className="kv"><span>Status local</span><strong>apps/executor/status/latest-status.json</strong></div>
          <div className="kv"><span>Mensagem</span><strong>{formatValue(status.reason)}</strong></div>
        </div>
      </section>
    </main>
  );
}
