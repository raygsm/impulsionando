# Self-Hosting do Core Impulsionando

Plano completo para migrar o Core Impulsionando do Lovable Cloud para infraestrutura própria.

> **Nota**: Este documento é um plano de referência. A execução real é uma migração grande (2-4 semanas) e só deve ser iniciada quando (a) MAU > 100k, (b) requisito regulatório exigir controle total do dado, ou (c) custo Lovable > $500/mês.

---

## Arquitetura-Alvo

```text
                    seu-dominio.com.br + wildcard tenants
                                  │
                     ┌────────────┴────────────┐
                     ▼                         ▼
             Front + SSR                Supabase self-hosted
       (Vercel / Cloudflare Pages)      (Docker Compose ou k8s)
       - Build TanStack Start          - Postgres 15 + PostgREST
       - Server functions              - GoTrue (Auth)
       - Env vars próprias             - Storage API + S3/MinIO
                     │                  - Realtime + pg_cron/pg_net
                     └────────► API ◄──┘
```

---

## Checklist de Migração (12 Etapas)

| # | Etapa | Ferramenta | Complexidade | Duração |
|---|---|---|---|---|
| 1 | Provisionar infra (mín. 8GB RAM, 4 vCPU, 100GB SSD) | Hetzner / DO / AWS EC2 | Média | 1 dia |
| 2 | Instalar Supabase self-hosted via `supabase/docker` | Docker Compose | Média | 1 dia |
| 3 | Configurar Postgres (tuning, PITR com wal-g, backup S3) | Postgres | Alta | 2 dias |
| 4 | Restaurar banco: aplicar `supabase/migrations/*.sql` + dump de dados | psql | Baixa | 1 dia |
| 5 | Configurar Auth (JWT secret, providers OAuth, SMTP próprio ou Resend) | GoTrue | Média | 1 dia |
| 6 | Configurar Storage (S3 externo ou MinIO local) | Storage API | Média | 1 dia |
| 7 | Migrar edge functions (Deno self-hosted OU consolidar em server routes TanStack) | Deno Deploy | Alta | 2-3 dias |
| 8 | Build production do TanStack — `createServerFn` roda no adapter Node/Workers | Bun/Vite | Baixa | 1 dia |
| 9 | Deploy front+SSR (Vercel / Cloudflare Pages / Netlify) | Vercel | Média | 1 dia |
| 10 | Configurar env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, chaves de connector | Vercel/CF | Baixa | 2h |
| 11 | Migrar DNS: `*.impulsionando.com.br` → IP do host novo (preview antes) | Registrar | Baixa | 1 dia (+ propagação) |
| 12 | Cutover: janela de manutenção, freeze de escritas, dump final, restore, DNS switch, smoke tests | Coordenação | Alta | 4-8h |

**Total estimado:** 2-4 semanas com 1 dev sênior dedicado.

---

## Riscos e Trade-offs

| Risco | Impacto | Mitigação |
|---|---|---|
| Perder deploy 1-clique da Lovable | Cada mudança exige CI/CD próprio | GitHub Actions + Vercel/CF auto-deploy |
| Perder SSL automático + gestão de domínios | Configurar Let's Encrypt e CDN | Cloudflare grátis resolve |
| Perder Lovable AI Gateway (Gemini/OpenAI grátis) | Pagar OpenAI/Google direto | $50-500/mês dependendo de uso |
| Perder Lovable Cloud Backups automáticos | Manter pg_dump + wal-g próprios | Pipeline de backup já implementado (`core_backup_runs`) |
| Manutenção operacional (patches, monitoring, scaling) | +10-20h/mês de DevOps | Contratar ou usar Supabase.com pago em vez de self-hosted puro |
| Não pode mais editar via Lovable | Volta a desenvolvimento tradicional | Lovable como IDE + sync GitHub continua funcionando no front |
| Bug de sincronismo durante cutover | Escritas perdidas | Janela de manutenção + modo read-only + dump final |
| Rollback difícil | Voltar para Lovable Cloud após sair não é oficial | Testar em staging antes; manter Lovable ativo em paralelo por 30 dias |

---

## Custo Mensal Estimado

| Item | Custo (USD) |
|---|---|
| VPS / cluster (8GB, 4 vCPU) | $40 - $200 |
| S3 backups + storage | $10 - $30 |
| Cloudflare Pro (opcional) | $20 |
| Domínios + SSL | já pago |
| OpenAI / AI providers | $50 - $500 |
| **Total** | **$120 - $750/mês** |

Comparar com custo atual da assinatura Lovable + Cloud + AI Gateway.

---

## Alternativa Intermediária (Recomendada Antes do Full Self-Hosting)

**Managed Supabase (supabase.com) + Vercel:**
- Sair só do Lovable Cloud, manter Supabase gerenciado (não self-hosted)
- Deploy do front/SSR na Vercel
- Custo: ~$50/mês (Supabase Pro) + Vercel free/pro
- Complexidade: baixa (Supabase mantém DB, Auth, Storage; você só migra o app)
- Ganha: controle total do app + dashboard Supabase completo
- Mantém: managed backups, PITR, updates automáticos do Postgres

Esta é a rota mais segura se o objetivo é apenas "sair do Lovable" sem virar DevOps.

---

## Pré-Requisitos Antes de Iniciar

- [ ] GitHub sync ativo (código versionado fora do Lovable) ✅ **Requisito bloqueante**
- [ ] Backup do banco funcionando em storage externo ✅ **Requisito bloqueante**
- [ ] Todas as migrations em `supabase/migrations/` auditadas e testáveis em Postgres limpo
- [ ] Inventário de connectors ativos (AWS S3, GitHub, WhatsApp, Stripe, etc.) — cada um vira secret manual no novo host
- [ ] Inventário de cron jobs (`SELECT * FROM cron.job`) para replicar
- [ ] Documentar todos os subdomínios de tenants ativos
- [ ] Staging environment provisionado antes do cutover de produção
- [ ] Plano de comunicação com clientes tenants sobre janela de manutenção

---

## Referências

- [Supabase Self-Hosting Docs](https://supabase.com/docs/guides/self-hosting)
- [TanStack Start Deploy](https://tanstack.com/start/latest/docs/framework/react/hosting)
- [Cloudflare Workers com TanStack](https://developers.cloudflare.com/workers/)
- [wal-g para PITR](https://github.com/wal-g/wal-g)
