# Diretriz Mestra Final - Fase 1: Auditoria do Core

Data: 2026-06-25  
Branch auditada: `codex/security-autonomy-audit`  
Commit local: `ddb6ff52`  
Escopo desta fase: diagnostico, documentacao e plano seguro. Nao houve alteracao de frontend, producao, regras de negocio ou banco real.

## Conclusao objetiva

O projeto Impulsionando ja possui uma base real de Core SaaS: multi-tenant, modulos por cliente, planos, cobranca, Mercado Pago, outbox de mensagens, N8N documentado, auditoria, RLS e gates de GitHub Actions.

Porem, o ecossistema ainda nao pode ser tratado como "100% independente do Lovable" nem como "Core master finalizado", porque ainda existem:

- referencias Lovable em runtime, scripts, docs e migrations antigas;
- dois caminhos concorrentes para criar/provisionar clientes;
- tenants atuais ainda registrados como fontes legadas de Lovable;
- automacoes N8N versionadas em arquivos, mas nem todas comprovadamente importadas/ativadas por tenant;
- documentos que afirmam conclusao total enquanto outros listam pendencias abertas;
- PR de auditoria/autonomia ainda nao consolidado em `main`;
- risco de desalinhamento entre migrations do repositorio e banco Supabase real.

A estrategia correta e consolidar o Core por fases, preservando clientes atuais e migrando Lovable apenas como origem legada, nunca como fonte de verdade.

## Fonte da verdade desejada

O Core Impulsionando deve ser a unica origem de governanca para:

- clientes/tenants em `companies`;
- identidade canonica dos tenants em `core_tenant_identity`;
- modulos instalados em `company_modules`;
- configuracoes em `company_settings`;
- planos e contratos em `billing_plans`, `billing_contracts`, `billing_invoices`;
- regras financeiras em `core_fee_rules`, `core_revshare_rates`, `core_payout_events`;
- automacoes e rastreabilidade em `n8n_workflow_runs`;
- comunicacao em `message_templates`, `message_outbox`, `notifications`;
- acesso master via perfil master para `ricks@hotmail.com`.

Lovable deve ficar apenas como legado temporario ate cada projeto atual ser validado e migrado.

## O que ja existe

### 1. Fabrica de Projetos

Arquivo principal: `src/lib/factory.functions.ts`  
Tela principal: `src/routes/_authenticated/core.criar-projeto.tsx`  
Documento: `docs/FABRICA_PROJETOS.md`

Capacidades encontradas:

- cria ou reaproveita cliente em `companies`;
- registra geracao em `ai_project_generations`;
- instala modulos em `company_modules`;
- aplica presets em `company_settings`;
- salva toggles da fabrica;
- cria/reaproveita usuario administrador;
- vincula perfil `gestor-empresa`;
- cria contrato e primeira fatura quando plano e informado;
- enfileira mensagem de boas-vindas via `enqueue_message`;
- opera com a logica de "sem prompt de IA" para nao depender de Lovable na criacao basica.

Esta deve ser a base canonica para novos clientes.

### 2. Sistema de modulos

Arquivo principal: `src/lib/modules.functions.ts`  
Tabelas principais: `modules`, `company_modules`, `company_settings`

Capacidades encontradas:

- catalogo/listagem de modulos;
- instalacao com dependencia;
- release de versao;
- atualizacao para versao mais recente;
- desinstalacao/desativacao;
- checklist de onboarding.

Lacuna: nao foi encontrado fluxo completo de rollback versionado por tenant, apesar de documentos citarem rollback como requisito.

### 3. Clientes atuais como tenants

Migration criada nesta branch: `supabase/migrations/20260625153000_core_master_tenant_registry.sql`  
Documento criado nesta branch: `docs/CORE_MASTER_TENANT_REGISTRY.md`

Tenants canonicos registrados pela migration:

- `riomed`;
- `chrismed`;
- `imobiliaria-garrido`;
- `wmp`;
- `dqa`;
- Core master `Impulsionando`.

Observacao: esta migration ainda depende de aplicacao no Supabase oficial para virar estado real do banco.

### 4. Mercado Pago e monetizacao

Funcao principal: `supabase/functions/mpago-create-payment/index.ts`  
Tabelas citadas: `mpago_credentials`, `mpago_payments`, `core_monetization_models`, `core_revshare_rates`, `core_payout_events`

Capacidades encontradas:

- credenciais Mercado Pago por empresa;
- PIX/cartao/preferencia;
- `application_fee` para split quando ha modelo de monetizacao;
- registro de evento financeiro pendente.

Lacunas:

- ainda ha fallback PIX/manual com WhatsApp hardcoded em componentes;
- documentos antigos citam InfinitePay em alguns pontos;
- precisa consolidar uma unica regra oficial de gateway e fallback.

