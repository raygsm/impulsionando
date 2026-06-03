# Plano — Impulsionando Tecnologia

Este é um escopo muito grande (site institucional completo + módulos comerciais + orçamento inteligente + área admin de leads + preparação para pagamentos/fiscal). Para respeitar a **Regra 1 (preservação total)** e a **Regra 50 (não gastar créditos desnecessariamente)**, vou executar em **fases pequenas e aprováveis**, sem tocar no que já funciona (auth, RLS, rotas `_authenticated/*`, CRM, agenda, financeiro, estoque, vendas, BI, etc.).

## Diagnóstico do que já existe (a preservar 100%)
- Sistema interno completo em `src/routes/_authenticated/*` (dashboard, CRM, agenda, finance, inventory, sales, reports, BI, customers, users, permissions).
- Auth funcional (`auth.tsx`, `reset-password.tsx`, `reset-password-sent.tsx`).
- Banco com 40+ tabelas e RLS.
- Sidebar/Topbar/AppShell já maduros.
- Design tokens em `src/styles.css` (azul profundo + cyan).

Nada disso será alterado, exceto rótulo "Impulsionando Sistemas" → "Impulsionando Tecnologia" em pontos de texto.

## Fases propostas (cada uma é uma entrega aprovável separada)

### Fase 1 — Rebrand leve + Home pública (esta entrega)
- Renomear marca em: Sidebar, Topbar (se houver), `__root.tsx` meta tags, `auth.tsx`, rodapés.
- Substituir `src/routes/index.tsx` (hoje só redireciona para `/auth`/`/dashboard`) por: se logado → `/dashboard`; se não → renderiza nova Home pública institucional.
- Nova Home com hero, blocos de dores, módulos resumidos, planos resumidos, CTA WhatsApp `https://wa.me/5521993075000`.
- Header público + Footer público (componentes novos, não afetam AppShell).
- Aplicar logo novo **só se o usuário enviar o arquivo** (ver pergunta abaixo). Caso contrário, manter o ícone Sparkles atual.

### Fase 2 — Páginas institucionais
`/sobre`, `/solucoes`, `/modulos`, `/planos`, `/contato`, `/termos`, `/privacidade`, `/demonstracao`. Cada uma com `head()` próprio (SEO).

### Fase 3 — Páginas individuais por módulo
`/modulos/agenda`, `/modulos/whatsapp`, `/modulos/crm`, `/modulos/afiliados`, `/modulos/sites`, `/modulos/pagamentos`, `/modulos/fiscal`, `/modulos/usuarios`, `/modulos/relatorios`, `/modulos/personalizados`, `/modulos/integracoes`.

### Fase 4 — Contratação modular + Orçamento automático
- `/contratar`: seletor de módulos com cálculo mensal/anual ao vivo.
- `/orcamento`: questionário guiado + lógica de recomendação (regras da seção 27) + tela de resultado.
- Tabela nova `marketing_leads` (com RLS) para gravar leads/orçamentos.
- Página admin `_authenticated/marketing/leads` para a equipe ver/filtrar.

### Fase 5 — Preparação para pagamentos / fiscal (estrutura, sem ligar gateway real)
- Tabelas e enums de `lead_status`, `customer_status`, `payment_status`.
- Telas admin para gerenciar preços simulados de módulos (sem hardcode).

### Fase 6 — Polimento, LGPD, testes manuais de CTAs/responsividade.

## Detalhes técnicos
- Stack já em uso: TanStack Start + React 19 + Tailwind v4 + shadcn + Supabase via Lovable Cloud.
- Novas rotas públicas ficam em `src/routes/*.tsx` (fora de `_authenticated`), com `ssr: false` quando precisarem tocar Supabase.
- Sem Python, sem N8N (conforme Regra 2). Automações = server functions (`createServerFn`) + triggers Postgres.
- Tokens de cor mantidos; apenas adiciono variantes para superfícies marketing se necessário.
- Lead form usa zod + RLS pública só para INSERT anônimo, SELECT só `authenticated`.

## Perguntas antes de começar a Fase 1
1. **Logo:** você pode enviar o arquivo do logo novo (.png/.svg)? Sem ele eu mantenho o ícone atual e troco só o texto "Sistemas" → "Tecnologia".
2. **Aprovar fase 1 isolada?** Faço só Fase 1 agora (rebrand textual + Home pública + Header/Footer) e paramos para você revisar antes da Fase 2 — assim economizamos créditos e evitamos retrabalho.

Confirmando essas duas, começo pela Fase 1.