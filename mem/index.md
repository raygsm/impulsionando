# Project Memory

## Core
FRONTEND-ONLY LOCK ATIVO: até ordem explícita, só editar camada visual/front-end. PROIBIDO tocar Supabase, banco, RLS, auth, GitHub, integrações, N8N, MPago, Z-API, Cloudflare, Hostinger, VPS, migrations, edge/server functions, `.env*`. Fora do escopo = apenas apontar, nunca executar.
Impulsionando é o core/master. RioMed é tenant dentro do core — nunca projeto paralelo. Proibido deletar arquivos `riomed.*` em lote: antes verificar imports, rotas (`routeTree.gen.ts`), `<Link to="/riomed...">`, redirects e referências em docs/n8n/migrations. Remover item a item validando build.
Todo projeto/cliente novo nasce acoplado ao core Impulsionando: auth (`_authenticated` gerido), RBAC (`user_roles`+`has_role`), multi-tenant (`companies`+RLS por `company_id`/`auth.uid()`), billing (`CheckoutShell`/`BillingGate`/`PlanGate`), branding (`TenantBrandingProvider`), server logic em `createServerFn`. Clientes são tenants, nunca sistemas isolados. Doc: `docs/CORE_IMPULSIONANDO_SCAFFOLDING.md`.
Consumidor Final tem default-deny no menu: itens sem `audiences` declarado ficam ocultos. Pré-assinatura (sem `consumer_memberships` ativa) usa `CheckoutShell` em qualquer rota.
Marketplace B2B usa "Taxa de Intermediação Digital" (nunca "comissão"). Taxa padrão 0,50% com override por nicho/fornecedor. KPI principal: GMV.
Todo módulo/N8N/agente IA opera pela ótica do funil Impulsionando (captar→converter→relacionar→reter→expandir). Tenants (imob, eventos, bar, clínica, advocacia, etc.) são leads/contas do funil — alimentam `marketing_leads`/`crm_opportunities`. Réguas variam por `niche_code`. Doc: `docs/CORE_GROWTH_GOVERNANCE.md`.
Contas master globais: `raygs@hotmail.com` = admin master (acesso total a todos os tenants, sem gates); `raygsmonnerat@gmail.com` = cliente-teste padrão (criada como `customers` em toda empresa real, auto-seed via trigger).
Idioma único em TODOS os canais de atendimento (e-mail, WhatsApp, SMS, push, chat, notificações, rodapés, unsubscribe): português brasileiro. Nenhum termo em inglês — nem em rodapé de e-mail.

## Memories
- [Frontend-only lock](mem://core/frontend-only-lock) — Trava permanente: só visual/front-end até ordem explícita; backend/infra congelados
- [RioMed tenant policy](mem://core/riomed-tenant-policy) — RioMed é tenant; proibido deletar arquivos riomed em lote sem checar imports/rotas/links/redirects
- [Audience visibility policy](mem://core/audience-policy) — Default-deny consumidor + CheckoutShell pré-assinatura
- [Core Impulsionando scaffolding policy](mem://core/scaffolding-policy) — Todo projeto novo é tenant do core: checklist auth/RBAC/RLS/billing/branding
- [Core Growth Governance](mem://core/growth-governance) — Funil Impulsionando aplicado a todos os tenants/nichos: N8N, agentes IA, réguas, dashboards
- [Cliente-teste padrão Impulsionando](mem://core/test-customer-policy) — raygs@hotmail.com (admin master) e raygsmonnerat@gmail.com (cliente-teste em todo tenant + trigger de auto-seed)
- [Admin menu parametrizável v2](mem://core/admin-menu) — Tabela `core_admin_menu`, 2 vertentes × 13 grupos, hub `/admin/master-hub`, nova tela admin entra por tabela (não hardcode)
- [Idioma único pt-BR](mem://core/language-policy) — Todos os canais em português; rodapé de e-mail, unsubscribe e CTAs incluídos
