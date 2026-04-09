const fs = require('fs');
const axios = require('axios');
const { statusFilePath } = require('../status/store');

let lastPublishedHash = null;

function getEnv() {
  return {
    mode: String(process.env.STATUS_PUBLISH_MODE || 'none').toLowerCase(),
    publicUrl: process.env.STATUS_PUBLIC_URL || '',
    gistId: process.env.GITHUB_GIST_ID || '',
    gistToken: process.env.GITHUB_GIST_TOKEN || '',
    gistFilename: process.env.GIST_FILENAME || 'latest-status.json',
  };
}

function hashContent(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i += 1) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

async function publishToGist(content, env) {
  await axios.patch(
    `https://api.github.com/gists/${env.gistId}`,
    {
      files: {
        [env.gistFilename]: {
          content,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${env.gistToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      timeout: 10000,
    },
  );
}

async function publishLatestStatus(logger) {
  const env = getEnv();

  if (env.mode === 'none') {
    return { ok: true, skipped: true, reason: 'publish desativado' };
  }

  if (!fs.existsSync(statusFilePath)) {
    return { ok: false, skipped: true, reason: 'arquivo de status ainda não existe' };
  }

  const content = fs.readFileSync(statusFilePath, 'utf-8');
  const contentHash = hashContent(content);

  if (contentHash === lastPublishedHash) {
    return { ok: true, skipped: true, reason: 'status sem mudanças' };
  }

  try {
    if (env.mode === 'github_gist') {
      if (!env.gistId || !env.gistToken) {
        return { ok: false, skipped: true, reason: 'faltam GITHUB_GIST_ID ou GITHUB_GIST_TOKEN' };
      }

      await publishToGist(content, env);
      lastPublishedHash = contentHash;

      return {
        ok: true,
        skipped: false,
        mode: env.mode,
        publicUrl: env.publicUrl || '',
      };
    }

    return { ok: false, skipped: true, reason: `modo não suportado: ${env.mode}` };
  } catch (error) {
    if (logger) {
      logger.warn('Falha ao publicar status remoto.', {
        mode: env.mode,
        message: error?.message,
        response: error?.response?.data || null,
      });
    }

    return {
      ok: false,
      skipped: false,
      reason: error?.message || 'erro desconhecido ao publicar status',
    };
  }
}

module.exports = {
  publishLatestStatus,
};
