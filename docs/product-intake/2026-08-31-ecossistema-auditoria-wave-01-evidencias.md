# Auditoria Master — Wave 01 — Evidências reais

Data: 2026-08-31

## CHRISMED
- Produção HTTP: 200.
- Tenant SSR: `chrismed`.
- `/agendar`: corrigido de redirect legado para rota real, agora HTTP 200 direto.
- `/dra-cristiane`: corrigido de redirect legado para rota real, agora HTTP 200 direto.
- `/gms`: alias controlado para `/internacional`; destino HTTP 200.
- Logo/brasão/retrato CHRISMED presentes no runtime.
- Banco: tenant ativo, não-demo, identidade canônica DNS active / SSL issued.
- Plano associado: Full/ENTERPRISE, due day 5.
- Inconsistência: lifecycle `plan_required` apesar de operação autorizada/Full associado.
- Full: política declara all-included, mas apenas Agenda, CRM e Central de Suporte constam certificados em `billing_plan_modules`; não declarar Full integral homologado ainda.
- Templates: biblioteca EMAIL pt-BR extensa e publicada; cobertura multicanal/PT-EN-ES ainda precisa de prova.
- N8N: runtime ativo; workflows CHRISMED instalados; 31 estados de jornada registrados, maioria READY, outbox ACTIVE; `last_execution_at` nulo nos estados consultados, portanto falta prova E2E.
- Mercado Pago: drift de resolução de tenant identificado no health/webhook. Correção aplicada à `main` nos commits `b71ed7b9e38e63c14f609435a9f4119ae6503661` e `10afb9205fc999a89f96fe70ca51251e3bf58ba5`.
- Mercado Pago: correção posteriormente publicada no runtime público. `GET /api/public/health/mp/chrismed` retornou `status=ok`, tenant correto, credencial production ativa, public key/access token/webhook secret configurados e chamada real à API do Mercado Pago HTTP 200 com 11 métodos. Webhook GET diagnóstico também retornou tenant `chrismed`. Isto homologa resolução/credenciais/health, mas ainda NÃO substitui E2E transacional de pagamento real.

## CHRISMED — Wave 02 / aprofundamento

### Plano Full / catálogo de módulos
- Enrollment CHRISMED aponta para o plano `028627a2-56ae-4bac-b9d8-a3f4e1089f51`, `ENTERPRISE / Full`.
- Metadata do plano declara `modules_policy=all_included_unlimited_use`, `module_capacity=-1` e `entitlement_policy=certified_dynamic`.
- O próprio plano registra `included_certified_modules=3` e bloqueia checkout direto por `mercadopago_core_checkout_e2e_not_homologated` até `billing.e2e_passed`.
- No catálogo ativo existem 11 módulos: CRM, Agenda e Central de Suporte estão `certificado/pronto_para_venda`; Agente Virtual, Analytics, Automação, Omnichannel, Financeiro e Cobrança, Eventos, CP — Chat Privado e Saúde estão `em_testes/em_homologacao`.
- Conclusão: Full significa direito a todos os módulos homologados, mas NÃO é tecnicamente correto declarar todos os módulos do ecossistema homologados hoje. A auditoria deve promover cada módulo somente após seus testes reais.

### Comunicação / templates
- Tenant de comunicação CHRISMED ativo: `94bf647c-c851-41ab-8700-1e062263e54d`.
- Existem 57 templates CHRISMED não excluídos.
- Os 57 estão em status `PUBLISHED`.
- Cobertura observada: somente canal `EMAIL`, locale `pt-BR`.
- Portanto PT/EN/ES e WhatsApp/SMS/outros canais continuam pendentes e não podem ser declarados completos.

### Outbox / entrega real
- Foram observados 50 itens na `chrismed_communication_outbox`: 44 `sent` e 6 `dead_letter`, todos no canal email.
- Último envio observado: 2026-08-31 16:48:33 UTC.
- Os 6 dead letters têm a mesma causa: `template_mapping_missing:management_appointment_created`.
- A origem foi localizada na função/trigger `chrismed_notify_management_appointment_change`, que emite `management_appointment_created`, `management_appointment_cancelled` e `management_appointment_rescheduled`.
- O worker `chrismed-communication-worker` não possui atualmente esses três aliases no `TEMPLATE_MAP`; portanto existe incompatibilidade real produtor → consumidor.
- Há templates publicados para `appointment.confirmed.management`, `appointment.cancelled` e `appointment.rescheduled`, mas cancelamento/reagendamento existentes têm linguagem dirigida ao paciente. Não fazer alias cego para destinatário gerencial; criar/migrar templates gerenciais semanticamente corretos e testar antes de reprocessar dead letters.

