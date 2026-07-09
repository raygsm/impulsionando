# Onda 3 — Core Impulsionando · Relatório Final

Encerramento oficial da Onda 3 do ecossistema **Impulsionando**. Consolida
Cliente 360, Cortesia Full 30 dias, Cérebro IA por Cliente, Hub Cobrança &
Mercado Pago e Hub Automações & N8N.

## Resumo executivo

A Onda 3 transformou o Core em um **cockpit único e auditável** para operar
todos os clientes conectados: uma tela por cliente com 12 abas, cortesia
Full parametrizável com auditoria, base real do Cérebro IA por cliente com
RLS por `company_id`, e dois hubs somente-leitura que consolidam operação
financeira (Mercado Pago) e automação (N8N + webhooks + WhatsApp).

Todo o trabalho foi feito preservando billing existente, sem disparar
mensagens reais e mantendo a copy voltada a “cliente/empresa” — nunca
“tenant” em UI.

## Fases concluídas

| Fase | Escopo | Status |
| --- | --- | --- |
| 3.1 | Consolidação do Shell Core (menu, grupos, buscas) | ✅ frontend-only |
| 3.2 | Cliente 360 — 12 abas oficiais em `/admin/clientes/$slug/*` | ✅ frontend-only |
| 3.3 | Cortesia Full 30 dias + parâmetro global + auditoria | ✅ com backend controlado |
| 3.4 | Cérebro IA por Cliente (config, KB, eventos) | ✅ com backend controlado |
| 3.5 | Hub Cobrança & MP + Hub Automações & N8N | ✅ frontend-only |
| 3.6 | Documentação final, matriz de maturidade e handoff | ✅ esta fase |

## Hubs e áreas criadas

- **Cliente 360** (`/admin/clientes/$slug/*`) — 12 abas: Painel, Dados,
  Plano e cortesia, Módulos, Cérebro IA, Automações, Financeiro, Mercado
  Pago, Domínios, Publicação, Logs, Configurações.
- **Hub Cobrança & Mercado Pago** — `/core/hub-cobranca` — MRR, contratos,
  cortesias ativas, top clientes, saúde de webhooks MP.
- **Hub Automações & N8N** — `/core/hub-automacoes` — execuções N8N,
  credenciais pendentes, top réguas, canais, webhooks e runtime.

## Arquivos principais

Frontend / rotas:
- `src/routes/_authenticated/core.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.dados.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.plano.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.cerebro-ia.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.mercado-pago.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.publicacao.tsx`
- `src/routes/_authenticated/core.hub-cobranca.tsx`
- `src/routes/_authenticated/core.hub-automacoes.tsx`

Server functions:
- `src/lib/courtesy.functions.ts`
- `src/lib/ai-brain.functions.ts`

Migrations aplicadas:
- Onda 3.3 — `companies.full_courtesy_*`, `core_settings.full_courtesy_days_default`, tabela `core_courtesy_events`.
- Onda 3.4 — tabelas `core_ai_brains`, `core_ai_brain_knowledge`, `core_ai_brain_events` com RLS por `company_id` e staff Impulsionando.

Documentação:
- `docs/ONDA_3_1_CORE_SHELL.md`
- `docs/ONDA_3_2_CLIENTE_360.md`
- `docs/ONDA_3_3_CORTESIA_FULL.md`
- `docs/ONDA_3_4_CEREBRO_IA_CLIENTE.md`
- `docs/ONDA_3_5_COBRANCA_AUTOMACOES.md`
- `docs/ONDA_3_FINAL.md` (este)
- `docs/PROJECT_STATE.md`, `docs/MASTER_SPEC.md`, `docs/INTEGRATIONS.md`,
  `docs/PLANS.md`, `docs/MODULES.md`, `docs/DEPLOY.md`,
  `docs/KNOWN_LIMITATIONS.md`, `docs/TEST_CHECKLIST.md`.

## Matriz de maturidade (Onda 3)

Legenda: 🟢 pronto · 🟡 pronto com pendências externas · 🔵 base pronta, integração real futura

| Área | Maturidade | Observações |
| --- | --- | --- |
| Shell Core | 🟢 | Menu, grupos, busca e breadcrumbs consolidados. |
| Cliente 360 (12 abas) | 🟢 | Rotas ativas; abas visuais respondem no ecossistema. |
| Cortesia Full 30 dias | 🟢 | Schema, RLS, RPCs, UI, badge no header, auditoria. |
| Parâmetro global cortesia | 🟢 | `core_settings.full_courtesy_days_default`. |
| Cérebro IA por Cliente | 🟢 | CRUD real + KB + eventos; sem dispatcher em prod. |
| Hub Cobrança & MP | 🟢 | Read-only; ações continuam nas telas dedicadas. |
| Hub Automações & N8N | 🟢 | Read-only; agrega saúde 30d. |
| Integração Mercado Pago | 🟡 | Depende de credenciais/homologação em produção. |
| Integração N8N | 🟡 | Depende de instância + token do cliente. |
| WhatsApp Cloud API | 🟡 | Depende de `core_whatsapp_credentials`. |
| E-mail transacional | 🟡 | Depende de domínio verificado. |
| Dispatcher do Cérebro IA | 🔵 | Base pronta; execução real fica para Onda 4. |
| Conversão em lote de cortesia | 🔵 | Hoje individual pelo Cliente 360. |
| Alertas proativos (cortesia ≤ 7d, falha N8N > X%) | 🔵 | Sinais existem; roteamento p/ `core_incidents` na Onda 4. |

