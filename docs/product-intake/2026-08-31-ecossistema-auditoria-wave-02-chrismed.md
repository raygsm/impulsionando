# Auditoria Master — Wave 02 — CHRISMED

Data: 2026-08-31

## Mercado Pago — correção agora verificada no runtime público

A rota pública da CHRISMED está apontando no Nginx para `127.0.0.1:3488`.
O container atualmente nessa porta executa a imagem `impulsionando-core:10afb9205fc999a89f96fe70ca51251e3bf58ba5`.

### Webhook
`GET https://chrismed.impulsionando.com.br/api/public/mercado-pago/chrismed`

Resultado observado: HTTP 200 e payload de identificação do tenant `chrismed`.

### Health per-tenant
`GET https://chrismed.impulsionando.com.br/api/public/health/mp/chrismed`

Resultado observado:
- HTTP 200;
- status `ok`;
- tenant CHRISMED resolvido pela identidade canônica;
- empresa ativa;
- lifecycle `active`;
- DNS `active`;
- SSL `issued`;
- credencial production ativa;
- public key configurada;
- access token configurado;
- webhook secret configurado;
- chamada real à API Mercado Pago HTTP 200;
- 11 métodos de pagamento retornados.

Conclusão desta subetapa: o drift de resolução de tenant encontrado na Wave 01 foi corrigido, deployado no runtime público CHRISMED e verificado. A integração Mercado Pago deixa de ser apenas `DEPLOYED` e passa a `VERIFIED` no nível de health/credenciais/resolução. Isso ainda não substitui o teste transacional completo de uma compra/agendamento real.

## Rotas essenciais no runtime atual
Testadas diretamente no runtime da porta 3488:
- `/` HTTP 200;
- `/chrismed` HTTP 200;
- `/chrismed/agendar` HTTP 200;
- `/chrismed/internacional` HTTP 200.

## Próxima fronteira CHRISMED
- teste E2E de agenda sem gerar cobrança indevida;
- confirmação das regras de pagamento em fluxo controlado;
- prova das jornadas N8N e outbox;
- cobertura multicanal e PT/EN/ES;
- entitlements Full;
- QA visual e responsivo;
- isolamento de papéis paciente/profissional/master;
- segurança/RLS e logs.

## Intake subsequente já registrado
Após o fechamento da auditoria master, executar o intake de especialização vertical obrigatória dos agentes, CTA e inteligência social, sem interromper a auditoria atual.