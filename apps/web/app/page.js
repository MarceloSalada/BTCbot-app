export default function Page() {
  const config = {
    symbol: process.env.BOT_SYMBOL || 'BTCUSDT',
    quantity: process.env.BOT_QUANTITY || '0.001',
    timeframe: process.env.BOT_TIMEFRAME || '15m',
    short: process.env.BOT_SMA_SHORT_PERIOD || '9',
    long: process.env.BOT_SMA_LONG_PERIOD || '21',
    stop: process.env.BOT_STOP_LOSS_PCT || '1.5',
    take: process.env.BOT_TAKE_PROFIT_PCT || '3',
    dryRun: process.env.DRY_RUN || 'true',
  };

  return (
    <main className="container">
      <div className="badge">BTCbot App</div>
      <h1>Painel pessoal do bot</h1>
      <p>Executor fora da Vercel. Painel web pronto para deploy.</p>
      <section className="grid">
        <div className="card">
          <div className="label">Ativo</div>
          <div className="value">{config.symbol}</div>
          <div className="kv"><span>Quantidade</span><strong>{config.quantity}</strong></div>
          <div className="kv"><span>Timeframe</span><strong>{config.timeframe}</strong></div>
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
          <div className="label">Modo</div>
          <div className="value">{config.dryRun === 'true' ? 'SEGURO' : 'REAL'}</div>
        </div>
      </section>
    </main>
  );
}
