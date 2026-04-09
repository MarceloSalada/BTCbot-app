# Bridge Setup

## Objetivo

Levar o arquivo `apps/executor/status/latest-status.json` para uma URL pública simples, e então apontar a web para essa URL usando `STATUS_JSON_URL`.

## O que já está pronto

- O executor salva `status/latest-status.json`
- A web consegue consumir `STATUS_JSON_URL`
- O executor já possui um publicador remoto opcional por Gist

## Modo recomendado inicial

Use `github_gist` para publicar o status sem mexer em servidor próprio.

## Variáveis do executor

No `apps/executor/.env`, use:

```env
STATUS_PUBLISH_MODE=github_gist
STATUS_PUBLIC_URL=https://gist.githubusercontent.com/SEU_USUARIO/SEU_GIST_ID/raw/latest-status.json
GITHUB_GIST_ID=COLE_AQUI_O_GIST_ID
GITHUB_GIST_TOKEN=COLE_AQUI_O_TOKEN_DO_GITHUB
GIST_FILENAME=latest-status.json
