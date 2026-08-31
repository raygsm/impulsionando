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
- Mercado Pago: drift de resolução de tenant identificado no health/webhook. Correção aplicada à `main` nos commits `b71ed7b9e38e63c14f609435a9f4119ae6503661` e `10afb9205fc999a89f96fe70ca51251e3bf58ba5`; ainda não marcada VERIFIED em produção porque o runtime público continua no SHA `c054ceb3da481cb5cfe3778fa4249d7ff6820a6b`.

## Runtime/VPS
- Host: `srv1777313`.
- Nginx, Docker, Core e N8N ativos.
- Runtime CHRISMED público: canary `core-bfdc-canary` / SHA `c054ceb3da481cb5cfe3778fa4249d7ff6820a6b` / porta 3488.
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
1. Concluir CHRISMED antes de declarar homologação integral: deploy seguro das correções MP, health, credenciais externas, E2E de agenda/pagamento, jornadas e QA visual.
2. Auditar Core/entitlements Full e reconciliar política `all_included_unlimited_use` com catálogo certificado.
3. Resolver lifecycle `plan_required` dos tenants já associados ao Full sem criar dívida histórica.
4. Auditar DNS/SSL: muitos tenants reais estão marcados `pending` no banco apesar de alguns hosts responderem publicamente; reconciliar estado observado x metadata.
5. Corrigir Sulatlântica, atualmente servindo experiência do Clube.
6. Completar SEO/metadata dos fronts de bares/restaurantes.
7. Auditar logos oficiais tenant por tenant usando asset já fornecido como primeira fonte; internet oficial somente quando o arquivo não estiver disponível.
8. Resolver DIBA pela identidade correta antes de criar demo; não misturar DIBA 695 com outra referência sem evidência.
9. Classificar containers e registros de teste antes de qualquer limpeza.
10. Só marcar VERIFIED após teste ponta a ponta no ambiente correto.