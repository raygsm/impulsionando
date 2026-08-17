# MAROCAS — CHECKPOINT DE EXECUÇÃO

Data: 2026-08-16
Projeto pai: Impulsionando sistemas / Impulsionando Tecnologia
Cliente: Marocas
Agente central: Impulsionito
Instância especializada: Maruquito
Regra de continuidade: ao receber “Continue” ou “Retome do último checkpoint”, verificar o estado real e seguir deste ponto sem reiniciar nem repetir trabalho concluído.

## Infraestrutura correta
- NÃO usar Vercel neste ecossistema.
- Código/versionamento: GitHub.
- Banco/backend/auth: Supabase.
- Hospedagem/aplicações: Hostinger/VPS Hostinger.
- DNS/SSL/proxy/proteção: Cloudflare.
- Automações: n8n próprio na VPS Hostinger.
- Qualquer referência anterior a bloqueio por Vercel está revogada e deve ser ignorada.

## Cliente-piloto real para homologação
- Loft Copanema é cliente/imóvel real da operação Marocas.
- URL informada pelo proprietário: https://airbnb.com.br/h/loftcopanema
- Usar como primeiro caso E2E real da Marocas.
- Não inventar reservas, hóspedes, datas, preços, pagamentos, códigos de acesso, estoque ou status.
- Jornada alvo: reserva real -> checkout -> janela operacional -> limpeza -> checklist -> reposição -> evidências -> conferência -> imóvel liberado -> próximo check-in.

## Estado real consolidado

### Maruquito
- `communication_agents`: agente Maruquito ativo no tenant Marocas.
- `communication_agent_runtime`: `marocas-maruquito`, `CLIENT_INSTANCE`, root Impulsionito, `system_prompt_ref=marocas/maruquito/v1`.
- Endpoint `/api/impulsionito/chat` resolve `/marocas` server-side para `marocas-maruquito`, sem confiar em tenant/agent key enviados pelo navegador.
- FAB Maruquito convertido de menu estático para chat real usando transporte do Impulsionito.
- Política explícita de não inventar preços, status, reservas, pagamentos, equipe, estoque, acesso ou diagnóstico.
- Status: 🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE.

### Backend Marocas existente
Existem estruturas reais para imóveis, proprietários, profissionais, serviços, suprimentos, manutenção, orçamentos de manutenção, demonstrativos e relatórios. O estado inicial auditado das principais tabelas operacionais era zero registros reais; telas ainda utilizavam mocks em pontos importantes.

### Reservas e giro entre hóspedes
Migration aplicada no Supabase live: `marocas_reservations_turnovers_checklists_v1`.
Criados:
- `marocas_reservations`
- `marocas_turnovers`
- `marocas_checklist_templates`

`marocas_turnovers` calcula no banco:
- `window_minutes`
- `window_status`: `impossivel`, `critica`, `apertada`, `confortavel`.

`marocas_services` recebeu vínculos para reserva, giro, checklist e horário final previsto.
RLS foi habilitado nas novas tabelas com isolamento por empresa + equipe Impulsionando.
Status: 🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE.

### Fluxo de reserva real
Arquivo: `src/lib/marocas-operations.functions.ts`.
- lista reservas reais;
- lista giros reais;
- cria reserva autenticada;
- rejeita sobreposição no mesmo imóvel;
- busca reserva anterior/seguinte;
- cria giro quando necessário;
- gera serviço de limpeza vinculado ao giro;
- utiliza checklist ativo do imóvel quando configurado;
- trata corrida de criação sem depender de inferência de índice parcial no upsert.
Status: 🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE.

### Telas sem mocks
`/marocas/app/anfitriao/reservas`
- removido `MOCK_RESERVAS`;
- lista fonte real;
- cadastro de reserva real;
- sem preço fictício.

