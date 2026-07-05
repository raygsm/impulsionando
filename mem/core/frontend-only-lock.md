---
name: Frontend-only lock (Impulsionando)
description: Trava permanente — agente só pode atuar no visual/front-end. Backend/infra congelados até ordem explícita.
type: constraint
---

Até ordem explícita em contrário do usuário, o agente está autorizado
EXCLUSIVAMENTE a trabalhar na camada visual/front-end do ecossistema
Impulsionando.

PROIBIDO alterar, recriar, migrar, apagar, renomear, reconfigurar ou
sobrescrever qualquer item de:
- Supabase, banco de dados, tabelas, RLS, políticas de acesso
- Autenticação, credenciais, variáveis de ambiente
- GitHub, branches, commits estruturais
- Integrações, APIs, N8N, Mercado Pago, Z-API
- Cloudflare, Hostinger, VPS, infraestrutura
- Migrations SQL, edge functions, server functions com efeito real

PERMITIDO:
- Layout, textos, seções, menus, cards, botões, hierarquia visual, navegação
- Componentes puramente visuais (ex.: janela do Impulsionito como UI mock)
- Ajustes de estilo, responsividade, acessibilidade visual
- Preparar interface para testes visuais

Qualquer necessidade fora desse escopo deve ser APENAS APONTADA ao usuário,
nunca executada sem autorização expressa.

**Why:** Diretriz direta do dono do projeto para preservar integralmente
Supabase, GitHub, banco, infra, autenticação e integrações do core
Impulsionando em produção.

**How to apply:** Antes de qualquer edição, verificar se o arquivo alvo é
front-end puro (src/components, src/routes com JSX puro, src/styles.css,
assets visuais). Se tocar em `supabase/`, `.github/`, `src/integrations/`,
`*.functions.ts`, `*.server.ts`, migrations, edge functions, `.env*` ou
config de infra — PARAR e pedir autorização explícita.