### 5. N8N

Arquivos encontrados: 18 arquivos em `docs/n8n`  
Rotas/funcoes encontradas:

- `/api/public/webhooks/n8n-callback`;
- `/api/public/cron/funnel-dispatch`;
- tabelas e health checks com `n8n_workflow_runs`.

Capacidades encontradas:

- padrao de assinatura HMAC;
- logs por workflow;
- catalogo de workflows documentado;
- callback publico para registrar execucao.

Lacuna: os JSONs existem no repositorio, mas a auditoria nao comprovou importacao/ativacao real de todos os workflows na VPS Hostinger/N8N para todos os tenants.

### 6. Seguranca e gates

Arquivos principais:

- `.github/workflows/publish-gate.yml`;
- `.github/workflows/security-rls.yml`;
- `.github/workflows/security-baseline.yml`;
- `.github/workflows/tenant-isolation.yml`;
- `scripts/verify-supabase-target.mjs`;
- `docs/SECURITY_AUTONOMY_AUDIT.md`.

Capacidades encontradas:

- gate de publicacao;
- testes de RLS;
- baseline de seguranca;
- validacao contra Supabase errado;
- documentacao de independencia operacional.

Lacunas:

- PR #3 ainda precisa ser mergeado em `main`;
- historico recente mostrou secrets GitHub apontando para Supabase incorreto antes da correcao manual;
- `main` e branch de auditoria divergiram, exigindo sincronizacao antes de qualquer aplicacao definitiva.

## Riscos e inconsistencias encontradas

### P0 - Bloqueia independencia real

1. `main` ainda nao contem toda a auditoria/autonomia
   - PR #3 existe para `codex/security-autonomy-audit`.
   - Enquanto nao mergear, `main` nao e a fonte final.

2. Supabase real pode estar desalinhado do repositorio
   - Houve diagnostico anterior de `public.companies = null`.
   - A migration base precisa estar aplicada antes de qualquer tenant oficial depender do Core.
   - A migration de registry dos tenants atuais tambem precisa ser aplicada depois da base.

3. Existem dois caminhos de criacao/provisionamento
   - Canonico: `createProjectFromFactory` em `src/lib/factory.functions.ts`.
   - Antigo/paralelo: `src/lib/tenant-provisioning.functions.ts`.
   - O provisionador antigo usa `company_kind = 'tenant'`, enquanto migrations de validacao aceitam `real`, `demo`, `sandbox`, `interna`.
   - Isso pode quebrar criacao ou gerar tenants fora do padrao.

4. Lovable ainda aparece em pontos operacionais
   - Exemplo: `scripts/riomed-public-smoke.sh` usa `https://impulsionando.lovable.app`.
   - Exemplo: `src/hooks/use-tenant.ts` trata hosts `.lovable.app` e `.lovable.dev`.
   - Exemplo: `src/routes/auth.tsx` importa `@/integrations/lovable`.
   - Exemplo: `src/lib/ai-gateway.server.ts` aponta para `https://ai.gateway.lovable.dev/v1`.

### P1 - Impede operacao SaaS master completa

1. Clientes Lovable atuais ainda sao legado, nao apenas tenants finais
   - `docs/CORE_REORG_AUDIT.md` lista CHRISMED, DQA, Garrido, Marocas, Plataforma Saude e WMP com URLs Lovable.
   - O documento tambem alerta que nao devem ser excluidos antes de validar dominio, dados, webhooks e trafego.

2. Modulos nao tem rollback completo comprovado
   - Existe instalar, atualizar e desativar.
   - Falta fluxo explicito de voltar uma empresa para versao anterior de modulo com auditoria e seguranca.

3. Marketplace/precos ainda misturam fonte de verdade
   - Existe `src/data/moduleCatalog.ts` com `MODULE_PRICE_CENTS = 49700`.
   - Para SaaS master, preco precisa vir do banco/painel master, nao de constante fixa de frontend/dados locais.

4. WhatsApp e fallback manual ainda nao estao totalmente parametrizados
   - `src/components/payments/PixFallbackDialog.tsx` usa telefone padrao `5521972554500`.
   - `src/components/payments/PixCheckoutCard.tsx` tambem usa `5521972554500`.
   - Isto deve virar configuracao por tenant/core, nao valor fixo.

5. N8N nao esta comprovadamente auto-provisionado por tenant
   - Existem arquivos e callbacks.
   - Falta garantir fluxo unico: instalar modulo -> criar/importar workflow -> registrar webhook -> testar health -> ligar/desligar pelo dashboard.

### P2 - Precisa limpeza antes de chamar de definitivo

1. Documentos contraditorios
   - `docs/CORE_COMPLETION_ROADMAP.md` afirma entregas 100%, mas tambem contem listas pendentes.
   - Isso atrapalha operacao e decisoes de deploy.

