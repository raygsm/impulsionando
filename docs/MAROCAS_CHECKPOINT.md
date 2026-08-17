# MAROCAS — CHECKPOINT DE EXECUÇÃO

Atualizado em: 2026-08-17
Projeto pai: Impulsionando sistemas / Impulsionando Tecnologia
Cliente exclusivo: Marocas
Agente central: Impulsionito
Instância especializada: Maruquito

## Regra de continuidade
Ao receber “Continue” ou “Retome do último checkpoint”, verificar primeiro GitHub e Supabase live e seguir deste ponto sem reiniciar nem repetir trabalho concluído.

## Infraestrutura correta
- NÃO usar Vercel.
- GitHub: código/versionamento.
- Supabase: banco/backend/auth.
- Hostinger/VPS Hostinger: hospedagem/aplicações.
- Cloudflare: DNS/SSL/proxy/proteção.
- n8n próprio na VPS Hostinger: automações.

## Piloto real
Loft Copanema é cliente/imóvel real da Marocas.
URL informada: https://airbnb.com.br/h/loftcopanema
Usar como primeiro E2E real, sem inventar reserva, hóspede, data, valor, pagamento, código de acesso, estoque ou status.
Jornada alvo: reserva real -> checkout -> janela operacional -> limpeza -> checklist -> reposição -> evidências -> conferência -> imóvel liberado -> próximo check-in.

## Maruquito
- `communication_agents`: Maruquito ativo no tenant Marocas.
- runtime: `marocas-maruquito`, `CLIENT_INSTANCE`, root Impulsionito, `system_prompt_ref=marocas/maruquito/v1`.
- `/api/impulsionito/chat` resolve `/marocas` server-side para Maruquito.
- navegador não pode trocar tenant/agent arbitrariamente.
- FAB convertido para chat real.
- regra explícita: nunca inventar preços, reservas, pagamentos, equipe, estoque, acessos ou status.
Status: 🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE.

## Reservas, giro e limpeza
Migrations aplicadas no live:
- `marocas_reservations_turnovers_checklists_v1`
- `marocas_service_completion_guards_v1`

Estruturas:
- `marocas_reservations`
- `marocas_turnovers`
- `marocas_checklist_templates`
- vínculos em `marocas_services`

Janela do giro calculada no banco: impossível/crítica/apertada/confortável.
Serviço de limpeza é gerado a partir do giro e vinculado a checklist.
Conclusão protegida por trigger: checklist e fotos obrigatórias conforme template.
Status: 🟡 IMPLEMENTADO — TESTE E2E PENDENTE.

## Evidências/fotos seguras
Migration live: `marocas_service_evidence_security_v1`.
Bucket existente reaproveitado: `marocas-fotos`, privado, JPEG/PNG/WebP, 15 MB, vazio no momento da migração.
Criada `marocas_service_evidence` com caminho obrigatório `<apartment_id>/<service_id>/...`.
Acesso passou a ser por necessidade operacional:
- equipe Impulsionando autorizada;
- proprietário do imóvel;
- profissional efetivamente designado ao serviço.
Upload é restrito ao profissional designado ou staff; update/delete somente staff.
Status: 🟡 IMPLEMENTADO — TESTE E2E DE UPLOAD PENDENTE.

## Segredos de acesso do imóvel
Migration live: `marocas_property_access_vault_v1`.
Supabase Vault confirmado instalado (`supabase_vault`).
Criadas:
- `marocas_property_access_secrets` — apenas metadados; plaintext não vai para tabela comum;
- `marocas_property_access_events` — auditoria de create/reveal/deny/deactivate.

RPCs server-only:
- `marocas_store_property_secret(...)`
- `marocas_reveal_property_secret(...)`

Permissões validadas no live:
- anon: EXECUTE = false
- authenticated: EXECUTE = false
- service_role: EXECUTE = true

Profissional só pode revelar segredo quando designado ao serviço do imóvel e dentro da janela operacional; toda revelação é auditada. Proprietário e staff seguem regras próprias de autorização.
Status: 🟡 IMPLEMENTADO — TESTE E2E SERVER-SIDE PENDENTE.

## Core Agenda — drift reconciliado parcialmente
Foi confirmado que o live já possuía partes do Core Agenda (`agenda_professionals`, `agenda_schedules`, `agenda_blocks`), mas faltavam entidades que o código atual usa. A migration histórica dependia de estruturas legadas como `public.permissions`, inexistente no live; por isso NÃO foi reaplicada integralmente.

Migration incremental aplicada: `core_agenda_reconcile_marocas_bridge_v1`.
Criados/restaurados:
- `agenda_services`
- `agenda_appointments`

`marocas_services` recebeu `agenda_appointment_id`.
Trigger ativo: `trg_marocas_sync_service_to_core_agenda`.
O compromisso universal representa a janela operacional real do giro (`checkout` até próximo `check-in`), não uma duração fictícia de limpeza. A agenda identifica o imóvel, não o hóspede, reduzindo PII.
Validação live:
- agenda_services existe = true
- agenda_appointments existe = true
- coluna de vínculo Marocas existe = true
- trigger de sync existe = true
- registros atuais = 0, portanto nenhum dado fictício foi criado.
Status: 🟡 IMPLEMENTADO — TESTE E2E COM DADOS REAIS PENDENTE.

## Segurança
Novas tabelas Marocas possuem RLS/políticas. As novas RPCs de Vault não geraram alerta por execução anon/authenticated. Continua dívida preexistente do projeto em helpers globais, inclusive `marocas_company_id()` como SECURITY DEFINER executável por authenticated. Não alterar helper global sem mapear dependências.
Segurança fina ainda precisa ser completada em todos os módulos Marocas, especialmente papéis, finanças e prestadores.
Status geral: 🟠 PARCIAL.

## Telas reais já convertidas
- `/marocas/app/anfitriao/reservas`: sem MOCK_RESERVAS; leitura/cadastro real.
- `/marocas/app/anfitriao/limpezas`: sem MOCK_AGENDA e sem SLA fictício; mostra giros reais.
Status: 🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE.

## Próximas prioridades
1. Criar fluxo server-side do frontend para upload/registro de evidências e revelação segura do Vault.
2. Validar sync Marocas -> Core Agenda com primeiro dado real do Loft Copanema.
3. Completar RBAC/RLS fino: proprietário, profissional designado, supervisor, manutenção, administrativo/master.
4. Auditar/remover mocks restantes das rotas Marocas.
5. Estruturar ocorrência + tickets universais.
6. Evoluir reposição/inventário para Core Inventory sem JSON em notes como estado principal.
7. Conectar Maruquito a tools reais de reservas, limpeza, janela, reposição, manutenção, tickets e agenda.
8. Validar planos recorrentes, CRM, contratos, pagamentos, templates, jornadas, n8n, analytics, UTM, SEO, mobile, logs e backups.
9. Auditar pipeline real GitHub -> Hostinger/VPS + Cloudflare e validar build/deploy.
10. Executar E2E completo do Loft Copanema com dados reais.

## Progresso consolidado
- 68% produzido.
- 32% restante.
Percentual é estimativa operacional e só sobe com implementação/evidência real.

## Regra de status
Nunca declarar 🟢 sem teste comprovado.
Nunca usar “MAROCAS — GO-LIVE APROVADO” enquanto qualquer P0 estiver pendente.
