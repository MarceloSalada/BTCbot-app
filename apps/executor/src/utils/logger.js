const fs = require('fs');
const path = require('path');
const { config } = require('../config/env');

const logsDir = path.resolve(process.cwd(), 'apps/executor/logs');
const logFilePath = path.join(logsDir, 'bot.log');

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function stringifyValue(value) {
  if (value === null || value === undefined) return String(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[objeto]';
    }
  }
  return String(value);
}

function buildBox(level, message, meta) {
  const header = `${new Date().toISOString()} | ${level.padEnd(5, ' ')} | ${message}`;
  const lines = [header];

  if (meta && typeof meta === 'object') {
    for (const [key, value] of Object.entries(meta)) {
      lines.push(`${key}: ${stringifyValue(value)}`);
    }
  }

  const width = Math.max(...lines.map((line) => line.length), 20);
  const top = `┌${'─'.repeat(width + 2)}┐`;
  const body = lines.map((line) => `│ ${line.padEnd(width, ' ')} │`).join('\n');
  const bottom = `└${'─'.repeat(width + 2)}┘`;

  return `${top}\n${body}\n${bottom}`;
}

function write(level, message, meta) {
  const block = buildBox(level, message, meta);
  console.log(block);

  if (config.logToFile) {
    ensureLogsDir();
    fs.appendFileSync(logFilePath, block + '\n', 'utf-8');
  }
}

module.exports = {
  info(message, meta) {
    write('INFO', message, meta);
  },
  warn(message, meta) {
    write('WARN', message, meta);
  },
  error(message, meta) {
    write('ERROR', message, meta);
  },
};