`/marocas/app/anfitriao/limpezas`
- removido `MOCK_AGENDA`;
- removido SLA fictício `2h 12min`;
- exibe giros reais, janela operacional e risco;
- duração média só é exibida com dados efetivamente medidos.

Status: 🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE.

### Guarda P0 de conclusão
Migration aplicada no Supabase live: `marocas_service_completion_guards_v1`.
- índice único de serviço por giro;
- trigger `trg_marocas_enforce_service_completion`;
- giro não pode ser concluído sem checklist ativo;
- checklist obrigatório precisa estar completo;
- fotos de antes/depois são exigidas conforme template;
- `completed_at` é preenchido na conclusão.
Status: 🟡 IMPLEMENTADO — TESTE E2E PENDENTE.

## Drift identificado no Core Agenda
Em 2026-08-16 foi confirmado que o código atual do Core já usa `agenda_appointments`, `agenda_services`, `agenda_locations`, `agenda_rooms`, `agenda_rules`, `agenda_settings` e `agenda_oncall_shifts`, mas essas tabelas não existem no Supabase live atual. A migration histórica de Agenda existe no repositório, porém não aparece no histórico de migrations do live atual, que começa em 2026-07-30. Não criar agenda paralela da Marocas. Antes de ligar limpeza/turnover à agenda, reconciliar o Core Agenda de forma segura e compatível com o schema live.
Status: 🟠 PARCIAL / DRIFT CÓDIGO-BANCO CONFIRMADO.

## Segurança
RLS básico por empresa existe, mas ainda não atende integralmente aos perfis finos exigidos (proprietário, profissional designado, prestador, dados financeiros e acesso sensível). Dados de fechadura/cofre/senha ainda precisam de uma estrutura dedicada com need-to-know e auditoria. Não considerar segurança Marocas concluída.
Status geral: 🟠 PARCIAL.

O advisor do Supabase também sinalizou dívida de segurança global preexistente no projeto, inclusive `marocas_company_id()` como SECURITY DEFINER executável por authenticated. Inspecionar função e dependências antes de alterar privilégios.

## Deploy/hospedagem
Validar exclusivamente no pipeline real GitHub -> Hostinger/VPS + Cloudflare. Não usar Vercel.
Status: 🟠 PIPELINE REAL AINDA PRECISA SER AUDITADO/HOMOLOGADO.

## Pendências P0/P1 imediatas
1. Reconciliar Core Agenda entre código e Supabase live sem criar módulo paralelo Marocas.
2. Integrar serviço de giro com a agenda universal do Core depois da reconciliação.
3. Executar E2E autenticado com o Loft Copanema usando apenas dados reais: imóvel -> duas reservas reais -> giro -> limpeza -> checklist -> fotos -> conclusão.
4. Implementar RLS/RBAC fino por perfil e imóvel designado.
5. Criar armazenamento seguro de códigos/senhas/chaves/cofre com acesso auditável e need-to-know.
6. Conectar Maruquito a tools reais de consulta/ação; identidade e roteamento estão prontos, mas consultas operacionais tool-first ainda não estão integralmente implementadas.
7. Auditar e remover mocks restantes de todas as rotas Marocas.
8. Evoluir reposição para estrutura transacional/Core Inventory; o MVP atual ainda usa `notes` JSON para parte do pedido de suprimento.
9. Implementar ocorrências gerais e vínculo com tickets universais.
10. Validar CRM, contratos, pagamentos, planos recorrentes, templates, jornadas, n8n, analytics, UTM, SEO, mobile, logs e backups.
11. Auditar pipeline GitHub -> Hostinger/VPS + Cloudflare e validar build/deploy real.

## Progresso consolidado
- 43% produzido.
- 57% restante.
- Percentual é estimativa operacional e deve ser recalculado conforme P0/P1 forem comprovadamente concluídos.

## Regra de status
Nunca declarar 🟢 sem evidência real de teste. Nunca usar “MAROCAS — GO-LIVE APROVADO” enquanto qualquer P0 estiver pendente.