### Oliver
- `communication_agents`: Oliver ativo, role `client_health_concierge`, reply route `/api/agents/omnichannel`.
- Runtime `chrismed-oliver` ativo, `knowledge_scope=tenant`, prompt ref `chrismed/oliver`.
- CTA já diferencia paciente, empresa e social.
- O prompt de Oliver já possui guardrails clínicos fortes, anti-alucinação, triagem de emergência, agenda, GMS, ocupacional, eventos e conversão ética.
- O link legado `https://chrismed.com.br/agendar_teleconsulta/` usado no prompt foi testado e retorna HTTP 200; não é link morto. Ainda assim, a auditoria deve decidir e padronizar qual rota é canônica entre domínio próprio e subdomínio Impulsionando.

## Runtime/VPS
- Host: `srv1777313`.
- Nginx, Docker, Core e N8N ativos.
- Runtime CHRISMED público: canary `core-bfdc-canary` / porta 3488; o container atual observado usa imagem `impulsionando-core:10afb9205fc999a89f96fe70ca51251e3bf58ba5`.
- Muitos containers preview/test/legado continuam ativos. Classificar antes de remover.
- Publisher histórico possui status de erro de 2026-08-20; não reutilizar cegamente para publicação atual.
- Nginx apresenta warning de MIME `application/javascript` duplicado; P3.

## Matriz HTTP inicial de fronts nomeados
Todos responderam HTTP 200 na raiz no teste inicial:
- chrismed
- anamadu
- marocas
- csi
- grupoevr
- colorssaude
- revela
- ontap
- raoni
- riobeer
- spartacus
- peroladavila
- sulatlantica
- wmp

HTTP 200 NÃO equivale a frontend correto.

Identificação SSR observada:
- CHRISMED: título correto e `data-tenant=chrismed`.
- Ana Madú: título coerente com Ana Madú.
- Marocas: título coerente e `data-tenant=marocas`.
- CSI: título coerente com CSI Invest.
- Grupo EVR: título coerente com Grupo EVR.
- Colors Saúde: título coerente.
- REVELA: título coerente.
- WMP: título coerente.
- OnTap, Raoni, Rio Beer, Spartacus e Pérola da Vila: conteúdo nominal correto encontrado, porém sem `<title>` no HTML inicial; SEO/metadata pendente.
- Sulatlântica: P1 — raiz retorna título `Clube Impulsionando`, não um frontend Sulatlântica. Não considerar publicada corretamente.

## Inventário de dados — achado de higiene
O banco contém grande volume de empresas ativas geradas por testes E2E/cross-tenant/storage/signed-url (`Cross A/B`, `Meta A/B`, `E2E Core Iso`, `Storage Co`, `Signed URL Co`, etc.). Muitos registros são demo, mas alguns E2E aparecem como `is_demo=false` e com subdomínios pending.

Isso exige uma etapa específica de classificação e limpeza controlada. Não excluir automaticamente: primeiro provar origem, dependências e ausência de referência operacional.

## Identidades reais confirmadas no banco
Entre os tenants reais encontrados estão: Ana Madu, CHRISMED, Colors Saúde, CSI Invest, DQA, FE Personal, Grupo EVR, Haunted, Imobiliária Garrido, Impulsionando Tecnologia, Impulsionando Tour, Instituto EVR, Lopes Enjoy, Marocas, OnTap, Plataforma Saúde, Raoni, REVELA, Rio Beer, Rio Med, Salão Pérola da Vila, Spartacus, Sulatlântica, Universidade e WMP, além de outros registros a classificar.

## Próximas verificações obrigatórias
1. Concluir CHRISMED: E2E de agenda/pagamento, corrigir incompatibilidade da comunicação gerencial, provar jornadas e fazer QA visual.
2. Auditar Core/entitlements Full e reconciliar política `all_included_unlimited_use` com catálogo certificado, sem promover módulos ainda em testes.
3. Resolver lifecycle `plan_required` dos tenants já associados ao Full sem criar dívida histórica nem iniciar cobrança indevida.
4. Auditar DNS/SSL: muitos tenants reais estão marcados `pending` no banco apesar de alguns hosts responderem publicamente; reconciliar estado observado x metadata.
5. Corrigir Sulatlântica, atualmente servindo experiência do Clube.
6. Completar SEO/metadata dos fronts de bares/restaurantes.
7. Auditar logos oficiais tenant por tenant usando asset já fornecido como primeira fonte; internet oficial somente quando o arquivo não estiver disponível.
8. Resolver DIBA pela identidade correta antes de criar demo; não misturar DIBA 695 com outra referência sem evidência.
9. Classificar containers e registros de teste antes de qualquer limpeza.
10. Só marcar VERIFIED após teste ponta a ponta no ambiente correto.