# Onda 3.2 — Cliente 360 (frontend-only)

Objetivo: transformar a área de cada cliente conectado ao Core em um cockpit
único, com 12 abas oficiais, sem quebrar as rotas existentes e sem tocar em
backend.

## Abas oficiais do Cliente 360

Em `/admin/clientes/$slug` (rota-mãe `admin.clientes.$slug.tsx`):

1. Painel — `/admin/clientes/$slug/painel`
2. Dados do cliente — `/admin/clientes/$slug/dados` *(novo)*
3. Plano e cortesia — `/admin/clientes/$slug/plano` *(novo)*
4. Módulos — `/admin/clientes/$slug/modulos`
5. Cérebro IA — `/admin/clientes/$slug/cerebro-ia` *(novo)*
6. Automações — `/admin/clientes/$slug/automacoes`
7. Financeiro — `/admin/clientes/$slug/financeiro`
8. Mercado Pago — `/admin/clientes/$slug/mercado-pago` *(novo)*
9. Domínios — `/admin/clientes/$slug/dominio`
10. Publicação — `/admin/clientes/$slug/publicacao` *(novo)*
11. Logs — `/admin/clientes/$slug/logs`
12. Configurações — `/admin/clientes/$slug/configuracoes`

## Copy

Toda copy visível usa "cliente", "empresa" ou "cliente conectado ao Core".
Nenhum uso de "tenant" nas novas telas. Rotas técnicas internas
(`/core/tenants/*`, `tenantSlug`, tabelas) permanecem inalteradas.

## Arquivos alterados

- `src/routes/_authenticated/admin.clientes.$slug.tsx`
  - Rebuild do `buildTabs` para as 12 abas oficiais.
  - `scroll-contrast` na navegação lateral horizontal.
- `src/routes/_authenticated/admin.clientes.$slug.dados.tsx` *(novo)*
- `src/routes/_authenticated/admin.clientes.$slug.plano.tsx` *(novo)*
- `src/routes/_authenticated/admin.clientes.$slug.cerebro-ia.tsx` *(novo)*
- `src/routes/_authenticated/admin.clientes.$slug.mercado-pago.tsx` *(novo)*
- `src/routes/_authenticated/admin.clientes.$slug.publicacao.tsx` *(novo)*
- `docs/ONDA_3_2_CLIENTE_360.md` *(este documento)*

## Rotas preservadas / fallbacks

- `/admin/clientes/$slug` (Resumo) continua respondendo — não aparece mais
  na barra de abas, mas botão "Abrir Resumo" está presente na aba Dados.
- `/admin/clientes/$slug/crm` continua ativa; deixa de aparecer nas abas
  padrão (não estava no escopo desta fase). Nada foi removido.
- `/admin/clientes/riomed` e seus filhos (40+ rotas legadas) seguem intactos.
- `/core/cliente/$id` (visão Core) segue ativo em paralelo.

## Plano Full em cortesia (visual apenas)

`admin.clientes.$slug.plano.tsx` já exibe:

- Selo "Cortesia · 30 dias" no plano Full padrão.
- Bloco "Parametrização futura" com o que a Fase 3.3 deve entregar
  (duração global/por nicho/por cliente, regras de conversão automática,
  bloqueios progressivos, cortesia estendida, alertas, auditoria).

Nenhuma persistência é feita agora.

## Cérebro IA por Cliente (visual apenas)

`admin.clientes.$slug.cerebro-ia.tsx` expõe os seis blocos pedidos:

- Nome do agente
- Tom de voz
- Abordagem
- Horários
- Idiomas
- Canais

Mais dois blocos complementares:

- Base de conhecimento
- Testes e homologação

Botões "Testar" e "Salvar rascunho" existem apenas visualmente e ficam
`disabled` até o backend do Cérebro IA ser destravado.

## Lacunas técnicas conhecidas (não bloqueiam a Fase 3.2)

- Não há schema `client_ai_brain` — necessário na Fase 3.4.
- Não há campo `plano.cortesia_inicio` / `cortesia_fim` — necessário na 3.3.
- Não há campo `billing_plans.trial_full_days` — necessário na 3.3.
- Não há integração real com Mercado Pago por cliente — Fase 3.5.
- Automação de publicação (deploy sob demanda, rollback, verificação
  ao vivo) — Fase 3.5.

## Riscos

- Abas novas são puramente visuais; usuários operacionais podem esperar
  campos editáveis. Copy deixa claro "Prévia visual · Fase X".
- Rota `/admin/clientes/$slug/crm` deixou de aparecer na barra; se
  operação estiver usando esse atalho, criar link no card do Resumo.
- Existem hoje várias rotas paralelas (`/core/cliente/$id`, `/companies/*`)
  que ainda não redirecionam para o Cliente 360. Manter todas ativas até
  Fase 3.3 decidir consolidação.

## Pendências para Fase 3.3 (destravar backend controlado — cortesia Full)

1. Campo `trial_full_days` em `billing_plans` (ou `core_settings` global).
2. Colunas `cortesia_inicio`, `cortesia_fim`, `cortesia_status` em
   `companies` ou tabela dedicada.
3. RPC `apply_full_courtesy(company_id, days)` com auditoria.
4. Server function protegida (`requireSupabaseAuth` + `has_role('admin')`).
5. Hook `useClientCourtesy(companyId)` e binding real na aba Plano.
6. Régua de conversão automática (n8n) ao final da cortesia.

## Pendências para Fase 3.4 (destravar backend controlado — Cérebro IA)

1. Schema `client_ai_brain`: agente, tom, horários, idiomas, canais,
   base de conhecimento, prompts, guardrails, versão.
2. RLS por `company_id` + grants apropriadas.
3. Roteador de canal (WhatsApp/Web/E-mail) desacoplado do provedor de LLM.
4. Painel real de testes com histórico de conversa e revisão humana.
5. Custos por conversa e limites por plano.
