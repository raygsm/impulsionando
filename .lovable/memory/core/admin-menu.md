---
name: Admin menu parametrizável v2
description: Navegação master do Core via tabela `core_admin_menu` — 2 vertentes (Impulsionando / Clientes), 13 grupos, página-hub única `/admin/master-hub`. Toda nova tela admin entra pela tabela, não por hardcode.
type: feature
---

Toda nova tela administrativa deve ser registrada na tabela `public.core_admin_menu` (vertente, group_key, item_key, route) ao invés de hardcode em `src/components/app/nav-config.tsx`. Hub canônico: `/admin/master-hub`. Server fns: `listAdminMenu` / `toggleAdminMenuItem` em `src/lib/admin-menu.functions.ts`. RLS é gated por `is_impulsionando_staff`. Credenciais sensíveis nunca aparecem no frontend — apenas status, link externo e botão de configurar secret. Doc completo: `docs/CORE_ADMIN_MENU_v2.md`.
