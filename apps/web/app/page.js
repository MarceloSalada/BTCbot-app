function getConfig() {
  return {
    symbol: process.env.BOT_SYMBOL || 'BTCUSDT',
    quantity: process.env.BOT_QUANTITY || '0.001',
    intervalMs: process.env.BOT_INTERVAL_MS || '30000',
    timeframe: process.env.BOT_TIMEFRAME || '15m',
    smaShortPeriod: process.env.BOT_SMA_SHORT_PERIOD || '9',
    smaLongPeriod: process.env.BOT_SMA_LONG_PERIOD || '21',
    stopLossPct: process.env.BOT_STOP_LOSS_PCT || '1.5',
    takeProfitPct: process.env.BOT_TAKE_PROFIT_PCT || '3',
    dryRun: process.env.DRY_RUN || 'true',
    forceSignal: process.env.FORCE_SIGNAL || 'NONE',
  };
}

export default function Page() {
  const config = getConfig();

  return (
    <main className="container">
      <section className="hero">
        <div>
          <div className="badge">BTCbot App</div>
          <h1>Painel pessoal do bot</h1>
          <p>
            Este painel foi preparado para deploy na Vercel como camada de visualização.
            O executor continua rodando fora da Vercel.
          </p>
        </div>
        <div className="card" style={{ minWidth: 280 }}>
          <div className="label">Modo atual</div>
          <div className="value">{config.dryRun === 'true' ? 'MODO SEGURO' : 'EXECUÇÃO REAL'}</div>
          <p className="notice">Para controle remoto persistente do executor, depois vamos ligar a um storage/bridge.</p>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="label">Ativo</div>
          <div className="value">{config.symbol}</div>
          <div className="kv"><span>Quantidade</span><strong>{config.quantity}</strong></div>
          <div className="kv"><span>Timeframe</span><strong>{config.timeframe}</strong></div>
          <div className="kv"><span>Intervalo</span><strong>{config.intervalMs} ms</strong></div>
        </div>

        <div className="card">
          <div className="label">Estratégia</div>
          <div className="value">SMA Cross</div>
          <div className="kv"><span>SMA curta</span><strong>{config.smaShortPeriod}</strong></div>
          <div className="kv"><span>SMA longa</span><strong>{config.smaLongPeriod}</strong></div>
          <div className="kv"><span>Stop loss</span><strong>{config.stopLossPct}%</strong></div>
          <div className="kv"><span>Take profit</span><strong>{config.takeProfitPct}%</strong></div>
        </div>

        <div className="card">
          <div className="label">Execução</div>
          <div className="value">{config.forceSignal}</div>
          <div className="kv"><span>DRY_RUN</span><strong>{config.dryRun}</strong></div>
          <div className="kv"><span>Force signal</span><strong>{config.forceSignal}</strong></div>
          <div className="kv"><span>Executor</span><strong>apps/executor</strong></div>
        </div>
      </section>

      <section className="grid" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="label">Deploy Vercel</div>
          <div className="code">Framework: Next.js{`\n`}Root Directory: apps/web{`\n`}Build Command: npm run build{`\n`}Install Command: npm install</div>
        </div>
        <div className="card">
          <div className="label">Executor local</div>
          <div className="code">cp apps/executor/.env.example apps/executor/.env{`\n`}npm run start:executor{`\n`}npm run backtest</div>
        </div>
        <div className="card">
          <div className="label">Próxima etapa</div>
          <div className="code">Ligar o painel a um storage/bridge para controlar o executor remotamente sem editar .env manualmente.</div>
        </div>
      </section>
    </main>
  );
}
