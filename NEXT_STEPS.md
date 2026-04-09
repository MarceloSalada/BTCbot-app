# Next Steps

## O que já ficou pronto

- painel web publicado na Vercel
- executor funcionando no Termux
- estratégia SMA curta x longa
- stop loss e take profit
- dry run e force signal
- saldo e notional validados no executor
- status file local preparado em `apps/executor/status/latest-status.json`

## Próxima etapa recomendada

Conectar o painel ao status salvo pelo executor via uma bridge simples.

## Opções de bridge

1. GitHub Gist privado ou arquivo versionado por automação
2. endpoint privado de upload do status
3. storage externo (KV, banco ou bucket)

## Melhor caminho para agora

1. manter executor estável
2. confirmar geração do status file
3. escolher uma bridge simples
4. ligar o painel a esse status