2. Rotas e menus ainda muito fragmentados
   - `docs/CORE_REORG_AUDIT.md` ja aponta duplicidade e reagrupamento necessario.
   - A area master precisa separar claramente Core, Clientes, Modulos, Planos, Financeiro, Integracoes, Seguranca e Suporte.

3. Migrations antigas contem URLs Lovable
   - Ha migrations com cron URLs em `project--...lovable.app`.
   - Elas precisam ser neutralizadas por novas migrations seguras, nao editadas historicamente.

## Arquitetura recomendada

### Caminho unico para novo cliente

1. Login master em Impulsionando.
2. Abrir `/core/criar-projeto`.
3. Criar empresa em `companies`.
4. Criar identidade em `core_tenant_identity`.
5. Escolher nicho/plano.
6. Instalar modulos em `company_modules`.
7. Aplicar presets em `company_settings`.
8. Criar admin do cliente em `auth.users` + `user_profiles`.
9. Criar contrato/fatura em `billing_contracts` e `billing_invoices`.
10. Provisionar automacoes N8N do plano.
11. Configurar canais: email, WhatsApp, Mercado Pago, dominio.
12. Registrar tudo em auditoria.

### Caminho unico para cliente atual Lovable

1. Nao excluir o projeto Lovable ainda.
2. Registrar tenant no Core.
3. Mapear dominio, banco, dados, webhooks e usuarios.
4. Migrar dados/configuracoes necessarias.
5. Apontar dominio para o Core.
6. Validar login, financeiro, WhatsApp, email, N8N e checkout.
7. Congelar Lovable como backup temporario.
8. Excluir Lovable somente apos aceite operacional.

### Segredo Core

`IMPULSIONANDO_CORE_SECRET` deve ser usado apenas para ponte legada e webhooks internos temporarios.

Novo cliente/projeto nao deve nascer no Lovable. Deve nascer diretamente no Core Impulsionando via fabrica/provisionador canonico.

## Plano seguro por fases

### Fase 2 - Consolidar criacao de tenants

Objetivo: tornar `createProjectFromFactory` o unico caminho oficial.

Tarefas:

- corrigir ou aposentar `tenant-provisioning.functions.ts`;
- trocar `company_kind = 'tenant'` por padrao valido (`real`, `demo`, `sandbox` ou `interna`);
- garantir criacao de `core_tenant_identity` no fluxo canonico;
- garantir que `ricks@hotmail.com` tenha acesso master;
- adicionar teste de criacao de tenant sem tocar producao.

### Fase 3 - Consolidar marketplace de modulos

Objetivo: planos, modulos, precos e permissao serem 100% administraveis pelo dashboard master.

Tarefas:

- remover dependencia de preco fixo como fonte final;
- ler preco de tabela configuravel;
- implementar rollback versionado por tenant;
- documentar upgrade/downgrade por plano.

### Fase 4 - Consolidar cobranca, wallet e Mercado Pago

Objetivo: assinatura, taxa da plataforma, split, repasse e suspensao automatica.

Tarefas:

- definir Mercado Pago como gateway oficial ou marcar alternativas como legado;
- parametrizar fallback PIX/WhatsApp por tenant;
- validar `core_fee_rules` para 2% PIX e 6% cartao quando aplicavel;
- validar ciclo de dunning e suspensao.

### Fase 5 - Consolidar N8N

Objetivo: importar, ativar, pausar e monitorar workflows por tenant via Core.

Tarefas:

- criar catalogo operacional dos workflows;
- associar workflow a modulo/plano;
- registrar webhook por tenant;
- health-check e reprocessamento pelo dashboard.

### Fase 6 - Reduzir Lovable a legado

Objetivo: remover Lovable da operacao normal.

Tarefas:

- substituir hosts `.lovable.app` por dominio proprio/configuracao;
- isolar `@lovable.dev/*` atras de adaptador legado;
- remover scripts que usam Lovable como base padrao;
- manter apenas ponte temporaria para migracao.

### Fase 7 - Validacao final

Objetivo: provar que Core, GitHub, Supabase e N8N estao alinhados.

Tarefas:

- rodar testes locais possiveis;
- rodar GitHub Actions;
- aplicar migrations no Supabase oficial somente via workflow validado;
- confirmar tabelas, tenants, RLS, billing, N8N e login master;
- emitir checklist final de independencia.

## Proximo passo recomendado

Avancar para a Fase 2 somente depois de aceitar este diagnostico como baseline.

Primeira correcao da Fase 2: consolidar criacao de tenants, porque sem isso todo o restante fica instavel. A correcao deve ser feita sem alterar frontend visual e sem tocar producao: apenas ajustar a camada de provisionamento, migrations seguras e testes.
