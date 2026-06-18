# Roadmap Impulsionando Tecnologia — Prompt Mestre

> Gerado em 2026-06-18 a partir de auditoria estática do codebase (`src/`, `docs/n8n/`).
> Fonte de verdade para priorização. Atualizar ao final de cada fase.

## Sumário da auditoria (21 blocos)

- ✅ Existe: ~52 itens
- 🟡 Parcial: ~48 itens
- ❌ Faltante: ~14 itens

A plataforma tem **base operacional sólida** (jornada Captar→Cobrar→Comunicar, billing, RBAC, 35+ rotas Core, N8N, RLS). Os gaps concentram-se em **inteligência (insights/benchmarking/saúde), experiência por público (WL, consumidor) e governança de mudanças (sandbox/rollout)**.

## Top-10 gaps críticos (ordem de prioridade pós-roadmap)

| # | Gap | Bloco | Esforço |
|---|---|---|---|
| 1 | Benchmarking anonimizado por nicho | 10 | G |
| 2 | Score de Saúde da Conta (contínuo) | 15 | G |
| 3 | Mensageria Core com segmentação UI | 13 | G |
| 4 | Radar do Nicho (feed + curadoria) | 12 | G |
| 5 | Voz do Cliente + IA | 14 | G |
| 6 | Portal unificado Consumidor Final | 9 | G |
| 7 | Wizard de Onboarding 20-passos unificado | 7 | G |
| 8 | Sandbox + rollout progressivo de módulos | 16 | G |
| 9 | "O que a Impulsionando percebeu" (insights IA) | 11 | G |
| 10 | Área White Label completa (gestor WL) | 1/17 | M |

---

## Roadmap em 5 fases (ordem cronológica por dependência)

### Fase 0 — Auditoria + plano (✅ CONCLUÍDA nesta rodada)

Inventário dos 21 blocos com evidências, gaps e esforço. Este documento.

---

### Fase 1 — Navegação por jornada + Saiba Mais (1-2 rodadas)

**Por quê primeiro:** sem reorganizar a nav nos 9 grupos (Captar/Relacionar/Operar/Cobrar/Comunicar/Automatizar/Analisar/Melhorar/Config), os dashboards e ferramentas das Fases 2-4 ficam dispersos. É barato (frontend puro) e destrava UX.

**Entregas:**
1. Refatorar `src/components/app/nav-config.ts` para os 9 grupos do Prompt Mestre.
2. Sidebar por audiência: shell distinto para Core, WL, Empresa, Consumidor (componente `AppShell` com variantes).
3. Páginas "Saiba Mais" individuais por plano (`/planos/$slug`) — hoje só existe `/planos` agregado.
4. Padronizar template de `/modulos/$slug` e `/nichos/$slug` (já existem, falta consistência visual + CTA único).
5. Ajuda contextual (`HelpTip`) também na área autenticada (hoje só em demo).
6. Banner de upsell in-app: "Por que este módulo vale a pena" dentro de features não-contratadas (Bloco 19).

**Não inclui:** novos dados, novas tabelas, IA.

---

### Fase 2 — Dashboards das 4 camadas + insights (2-3 rodadas)

**Por quê depois da nav:** os 4 dashboards são pontos de chegada da nav. Definir nav antes evita retrabalho de links.

**Entregas:**
1. **Dashboard Empresa unificado** (`/dashboard` 360°) consolidando os cockpits fragmentados (finance/commercial/operations/support).
2. **Dashboard White Label completo** — comissões, repasses, churn dos clientes WL, MRR por WL.
3. **Portal Consumidor Final** — histórico, faturas, agendamentos, favoritos em 1 tela (substituir `/consumer/unified` minimalista).
4. **Área "O que a Impulsionando percebeu"** — evoluir `/insights/oportunidades` (hoje heurística de counts) para pipeline `dados → ai-gateway → insight persistido → notificação`. Nova tabela `account_insights`.
5. **Radar do Nicho** — tabela `niche_radar_posts` (curadoria manual + scheduling), feed em `/radar` por nicho do cliente.
6. **Benchmarking anonimizado** — view materializada `niche_benchmarks_mv` com regra mínima N>=5 empresas por nicho; tela "como você se compara".

**Migrations novas:** `account_insights`, `niche_radar_posts`, `niche_benchmarks_mv`, `nps_responses`.

---

### Fase 3 — Core Ops: Mensageria + Voz + Saúde + Versões (3-4 rodadas)

**Por quê depois dos dashboards:** Saúde e Voz alimentam os dashboards; Mensageria segmenta usando dados de saúde/risco; Versões precisa de telemetria dos dashboards para rollout seguro.

**Entregas:**
1. **Mensageria Core segmentada** (`/core/mensageria`) — UI de seleção (todos/WL/nicho/plano/módulo/risco/inadimplente), preview, agendamento, histórico. Reusa `message_outbox` + `applyGlobalSetting`.
2. **Voz do Cliente** — persistir `nps_responses` (rota `/pesquisa` já existe sem storage), classificação por IA (positivo/neutro/negativo + tema), dashboard `/core/voz-cliente` por público.
3. **Score de Saúde da Conta** — função SQL `calc_health_score(company_id)` agregando login/implantação/módulos/pagamentos/tickets/satisfação. Persistir em `company_health` (snapshot diário via cron). Expor em `/core/saude` por empresa + churn_risk + upgrade_opportunity.
4. **Pipeline de versões de módulos** — sandbox por tenant de teste, rollout progressivo (% configurável por nicho/plano), backup automático antes do upgrade, botão de rollback. Estender `module_versions` + nova `module_rollouts`.

**Migrations novas:** `nps_responses`, `company_health`, `module_rollouts`, `module_backups`.

---

### Fase 4 — Onboarding unificado + automações faltantes (1-2 rodadas)

**Por quê por último:** consolida tudo. Onboarding precisa apontar para dashboards/saúde/módulos já prontos.

**Entregas:**
1. **Wizard único pós-pagamento (20 passos)** — unificar `/onboarding` (5 passos meta/nicho/diag) com `/onboarding/nicho` (3 passos) em um único fluxo guiado coberindo: tenant→subdomínio→plano→módulos→nicho→templates→dashboards→mensagens→follow-up→logs.
2. **Persistir respostas do onboarding** (hoje em localStorage) em `onboarding_answers`.
3. **Cobertura de nichos faltantes** em `applyNicheOnboarding`: adicionar `eventos` e completar templates de `imobiliaria`.
4. **Testes E2E faltantes** dos 4 perfis de acesso + smoke de dashboards + script `verify-rls-isolation.ts` (referenciado nos docs mas inexistente).

---

## Decisões em aberto (preciso confirmar antes da Fase 1)

1. **Nomes finais dos planos:** o Prompt Mestre diz "Essencial/Profissional/Completo", o código usa "Essencial/Integrado/Avançado". Mantenho o código atual ou padronizo com o Prompt Mestre?
2. **Shell por audiência (Fase 1.2):** prefere 4 shells separados (mais isolamento, mais código) ou 1 shell com variantes de nav (mais simples)?
3. **Benchmarking (Fase 2.6):** N mínimo para anonimização é 5 empresas/nicho? Aceita ou prefere 10?
4. **Onboarding (Fase 4.1):** wizard único linear (20 passos sequenciais) ou checklist navegável (passos podem ser feitos fora de ordem)?

---

## Próxima rodada sugerida

**Fase 1 — Navegação por jornada + Saiba Mais.** Escopo fechado, frontend puro, destrava todas as fases seguintes, baixo risco. Tempo estimado: 1 rodada completa.
