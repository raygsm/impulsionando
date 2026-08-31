# CHRISMED — Superprompt Final de Auditoria, Correção, Homologação e Go-Live

## Status
APPROVED / IN_PROGRESS

## Escopo
Exclusivamente CHRISMED. Dependências compartilhadas só podem ser alteradas no mínimo necessário para fazer a CHRISMED funcionar, com retorno imediato ao escopo.

## Regra de verdade
EXISTS != WORKS. IMPLEMENTED != DEPLOYED. DEPLOYED != VERIFIED.

## Prioridades de fechamento
1. Agenda canônica, disponibilidade, holds e bloqueio concorrente.
2. Cadastro e Área do Paciente.
3. Remarcação por paciente e gestão, com histórico e bloqueio atômico.
4. Antecipação de agenda.
5. Lembretes D-7, D-1 e D0 às 06:00 America/Sao_Paulo.
6. Pagamentos Mercado Pago e recuperação.
7. Comunicação CHRISMED por e-mail/WhatsApp, templates e outbox.
8. CRM/timeline, Oliver e N8N.
9. Plano/membership/entitlements.
10. RBAC/RLS/LGPD, QA, deploy e verificação real.

## Evidências iniciais em 2026-08-31
- Empresa CHRISMED ativa e não-demo no Supabase canônico.
- `chrismed.agendar.tsx` usa disponibilidade real por RPC, hold e Mercado Pago, mas ainda importa profissionais/especialidades/unidades de `chrismed-mock.ts`.
- `list_chrismed_available_slots` já filtra profissional ativo e `profile_status in ('approved','active')` e bloqueia conflitos com blocks/appointments/holds válidos.
- Há dois profissionais ativos no cadastro; Dra. Christiane está `approved`, enquanto outro profissional está `incomplete`, portanto não deve ser exposto na agenda pública.
- `create_chrismed_booking_hold` ainda possui EXECUTE para anon; não revogar antes de existir e estar verificada a borda Core/API substituta.
- A função `chrismed_reschedule_paid_appointment` foi encontrada sem validação explícita de ownership/gestão. Foi endurecida no banco em migration `chrismed_reschedule_authorization_hardening_20260831`: exige usuário autenticado, paciente dono da consulta ou gestão CHRISMED, profissional aprovado, conflito/blocks/schedule e registra ator/auditoria.
- Lembretes D-7/D-1/D0 06:00 já existem no banco para consultas confirmadas e pagas, porém o worker atual não possui mappings para esses três event codes; isso é P1 de comunicação.
- Outbox atual: 52 sent / 18 dead_letter. Todos os dead letters observados são `management_appointment_created` com `template_mapping_missing:management_appointment_created`.
- Templates CHRISMED de e-mail para D-7/D-1/D0 já existem e estão PUBLISHED; WhatsApp equivalente ainda não foi comprovado.
- Membership plans encontrados: mensal inativo e anual ativo. Valores/regras não serão alterados sem autoridade comercial confirmada.

## P0 corrigido nesta execução
`chrismed_reschedule_paid_appointment` agora possui autorização por ownership/gestão e auditoria de ator. Nenhuma remarcação por usuário autenticado arbitrário deve ser aceita.

## Pendências imediatas
- remover dependência de mock do front público sem expor cadastro incompleto;
- corrigir mappings do worker para `management_appointment_created`, D-7, D-1 e D0 06:00;
- homologar scheduler/outbox para os lembretes;
- criar/validar fonte canônica de unidade/endereço/modalidade para mensagens;
- implementar/validar drag-and-drop de gestão com alternativa acessível;
- validar self-service do paciente usando RPC segura;
- validar antecipação e revalidação atômica do slot;
- E2E Mercado Pago sem cobrança indevida;
- WhatsApp real, CRM/timeline, Oliver e N8N;
- resolver plano/entitlements sem mudar regras comerciais por inferência;
- deploy e VERIFY.

## Definition of Done
Somente fechar quando os critérios do Superprompt CHRISMED estiverem comprovados em produção, incluindo agenda, cadastro, área do paciente, holds, concorrência, remarcação, antecipação, lembretes, pagamentos, comunicação, Oliver, CRM, N8N, plano/entitlements, segurança, mobile e produção.