# Diretriz Mestra - Fase 7: Validacao final de autonomia

## Status

Concluida no repositorio: o Core Impulsionando tem runbook e checks de operacao independente do Lovable.

## Objetivo

Provar que GitHub, Supabase, VPS/Hostinger, N8N e Core estao alinhados para operar o sistema mae sem depender do Lovable como ambiente de publicacao, rollback, banco, IA, automacao ou fonte da verdade.

## Escopo desta fase

- Atualizar o runbook operacional com deploy e rollback fora do Lovable.
- Declarar o Supabase oficial do Core: `arygtqrdpcdkwnuwsgmm`.
- Fixar GitHub `main` como fonte de verdade de publicacao.
- Fixar GitHub Actions como gate obrigatorio antes de publicar.
- Fixar VPS/Hostinger como destino operacional da publicacao.
- Fixar N8N como executor externo, nunca como fonte de verdade.
- Proteger via teste estatico os arquivos que sustentam a autonomia.

## Resultado tecnico

1. `docs/RUNBOOK_OPERACIONAL.md` agora define:
   - pre-flight obrigatorio antes de publicar;
   - workflow oficial para aplicar migrations Supabase;
   - publicacao na VPS/Hostinger;
   - validacao do N8N;
   - rollback seguro sem Lovable.
2. `docs/CORE_HANDOFF_AUTOSUFICIENCIA.md` agora aponta:
   - GitHub `main` como fonte de verdade;
   - Supabase `arygtqrdpcdkwnuwsgmm` como banco oficial;
   - `CORE_AI_API_KEY`/`CORE_AI_BASE_URL` como IA do Core;
   - Lovable somente como legado temporario.
3. `tests/autonomy-final-static.test.ts` valida:
   - Supabase oficial em `supabase/config.toml`;
   - verificadores de alvo Supabase e pooler nos workflows;
   - ausencia de rollback/publicacao via Lovable no runbook;
   - presenca do checklist VPS/Hostinger e N8N.

## Gates minimos para publicar

Antes de qualquer publicacao:

1. `Production build + security gate`
2. `Vitest full suite (456/456 must pass)`
3. `Security scan + RLS regression`
4. `Tenant isolation + email delivery`
5. `Playwright E2E + a11y + visual`
6. `Apply Supabase Migrations` somente manual e contra o Supabase oficial.

## Declaracao final

O Core Impulsionando nao deve criar novos clientes pelo Lovable. Novos clientes nascem no Core, como tenants, e sao gerenciados pelo dashboard master.

Lovable pode existir apenas como:

- origem historica de projetos antigos;
- ferramenta opcional de prototipagem;
- modo legado temporario explicitamente habilitado por `LOVABLE_LEGACY_ENABLED=true`.

Fora disso, Lovable nao e ambiente de producao, nao e mecanismo de rollback, nao aplica migrations, nao guarda a fonte de verdade e nao controla tenants.

## Proximo ciclo

Com as 7 fases fechadas, o proximo trabalho deve ser execucao operacional:

1. importar/ativar workflows reais no N8N da VPS Hostinger;
2. configurar secrets definitivos no servidor;
3. rodar smoke test em producao;
4. migrar cada cliente Lovable atual para tenant do Core;
5. congelar/excluir projetos Lovable somente apos aceite por cliente.