## Dependências de credenciais

- **Mercado Pago**: Access Token (server secret) + Public Key + Webhook URL
  configurados em `/core/integracoes/mercadopago`.
- **N8N**: instância + token em `/core/integracoes/n8n`.
- **WhatsApp Cloud**: phone_number_id + token gravados em
  `core_whatsapp_credentials` por cliente.
- **E-mail transacional**: domínio verificado no provedor + registros DNS.

Enquanto essas credenciais não estiverem preenchidas em produção, os hubs
mostram contadores zerados e nenhum disparo real ocorre — comportamento
esperado.

## Checklist de homologação (Onda 3)

1. Login como staff Impulsionando (`raygs@hotmail.com`) → `/core` abre.
2. `/core/hub-cobranca` carrega KPIs sem erro; lista de cortesias visível.
3. `/core/hub-automacoes` carrega KPIs sem erro; credenciais pendentes listadas.
4. `/admin/clientes/<slug>` renderiza as 12 abas oficiais.
5. Aba **Plano e cortesia**: conceder cortesia 30 dias, estender +7d, revogar,
   e alterar padrão global — todas geram evento em `core_courtesy_events`.
6. Aba **Cérebro IA**: criar rascunho, ativar, adicionar/remover item da KB —
   eventos aparecem no histórico.
7. Aba **Mercado Pago** do cliente abre sem erro e não expõe credenciais.
8. Cliente-teste `raygsmonnerat@gmail.com` continua com acesso limitado.
9. RLS: usuário fora do `company_id` **não** vê o Cérebro IA de outro cliente.
10. Nenhum WhatsApp/e-mail real é disparado durante a homologação.

## Riscos

- Cortesias sem `full_courtesy_ends_at` ficam “ativa sem contador” até que
  a Onda 3.3 seja usada em produção — esperado.
- Hubs agregam janelas de 30 dias e podem ficar lentos em tenants muito
  ativos; mitigado por `useQuery` sem `refetchInterval`.
- Ativar disparos reais sem credenciais válidas gera falha silenciosa nas
  telas dedicadas — o hub sinaliza pelas colunas de erro.

## Instruções de deploy / handoff de publicação

Ambiente Lovable, resumido em `docs/DEPLOY.md`:

1. **Alterações de frontend** (rotas, hubs, UI): vão para produção somente
   após clicar **Publish → Update** no editor Lovable. O Codex/agente
   **não publica sozinho** — só prepara os artefatos.
2. **Alterações de backend** (migrations, server functions, RLS): entram
   em produção automaticamente na aprovação da migration/deploy do
   backend. As migrations 3.3 e 3.4 já foram aplicadas.
3. **Domínios / URLs estáveis**: mantidos — `impulsionando.lovable.app`
   (produção) e domínios customizados listados em `project_urls`.
4. **Pipeline externo (GitHub/CI)**: qualquer promoção adicional para
   ambientes fora do Lovable exige pipeline próprio; hoje o padrão é
   Lovable como plataforma canônica.
5. **Segurança antes de publicar**: rodar security scan e confirmar
   ausência de findings críticos.

## Limitações relevantes

- Codex/agente não dispara `Publish` sozinho; publicação é ação humana.
- Sem credenciais reais, Mercado Pago/N8N/WhatsApp ficam em modo
  observador.
- Dispatcher do Cérebro IA (execução automatizada de mensagens) não
  está ativado nesta onda.
- Conversão em lote de cortesia e alertas proativos ficam para Onda 4.

## Próximos passos (Onda 4 recomendada)

1. **Dispatcher IA por cliente** — orquestrar Cérebro IA + canais reais
   (WhatsApp, e-mail, in-app) com fallback humano e SLA.
2. **Analytics unificado** — Dashboard Master reutilizando os agregados
   dos hubs; drill-down por cliente/nicho/régua.
3. **Cortesia → cobrança em lote** — política e assistente para converter
   coortes de cortesia próxima do fim.
4. **Alertas proativos** — `core_incidents` gerado por cortesia ≤ 7d,
   integrações com erro, falha N8N > X%, assinatura MP inválida.
5. **Governança de credenciais** — cockpit dedicado por cliente para
   coletar Mercado Pago, WhatsApp e N8N com validação e testes.
6. **Marketplace B2B GMV** — evoluir a “Taxa de Intermediação Digital”
   com relatórios e overrides por nicho/fornecedor.
