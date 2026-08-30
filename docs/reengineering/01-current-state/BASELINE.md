# Baseline observado

Data da observação: 2026-08-27

Este documento registra fatos usados para justificar a reengenharia. Não é um manual de operação do legado.

## Repositório

- Um pacote principal `impulsionando-core`, sem workspaces de monorepo.
- TanStack Start + React + Vite + Nitro.
- 1.083 arquivos dentro de `src/routes`.
- 111 arquivos de endpoints sob `src/routes/api`.
- 331 arquivos usando `createServerFn`.
- 45 arquivos `*.server.ts` ou `*.server.tsx`.
- 8 Supabase Edge Functions.
- O runtime inicia o servidor web e workers no mesmo container/process supervisor.

## Produção

- Nginx é o reverse proxy real, apesar de documentos esperarem Traefik.
- Apex, homepages de tenants e rotas internas podem servir releases diferentes.
- Existem runtimes em Docker e Node via systemd simultaneamente.
- Foram observados 25 containers, 20 deles em execução.
- Foram observados 117 diretórios de release.
- O checkout existente na VPS estava detached e modificado.
- Um novo commit pode chegar à VPS e ainda assim não se tornar o conteúdo público.

## Armazenamento

- Disco raiz com 76 GB usados de 96 GB.
- Aproximadamente 29,2 GB em imagens Docker.
- Aproximadamente 23 GB em releases sob `/var/www`.
- Aproximadamente 7,1 GB em cache de build Docker.
- Dados persistentes dos volumes Docker eram pequenos em comparação.
- O banco principal está no Supabase gerenciado, fora da VPS.

## Conclusão

O sistema possui backend real, mas fragmentado entre endpoints TanStack, server functions, Edge Functions, workers e automações. A infraestrutura também está em estado split-brain. A reengenharia deve consolidar autoridade sem interromper os fluxos já utilizados.

## Limitações do baseline

- Não confirma quais funcionalidades possuem usuários ativos.
- Não confirma quais tabelas e webhooks ainda recebem tráfego.
- Não substitui inventário do Supabase, Cloudflare, GitHub e n8n.
- Não autoriza remoção de qualquer recurso observado.

