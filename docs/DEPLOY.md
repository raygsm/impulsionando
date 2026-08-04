# Deploy — Impulsionando Core

## Origem canônica

O snapshot publicado pelo Lovable é a única origem de produção. Todos os domínios oficiais são custom domains conectados ao mesmo projeto; por isso, um `Publish → Update` troca o snapshot uma vez e todos passam a servi-lo sem recompilação intermediária.

GitHub é versionamento, validação e auditoria. Cloudflare/Hostinger são DNS, proxy e contingência. Nenhum deles recompila automaticamente uma segunda produção após push.

## Fluxo

1. Alteração sincronizada com o branch principal no GitHub.
2. Gates de build, segurança e RLS aprovados.
3. Operador autorizado executa `Publish → Update` no Lovable.
4. Os custom domains conectados ao projeto passam a servir o mesmo snapshot.
5. O monitor descobre os domínios ativos no cadastro de tenants, consulta `/api/public/version`, compara commit e fingerprint de assets e registra um artefato.
6. Se houver divergência e `CLOUDFLARE_API_TOKEN` estiver no Supabase Vault, o cache das URLs afetadas é invalidado e a prova é repetida.

Não há IP ou hostname Lovable fixo no fluxo. O endpoint operacional é descoberto por DNS; os registros que devem ser configurados são sempre os exibidos em `Lovable → Project → Settings → Domains`.

## Monitoramento

Workflow: `.github/workflows/dns-vps-check.yml`.

- Agenda: a cada cinco minutos, limite mínimo do GitHub Actions.
- Execução imediata futura: evento `repository_dispatch` do tipo `lovable_published` quando o Lovable oferecer um webhook/API de publicação compatível.
- Fonte dos domínios: tabela `companies`; `domain` tem prioridade e `subdomain` gera `<subdomain>.impulsionando.com.br`.
- Prova: contrato de versão, commit, `builtAt`, HTTPS e fingerprint dos assets carregados pela landing de cada tenant.
- HTML e fingerprints de landings diferentes são registrados, mas não exigidos como idênticos: conteúdo, branding e chunks de rota variam legitimamente. A igualdade obrigatória usa o build ID (`commit` + `builtAt`).

O tempo de atualização não depende da agenda do monitor: domínios ligados diretamente ao mesmo projeto recebem o snapshot no próprio Publish. A agenda mede e alerta, não transporta o build.

## Cache

- `/api/public/version`: `no-store`.
- HTML SSR: `no-cache, must-revalidate`.
- Assets com nome versionado: podem permanecer em cache; uma nova build produz nomes/fingerprints diferentes.
- Purge Cloudflare: somente URLs HTML/versão afetadas, com token de privilégio mínimo lido do Vault.

## Contingência Hostinger

`.github/workflows/deploy-core-frontend.yml` e `.github/workflows/mirror-deploy-vps.yml` são manuais. Servem para recuperação de desastre e não executam em push, pois uma compilação VPS independente não é o snapshot publicado pelo Lovable.

## Limitação oficial atual

A documentação pública do Lovable não oferece webhook ou API estável para o evento `Publish`, nem API pública para conectar custom domains. A conexão inicial de cada domínio é feita uma vez no painel do projeto. Depois de conectado, novos publishes atualizam o domínio diretamente.
