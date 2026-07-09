# DEPLOY — Impulsionando Core

## Plataforma canônica

O ecossistema roda em **Lovable** (TanStack Start + Cloudflare Worker
SSR + Supabase gerenciado pela Lovable Cloud). Não há pipeline paralelo
obrigatório; qualquer pipeline externo é complementar.

## Ambientes / URLs

- Produção: `https://impulsionando.lovable.app`
- Preview: `https://id-preview--<project-id>.lovable.app`
- Custom domains: `impulsionando.com.br`, `wmp.impulsionando.com.br`,
  `chrismed.impulsionando.com.br`, `riomed.impulsionando.com.br`,
  `imobiliaria.garrido.impulsionando.com.br`,
  `marocas.impulsionando.com.br`, e demais listados em `project_urls`.

## Comportamento de deploy

- **Frontend** (rotas, UI, hubs, cliente 360, hubs 3.5): entram em
  produção **somente após** clique em **Publish → Update** no editor
  Lovable. O agente Codex **não publica sozinho**.
- **Backend** (migrations, server functions, RLS, edge functions):
  entram em produção **automaticamente** após aprovação da migration ou
  do deploy backend correspondente.
- **Migrations da Onda 3** (3.3 e 3.4) já foram aplicadas.

## Passo a passo para publicar (frontend)

1. Confirmar que os testes de homologação passaram (`docs/TEST_CHECKLIST.md`).
2. Rodar security scan e resolver findings críticos, se houver.
3. Editor Lovable → **Publish** → **Update**.
4. Validar produção: `/core`, `/core/hub-cobranca`, `/core/hub-automacoes`,
   `/admin/clientes/<slug>` para pelo menos dois clientes reais.
5. Se houver custom domain novo, configurá-lo em Project Settings →
   Domains.

## Pipeline externo (opcional)

Um pipeline em GitHub Actions pode ser adicionado para:
- validar `bun install` + typecheck em PRs;
- rodar `bunx vitest run` quando existirem testes;
- publicar releases documentais (`docs/`).

Ele **não substitui** o Publish da Lovable — apenas complementa.

## Rollback

- Frontend: reverter o commit no repositório e re-publicar via Lovable.
- Backend: migrations são aditivas por padrão; para desfazer o schema
  da Onda 3, gerar migration reversa (dropar colunas/tabelas na ordem
  inversa) — todos os dados criados são auditáveis em
  `core_courtesy_events` / `core_ai_brain_events`.

## Segurança pré-publish

- `security--get_scan_results` antes de publicar.
- Nenhum secret deve aparecer no bundle client (`import.meta.env.VITE_*`
  apenas para valores públicos).
- Confirmar que `is_impulsionando_staff` filtra as telas sensíveis.

## Limitações conhecidas do handoff

- Codex/agente **não** dispara Publish.
- Custom domains dependem do usuário confirmar registros DNS.
- Rotação de `LOVABLE_API_KEY` é feita pela ferramenta dedicada, nunca
  manualmente.
