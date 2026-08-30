# Ownership e gates temporários

Atualizado em: 2026-08-30 (clarifications Cauã + autoridade Fase 0).

Campos em branco para Raygs (processo emergencial, RPO/RTO, owners a confirmar, pagamentos, comms, staging, ack de schema):
[`RAYGS-DECISION-PACKET.md`](./RAYGS-DECISION-PACKET.md).
O pacote **não fecha** estas questões até assinatura; esta página permanece a referência de papéis já declarados.

## Papéis

| Papel | Responsável | Estado |
| --- | --- | --- |
| autoridade técnica da Fase 0 | Cauã e Raygs | confirmado |
| proprietário do produto/negócio (todos os verticais) | Raygs | confirmado (`DECLARED` clarifications) |
| aprovador de mudança emergencial em produção | Cauã **e** Raygs | confirmado; formalizar em packet §1 (stub também em [`DEPLOYMENT-PUBLISHERS.md`](DEPLOYMENT-PUBLISHERS.md)) |
| technical owner — GitHub Actions / VPS / Nginx | Cauã (exec) + Raygs (approve) | confirmado |
| technical owner — Supabase/dados | Cauã + Raygs (acesso integral); product Raygs | confirmado acesso; classificação / SoT ack → packet §2 / §7 |
| technical owner — Cloudflare/DNS | Cauã (exec) + Raygs (owner conta) | confirmado acesso; zone export pendente; confirmar em packet §2 |
| technical owner — n8n / Evolution / comunicação | Cauã + Raygs | acesso presumido; inventário live **UNKNOWN** → packet §2 / §5 |
| technical owner — pagamentos/fiscal | Cauã+Raygs (acesso); matriz canônica DECLARED | contas live/sandbox nomes → packet §4 / [`PAYMENTS-CANONICAL.md`](PAYMENTS-CANONICAL.md) |
| clientes / tenants | apenas usuários das webapps | sem acesso infra |

Apenas Cauã e Raygs alteram GitHub, Supabase, VPS e Cloudflare. A tabela não concede novas permissões.

## Owners por vertical P0 (produto)

| Vertical | Product owner | Technical approvers |
| --- | --- | --- |
| Impulsionando (plataforma) | Raygs | Cauã + Raygs |
| Chrismed | Raygs | Cauã + Raygs |
| Colors Saúde | Raygs | Cauã + Raygs |
| WMP | Raygs | Cauã + Raygs |
| Ana Madu / RioMed / outros | Raygs | Cauã + Raygs |

## Gate de mudança durante a descoberta

1. Mudança emergencial: incidente, alvo, evidência, autor, aprovador (Cauã+Raygs), rollback — formulário em packet §1; stub também em DEPLOYMENT-PUBLISHERS.
2. Deploy automático, DNS, cleanup e provisionamento permanecem contidos **onde já desabilitados**; orphans ativos = risco residual até ação humana.
3. Backups e checks somente leitura permanecem; falhas precisam de owner (Cauã).
4. Nenhum secret, dump ou dado de usuário no Git.
5. Nenhuma limpeza da VPS antes de dependências + restore.
