# Core Tenants + Vitrine — Roadmap

Documento vivo. Consolida o diagnóstico atual, o que já entregamos
sem tocar backend, e o backlog de migrations/RLS necessário para
fechar a especificação completa do "GESTÃO CENTRAL DE TENANTS" +
"EXIBIÇÃO AUTOMÁTICA NA VITRINE".

## 1. Onde os tenants vivem hoje

| Recurso | Papel |
|---|---|
| `companies` (70 col) | Cadastro oficial do tenant |
| `company_units` | Filiais / unidades |
| `company_modules` | Módulos ativos por tenant |
| `core_tenant_identity` | Identidade white-label / branding |
| `core_tenant_publication_state` | Estado de publicação |
| `companies_vitrine_public` (view) | Leitura anon da vitrine |
| `wl_company_links` | Vínculo White Label ⇄ tenants |
| `consumer_profiles` / `consumer_memberships` | Consumidor Clube |

## 2. Já entregue nesta rodada (front, sem alterar schema)

- `/admin/tenants` — dashboard consolidado com KPIs, filtros por
  status, cidade e vitrine, busca por nome/slug/segmento.
- `/admin/vitrine-elegibilidade` — classifica cada tenant como
  `eligible | missing_data | disabled | blocked` usando apenas
  colunas existentes. Mostra explicitamente o que falta.
- `/admin/vitrine-diagnostico` — saúde da view pública para `anon`,
  motivos por tenant, agora com `data-testid` para Playwright.
- Testes Playwright: `e2e/admin-vitrine-diagnostico.spec.ts` (skip
  automático quando não há storageState admin).

## 3. Gaps confirmados que exigem migration futura

| Campo / recurso | Justificativa | Impacto |
|---|---|---|
| `tenant_type` enum (empresa/white_label/consumidor/demo/interno) | Item 1 do plano | Filtragem por tipo, isolamento white-label |
| `vitrine_status` (10 estados do item 3) | Estado semântico independente de `status` | Mostra "pausada", "aguardando aprovação", etc. |
| `latitude`, `longitude`, `service_radius_km` | Busca por CEP/raio | Ordenação por distância |
| `atendimento_presencial`, `atendimento_online`, `delivery` | Filtros do Clube | Cards e filtros |
| `horario_funcionamento` (jsonb) | "Aberto agora" | Filtro dinâmico |
| `descricao_publica`, `descricao_completa`, `keywords[]` | SEO da vitrine | Cards e páginas |
| `benefit_short`, `coupon_code` | Item 7 (Clube) | Selos e ordenação |
| `gallery_urls[]` | Galeria da vitrine | Item 5 |
| `rating_avg`, `rating_count` (materializada) | Ordenação e filtros | Derivar de `ecosystem_reviews` |
| View `companies_vitrine_eligible` | Consolidar regra do item 4 | Simplifica queries públicas |

Todos são migrations independentes que serão apresentadas em
`supabase--migration` separadamente para aprovação (regra global).

## 4. Pendências que dependem de outros sistemas

- Enriquecimento CEP → lat/lng (ViaCEP + Nominatim/Geocoder). Fica em
  background job disparado quando `address_zip` muda.
- Impulsionito RAG sobre a vitrine — depende de embeddings dos campos
  descritivos após migration.
- Cron para atualizar `rating_avg`/`rating_count` (ou trigger em
  `ecosystem_reviews`).
- Indexação geoespacial (`earthdistance`/`cube` ou PostGIS) para
  busca por raio.

## 5. Homologação dos tenants existentes

Ao rodar `/admin/vitrine-elegibilidade` o Core mostra o status atual
de cada tenant conhecido. Objetivo: zerar `missing_data` para os
tenants oficiais listados abaixo antes de ligar a vitrine "cheia":

- CHRISMED
- RIOMED
- Garrido Imobiliária
- Marocas
- WMP / WVM (se existir)
- Impulsionando Brasil (tenant institucional)
- Demo Bares / Demo Resto (mantêm-se como demo, não vão para vitrine)

## 6. Checklist de rollout completo

- [ ] Migration `tenant_type` + backfill (empresa/white_label/…)
- [ ] Migration `vitrine_status` + backfill a partir de `status`
- [ ] Migration campos de vitrine (descrição, benefit, gallery, horários)
- [ ] Migration geolocalização (lat/lng, raio) + índice
- [ ] View `companies_vitrine_eligible` (regra automática server-side)
- [ ] Materialização de `rating_avg/count`
- [ ] Filtros públicos por CEP/bairro/cidade/raio na `/vitrine`
- [ ] Impulsionito com busca contextual sobre vitrine
- [ ] Dashboard de relatórios da vitrine por tenant (item 10)
- [ ] Isolamento white-label (`wl_company_links` já existe — validar RLS)
