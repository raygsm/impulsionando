# Auditoria Master — Wave 02 — CHRISMED

Data: 2026-08-31
Status: IN_PROGRESS

## Mercado Pago — correção verificada no runtime público
A rota pública da CHRISMED está apontando no Nginx para `127.0.0.1:3488`.
O container nessa porta executa a imagem `impulsionando-core:10afb9205fc999a89f96fe70ca51251e3bf58ba5`.

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
- lifecycle `active` no health;
- DNS `active`;
- SSL `issued`;
- credencial production ativa;
- public key configurada;
- access token configurado;
- webhook secret configurado;
- chamada real à API Mercado Pago HTTP 200;
- 11 métodos de pagamento retornados.

Conclusão desta subetapa: o drift de resolução de tenant foi corrigido, deployado e verificado no nível health/credenciais/resolução. Isso NÃO substitui teste transacional completo.

## Rotas essenciais no runtime atual
Testadas diretamente no runtime da porta 3488:
- `/` HTTP 200;
- `/chrismed` HTTP 200;
- `/chrismed/agendar` HTTP 200;
- `/chrismed/internacional` HTTP 200.

## Agenda pública — achado P1
A rota ativa `src/routes/chrismed.agendar.tsx` consulta dados reais para ofertas e disponibilidade, mas ainda importa `CHRISMED_SPECIALTIES`, `CHRISMED_DOCTORS` e `CHRISMED_UNITS` de `src/data/chrismed-mock.ts`.

O próprio arquivo `chrismed-mock.ts` declara explicitamente que é mock visual Wave 1 e deveria ser substituído por backend real quando endpoints estivessem disponíveis.

### Estado real observado
- Ofertas: `chrismed_service_offerings` real.
- Slots: RPC real `list_chrismed_available_slots`.
- A RPC filtra profissional ativo com `profile_status in ('approved','active')`, cruza agenda real, blocks e appointments e impede conflito com holds/pagamentos/confirmações.
- Especialidades, profissional exibido e unidades: ainda provenientes do arquivo marcado como mock/static config.

### Consequência
Não considerar a jornada de agenda integralmente homologada enquanto o frontend depender de fonte marcada como mock para entidades de domínio que já possuem representação no backend.

### Correção requerida
Substituir o uso do arquivo mock na rota ativa por catálogo público real/seguro de profissionais, especialidades, modalidades e unidades. Preservar somente tipos/helpers neutros em arquivo sem semântica de mock. Não publicar profissionais incompletos ou não aprovados.

## Profissionais — consistência
No backend existe a Dra. Christiane aprovada/ativa e existe também outro registro `is_active=true` porém `profile_status=incomplete`.

A RPC de disponibilidade está correta ao excluir o registro incompleto. A futura consulta pública deve manter a mesma regra: somente `approved/active` e explicitamente publicável.

## Ofertas e preços — conflito de produto; não alterar silenciosamente
O banco atualmente possui:
- Consulta Presencial: 120000 centavos;
- Teleconsulta: 60000 centavos;
- Consulta Domiciliar: 240000 centavos;
- ASO: 11000 centavos;
- Perícia/laudo: 240000 centavos.

A migration `20260809124500_chrismed_offerings_and_occupational_intake.sql` chama os três primeiros valores de preços oficiais. Entretanto há histórico de produto anterior com valores diferentes para presencial, teleconsulta e domiciliar.

Por se tratar de preço cobrado ao paciente, isto é ambiguidade comercial material. Antes do go-live final, resolver a fonte oficial vigente e então sincronizar banco, frontend, Oliver, templates e checkout. Não cobrar com base em suposição.

## Pagamentos — aprofundamento
- `mpago-create-payment` ativo v13.
- Para CHRISMED exige hold token válido, não expirado, status `held/pending_payment` e identidade de e-mail compatível.
- Valor é derivado da oferta/metadata do appointment, não aceito cegamente do browser.
- Idempotência CHRISMED deriva do appointment.
- A antiga função `chrismed-e2e-pix-test` está desativada e retorna 410; não serve como prova atual.
- Continua faltando E2E transacional completo controlado sem cobrança indevida.

## Comunicação — falha real produtor/consumidor
O trigger `chrismed_notify_management_appointment_change` produz:
- `management_appointment_created`;
- `management_appointment_cancelled`;
- `management_appointment_rescheduled`.

O Edge Function ativo `chrismed-communication-worker` v7 não possui esses aliases no `TEMPLATE_MAP`.

Resultado observado: `management_appointment_created` continua entrando em dead letter com `template_mapping_missing:management_appointment_created`.

Há registros históricos `sent` desse evento anteriores ao worker atual, mas isto não prova o caminho atual.

### Regra de correção
Não mapear cancelamento/reagendamento gerencial para templates de paciente. Criar templates gerenciais próprios, adicionar mappings explícitos ao worker, versionar migration + Edge Function e testar. Não reprocessar automaticamente dead letters históricos antes de classificar se eram testes ou comunicações reais.

## Templates/outbox
- 57 templates CHRISMED publicados.
- Cobertura observada: EMAIL / pt-BR.
- Multicanal e PT/EN/ES continuam pendentes.
- A outbox possui entregas reais `sent`, portanto o canal email não é apenas estrutura inerte.
- Dead letters atuais impedem declarar a comunicação 100% homologada.

## N8N
Runtime N8N está ativo e lista grande conjunto de workflows CHRISMED, incluindo appointment-created/cancelled/rescheduled/reminders, check-in, pesquisa, eventos, pagamentos, pega-agenda, reativação e ocupacional/SST.

Também existem duplicatas aparentes com prefixos `Impulsionando |` e `CHRISMED |` para vários fluxos equivalentes. Não apagar automaticamente. Primeiro determinar IDs canônicos, estado ativo, triggers/webhooks, dependências e execuções recentes; depois consolidar sem risco de dupla execução.

## Plano Full
Plano CHRISMED: ENTERPRISE / Full. Política declara todos os módulos homologados incluídos, porém somente Agenda, CRM e Central de Suporte estão hoje certificados no catálogo. Agente Virtual, Analytics, Automação, Omnichannel, Financeiro/Cobrança, Eventos, CP — Chat Privado e Saúde permanecem em homologação/testes.

Full dá direito ao catálogo homologado; não transforma módulo ainda em testes em módulo certificado.

## Próxima fronteira CHRISMED
- remover dependência de mock da agenda pública;
- resolver preços oficiais vigentes;
- corrigir comunicação gerencial dead-letter;
- E2E hold -> pagamento -> webhook -> confirmação sem cobrança indevida;
- provar remarcação/cancelamento/retorno;
- provar jornadas N8N sem duplicidade;
- cobertura multicanal/PT-EN-ES;
- validar Oliver contra catálogo/agenda reais;
- QA visual mobile/desktop;
- isolamento paciente/profissional/master;
- segurança/RLS/cross-tenant/logs;
- somente então marcar VERIFIED.

## Intake subsequente já registrado
Após o fechamento da auditoria master, executar o intake de especialização vertical obrigatória dos agentes, CTA e inteligência social, sem interromper a auditoria atual.