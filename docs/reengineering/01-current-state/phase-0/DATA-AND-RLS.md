# Dados, RLS e Storage

Esta página preserva o snapshot local do commit `d3ab3c8b`. O inventário Supabase live foi coletado posteriormente e está em [`SUPABASE-LIVE-AUDIT.md`](SUPABASE-LIVE-AUDIT.md); ele confirmou divergência material em relação aos números abaixo.

## Snapshot tipado

| Objeto em `public` | Quantidade |
| ------------------ | ---------: |
| tables             |        465 |
| views              |         19 |
| functions          |        105 |
| enums              |         20 |

O arquivo gerado `src/integrations/supabase/types.ts` possui 36.370 linhas. O catálogo de tabelas e sinais de identidade está em [`DATA-OBJECTS.md`](DATA-OBJECTS.md).

## Identidade multi-tenant observada

| Sinal no tipo `Row`                | Tabelas |
| ---------------------------------- | ------: |
| `company_id`                       |     290 |
| `tenant_id`                        |       1 |
| `user_id`                          |      63 |
| sem `company_id` e sem `tenant_id` |     174 |

A identidade dominante do legado é `company_id`, não `tenant_id`. A arquitetura futura precisa explicitar se `company` continuará sendo o tenant ou se haverá tradução controlada; renomear mecanicamente seria perigoso.

## Migrations e segurança

- 579 migrations SQL, somando aproximadamente 48.196 linhas.
- 204 arquivos criam tabelas e 204 contêm `enable row level security`.
- 279 arquivos criam policies; a contagem textual encontra 1.529 declarações `create policy`.
- 316 arquivos contêm grants, 156 criam triggers e 251 criam functions.
- 26 testes locais tratam RLS, segurança ou Storage.

Essas métricas detectam presença, não cobertura. Só uma comparação com `pg_catalog`, policies efetivamente aplicadas e testes autenticados por papel pode provar isolamento.

## Buckets candidatos encontrados nas migrations

`ai-project-uploads`, `chrismed-professional-fiscal`, `contab-documents`, `contracts`, `ehr-documents`, `fiscal-reports`, `marocas-fotos`, `payout-receipts`, `riomed-midia`, `talentos-fotos`, `talentos-videos`, `talentos-curriculos` e `wmp-uploads`.

Existência, policies, limites e retenção no ambiente live permanecem desconhecidos.

## Schema source of truth (2026-08-30)

Decisão operacional da Fase 0: a estrutura **live** é o baseline observacional; migrations/tipos divergentes **não** devem ser “corrigidos” com push/reset. Detalhe em [`SCHEMA-SOURCE-OF-TRUTH.md`](SCHEMA-SOURCE-OF-TRUTH.md). Reconciliação = Fase 1.

## Gate ainda aberto

O inventário estrutural live e a comparação inicial foram concluídos. Ainda é necessário auditar os corpos das 47 functions `anon` DEFINER (amostra OK para fast-close), índices críticos, autorização entre tenants (allow/deny), classificação de dados e restore isolado.

O kit de coleta inicial está em `scripts/audits/phase0-supabase-structure.sql`. Ele consulta apenas metadados estruturais e deve ser executado uma seção por vez.
