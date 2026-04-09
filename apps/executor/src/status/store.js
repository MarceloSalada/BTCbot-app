const fs = require('fs');
const path = require('path');

const statusDir = path.resolve(process.cwd(), 'status');
const statusFilePath = path.join(statusDir, 'latest-status.json');

function ensureStatusDir() {
  if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir, { recursive: true });
  }
}

function writeStatus(payload) {
  ensureStatusDir();
  fs.writeFileSync(statusFilePath, JSON.stringify(payload, null, 2), 'utf-8');
}

module.exports = {
  writeStatus,
  statusFilePath,
};
