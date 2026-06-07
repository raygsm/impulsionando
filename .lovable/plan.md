# Certificação de Módulos — Plano Cirúrgico

Escopo: **não recriar nada**. Apenas adicionar a camada de **certificação, instalação 1-clique e templates por segmento** em cima do que já existe (`modules`, `company_modules`, `module_versions`, `setting_definitions`, `company_settings`).

---

## Fase 1 — Matriz de Prontidão (status por módulo)

**Migration** (1 só):
- Adicionar colunas em `public.modules`:
  - `readiness_status text default 'em_desenvolvimento'` — enum lógico: `em_desenvolvimento | em_revisao | em_testes | certificado | publicado`
  - `readiness_checklist jsonb default '{}'` — 13 flags do checklist (interface, permissões, dashboard, relatórios, logs, comunicação, integrações, parâmetros, instalação, remoção, atualização, demonstração, fluxos)
  - `demo_url text`, `docs_url text`, `segments text[] default '{}'`
- Nenhuma nova tabela.

**UI** (reaproveitando rotas existentes):
- `src/routes/_authenticated/core.modulos.tsx` — adicionar coluna **Status** + filtro (somente "Certificado" e "Publicado" aparecem como instaláveis).
- `src/routes/_authenticated/core.modulos.$slug.tsx` — nova aba **Certificação** com:
  - 13 checkboxes do checklist (gravam em `readiness_checklist`)
  - Select de status
  - Campos `demo_url`, `docs_url`, `segments[]`
  - Botão "Marcar como Certificado" (só habilita se 13/13 ✓)
- Sem novas páginas, sem novos componentes pesados.

---

## Fase 2 — Instalação em 1 Clique

Reaproveita `company_modules` (já existe) + `auto-provisioning.server.ts` (já tem lógica de instalar módulos com dependências).

**Novo server fn** em `src/lib/modules.functions.ts` (arquivo já existe):
- `installModuleOnCompany({ moduleSlug, companyId, segmentTemplate? })`:
  1. Valida que módulo está `certificado` ou `publicado`
  2. Resolve dependências (já tem essa lógica)
  3. `upsert` em `company_modules` com `is_enabled=true`
  4. Aplica template do segmento (se passado) em `company_settings` via `setting_definitions`
  5. Loga em `audit_logs`
- `uninstallModuleFromCompany({ moduleSlug, companyId })` — desativa (`is_enabled=false`) + log.

**UI**:
- No `core.modulos.$slug.tsx`, adicionar botão **"Instalar no Cliente"** que abre um diálogo:
  - Select de empresa (query `companies`)
  - Select de template de segmento (lê `modules.segments` + presets default)
  - Botão Instalar → chama `installModuleOnCompany`
- No `core.cliente.$id.tsx` aba **Módulos** (já existe), adicionar o mesmo fluxo "Instalar módulo" filtrando só módulos certificados.

---

## Fase 3 — Templates por Segmento

Sem nova tabela. Templates ficam como **JSON estático** em `src/data/moduleSegmentTemplates.ts`:

```ts
export const SEGMENT_TEMPLATES = {
  agenda: {
    clinica: { 'agenda.confirm_after_payment': true, 'agenda.hold_minutes': 30, ... },
    psicologia: { ... },
    academia: { ... },
    // etc
  },
  crm: { ... },
}
```

`installModuleOnCompany` lê esse mapa e faz `upsert` em `company_settings`. Editar templates = editar o arquivo (uma vez), sem migration.

Segmentos cobertos: clínica, psicologia, gastro, academia, crossfit, restaurante, bar, microcervejaria, escritório, eventos, educação, viagens.

---

## Fora do escopo (explicitamente)

- ❌ Não vou recriar Agenda/CRM/Financeiro/PDV/NF/Checkout/PDV/BI/Portal/Formulários — eles já existem.
- ❌ Não vou implementar integrações novas (NFSe municipal, gateway X) — fica como flag no checklist e o gestor marca quando integrar.
- ❌ Não vou criar páginas de demo novas — `demo_url` aponta para as rotas `/demo.*` que já existem.
- ❌ Não vou tocar em RLS dos módulos existentes.

---

## Entregáveis

1. **1 migration** (colunas em `modules`).
2. **1 arquivo de templates** (`src/data/moduleSegmentTemplates.ts`).
3. **2 server fns novas** em `src/lib/modules.functions.ts` (install/uninstall).
4. **Aba Certificação** em `core.modulos.$slug.tsx`.
5. **Diálogo Instalar no Cliente** (componente único reutilizado nas 2 telas).
6. **Filtro/coluna Status** em `core.modulos.tsx`.

Tudo o resto (checklist do usuário: parâmetros, comunicação, logs, pendências, white label) já foi entregue nas fases A-C anteriores.

---

## Próximos passos sugeridos pelo usuário

Após aprovar este plano, recomendo executar **Fase 1 + Fase 2 juntas** (matriz + instalação), e depois Fase 3 (templates) numa segunda rodada — assim você já consegue marcar módulos como certificados e instalar com config default antes de termos os 12 segmentos preenchidos.
