# REVELA — Auditoria Full e Matriz de Finalização

Data: 2026-08-24
Escopo: somente REVELA. Nenhuma mudança autoriza alteração em outros tenants.

## Regra
REVELA é cliente Full da Impulsionando e herda o Core universal sem duplicar módulos. O produto educacional é o centro; CRM, ERP, comunicação, suporte, agenda, cobrança, fiscal e automação são capacidades de sustentação.

## Públicos e UX
- Aluno: jornada, pulso mensal, experiências, evidências, plano de exploração, privacidade. Sem ranking ou score único.
- Docente: alunos no escopo, micro-observações, evidências, experiências e encaminhamentos.
- Comitê: triangulação, confiança, divergências, justificativas, decisões humanas e atas.
- Escola/Rede: adesão, indicadores agregados, lacunas de oportunidade, experiências, infraestrutura, projetos e permissões.
- Responsável: progresso compreensível, experiências, consentimentos e orientações.
- Empresa/RH: oportunidades, desafios práticos, candidatos autorizados, matching explicável e feedback.
- Profissional independente: pesquisas, candidatura ao Comitê/Time, agenda e contribuições.
- Admin REVELA: tenants, pessoas, metodologia, comunicação, CRM, tickets, agenda, fiscal, automações, auditoria e segurança.
- Impulsionando Master: acesso global conforme Core, sem bypass de RLS.

## Comunicação Full
Editor por tenant com versionamento, preview, teste, rollback e override local. Canais: e-mail, WhatsApp oficial, in-app e SMS quando habilitado. Template ativo nunca pode estar vazio. Variáveis precisam de schema/fallback. Histórico, falhas, retries e auditoria são obrigatórios.

Templates padrão: cadastro, boas-vindas por papel, convites, consentimento, survey mensal, trimestre, observação docente, experiência, follow-ups 30/90/180/365, oportunidade, desafio, feedback, reunião/comitê, ticket, ouvidoria, cobrança, vencimento, pagamento, suspensão/reativação quando contratualmente aplicável, nota fiscal, incidente/restauração e satisfação/NPS.

## WhatsApp
Preferência pela API oficial Meta em produção. QR Code só para provedores/modos que dependam tecnicamente de pareamento; não representar QR como requisito da Cloud API oficial. Exibir provedor, número, status, última atividade, saúde, erro e ação. Reconexão auditada, opt-in/out persistido e templates aprovados para mensagens iniciadas pela empresa.

## CRM
Pipelines: Escolas/Redes; Empresas/RH; Profissionais/Comitê; Parcerias públicas/institucionais. Todo contato deve ter origem, lifecycle, consentimentos, responsável, tags e histórico.

## Suporte e Ouvidoria
Suporte: ticket automático por formulário, e-mail, conversa ou falha elegível; código, categoria, prioridade, SLA, responsável, histórico, anexos e escalonamento.
Ouvidoria separada do suporte: conduta, privacidade/dados, acessibilidade, discriminação, segurança, metodologia, relacionamento institucional, cobrança e outros; protocolo, prazo, auditoria, conflito de interesse e escalonamento independente.

## Agenda
Usar Core para implantação, Comitê, mentorias, entrevistas, demonstrações, reuniões escola-empresa e suporte agendado. Sem agenda paralela.

## ERP / Financeiro
Herdar Core para contratos, cobrança, conciliação, centros de custo, documentos financeiros e relatórios. Sem ERP próprio.

## Fiscal
NFS-e automática deve ser capability configurável por entidade jurídica e município; nunca presumir disponibilidade sem provedor/configuração fiscal válida. Pagamento confirmado pode gerar job fiscal conforme política.

## N8N
Jornadas: onboarding, consentimento, survey, trimestre, observação, experiência, follow-up, oportunidade/desafio, reunião/comitê, CRM, suporte, ouvidoria, cobrança, pagamento, fiscal e alertas. Exigir idempotência, versão, retry, fila de falha, auditoria e alerta.

## Diagnóstico atual
Já existe: tenant REVELA full; master full_access; domínio REVELA com RLS; 15 dimensões; Core de comunicação, WhatsApp, CRM, tickets/SLA, agenda e billing; blueprint metodológico.

Lacunas: matrícula operacional do REVELA no Core ainda incompleta; WhatsApp REVELA sem configuração registrada; N8N REVELA sem workflows registrados; CRM sem pipelines/stages REVELA; suporte sem SLA/roteamento REVELA; ouvidoria sem entidade dedicada comprovada; templates REVELA não semeados/publicados; UX autenticada por papel incompleta; fiscal automático depende de capability/provedor válido; publicação exige homologação E2E real.

## Ordem
P0 segurança, tenant mapping, publicação estável, login e UX por papel.
P1 templates/e-mail/WhatsApp/CRM/suporte/ouvidoria.
P2 agenda/N8N/dashboards/ERP-billing.
P3 fiscal/analytics/otimização.

## Critério de pronto
Nenhum módulo é pronto apenas por existir tabela, rota ou HTTP 200. Pronto exige fluxo funcional, permissão correta, persistência, auditoria e teste E2E no papel correspondente.
