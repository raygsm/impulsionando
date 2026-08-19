# FERNANDA PERSONAL — MASTER STATE

## Identidade
- Cliente: Fernanda Personal
- Host oficial: https://fepersonal.impulsionando.com.br
- Vertical: Personal / Performance / Exercício / Bem-estar
- Plano: Full Personal
- Core: Core universal da Impulsionando; não criar ERP/CRM/billing paralelo.
- Posicionamento: private performance high ticket, excelência técnica, discrição e acompanhamento humano.

## Comitê obrigatório para novos clientes
Toda implantação nova passa por: estratégia/negócio, produto, UX/UI/acessibilidade, marketing/growth, CRM/CX, financeiro/ERP/billing, automação/n8n, engenharia front/back, dados/analytics, segurança/LGPD, jurídico/regulatório, QA/E2E, infraestrutura/observabilidade e operação/suporte. Auditar antes de criar, justificar decisões, reutilizar Core, testar e não declarar funcional sem evidência.

## Identidade visual
Direção: saúde + ciência do movimento + luxo discreto. Evitar estética de academia agressiva, neon, excesso de preto, corpos estereotipados e promessa de resultado clínico. Interface clara, editorial, respirada, sofisticada, com tipografia de alta legibilidade, fotografia premium de movimento humano, anatomia/mecânica corporal abstrata e microinterações precisas. O produto deve parecer concierge de performance, não marketplace fitness.

## Públicos
- aluno high ticket individual;
- artistas/pessoas públicas com necessidade reforçada de privacidade;
- executivos e clientes com viagens frequentes;
- clientes presenciais, remotos e híbridos;
- Fernanda/equipe autorizada.

## Jornada comercial
Origem/UTM -> aplicação -> qualificação -> avaliação inicial -> proposta -> aceite -> cobrança -> onboarding -> anamnese/triagem -> plano/programa -> agenda -> sessões -> VOD -> acompanhamento -> reavaliação -> retenção -> renovação -> indicação/reactivação.

## Área do aluno
Dashboard, treino do dia, agenda, teleatendimento, biblioteca VOD, programas, progresso, avaliações, mensagens, documentos, financeiro, perfil, privacidade e suporte. PWA/mobile-first.

## Performance / treino
Registrar sem diagnosticar: objetivos, disponibilidade, experiência, ambiente/equipamentos, histórico informado, restrições declaradas, programa, exercícios, séries/repetições/tempo/carga, intervalos, RPE/percepção de esforço, observações, aderência, sessões concluídas, evolução e reavaliações. Conteúdo sobre anatomia/fisiologia deve ser educacional e contextual; decisões fora do escopo profissional devem ser encaminhadas ao profissional habilitado correspondente.

## Teleatendimento
Sala privada autenticada, acesso por sessão agendada, vídeo/áudio, status de presença, consentimentos aplicáveis, notas da profissional, encerramento e follow-up. Não chamar de teleconsulta médica. Gravação desligada por padrão; se futuramente necessária, exigir finalidade, consentimento/base legal, retenção e acesso específicos. Implementação de mídia deve usar provedor WebRTC/streaming homologado e nunca expor credenciais no browser.

## Fernanda Video
VOD privado com player white-label: HLS/DASH quando suportado, signed URLs/tokens curtos, autorização por entitlement/plano, progresso, continuar assistindo, capítulos, legendas, velocidade, favoritos, histórico, categorias, playlists/programas e analytics. Nunca entregar URL permanente do arquivo. Watermark individual/dinâmico é desejável para conteúdo premium.

## Billing / ERP
Core financeiro como fonte única. Planos, assinatura, mensalidade, cobrança, fatura/recibo conforme configuração fiscal, status financeiro, conciliação, MRR, ticket, LTV, churn e inadimplência. Webhooks idempotentes. Não considerar gateway funcional sem credenciais seguras e E2E real.

## Suspensão e reativação
Estados: trial/pending/active/past_due/grace/suspended/cancelled. Suspensão deve revogar entitlement premium e novos agendamentos conforme política, preservando histórico e dados legalmente necessários. Pagamento confirmado encerra cobrança de recuperação, restaura entitlement automaticamente e registra auditoria. Nunca apagar histórico por inadimplência.

## n8n / jornadas
Usar outbox/eventos do Core e workflows compartilháveis, evitando duplicação por cliente. Jornadas mínimas: lead, aplicação incompleta, avaliação agendada, proposta, onboarding, boas-vindas, lembretes de sessão, pós-sessão, conteúdo liberado, inatividade/aderência, reavaliação, aniversário quando autorizado, cobrança, falha de pagamento, grace, suspensão, reativação, renovação, churn win-back, indicação e pesquisa de satisfação. Saudação deve respeitar horário de Brasília quando for comunicação operada no Brasil, com timezone do cliente usado em agenda internacional.

## CRM / Client 360
Pipeline comercial + ficha 360 com plano, agenda, sessões, programa, conteúdo, progresso, comunicação, consentimentos, documentos, financeiro, tickets e timeline auditável. Segmentações VIP/Private devem ser internas. Pessoas públicas nunca aparecem em listas públicas, cases ou depoimentos sem autorização específica.

## Segurança e LGPD
Dados de saúde são sensíveis. Aplicar minimização, finalidade, consentimentos/bases legais adequadas, RLS/ABAC, least privilege, MFA administrativo, logs de auditoria, criptografia em trânsito, secrets server-side, URLs assinadas, rate limiting, sessão/revogação, backup/restore testado, política de retenção, exportação/atendimento a direitos do titular e trilha de incidentes. Separar metadados operacionais de conteúdo sensível em comunicações gerenciais.

## Analytics
UTM/origem, conversão, MRR, adimplência, churn, retenção, LTV, frequência, aderência, sessões, no-show, consumo VOD, conclusão, reavaliação e health score de relacionamento. Health score é operacional, não diagnóstico clínico.

## Critérios de pronto
Nenhum módulo é verde porque existe arquivo/tabela. Exigir, conforme aplicável: schema + RLS + auth + UI + API + persistência + auditoria + automação + testes unit/integration + E2E + deploy + DNS/TLS + observabilidade + backup + teste de suspensão/reativação + teste de autorização de vídeo + teste de privacidade multiusuário.

## Dependências externas a homologar
- domínio/DNS/TLS do host oficial;
- gateway de pagamento e credenciais por canal seguro;
- provedor transacional de e-mail;
- n8n live;
- provedor WebRTC para teleatendimento;
- storage/transcoding/CDN de vídeo;
- identidade/fotos/logotipo aprovados pela Fernanda;
- dados profissionais/regulatórios e termos jurídicos finais.

## Regra de segurança operacional
Mudanças potencialmente destrutivas, deploy que possa afetar produção, DNS crítico, remoção de recursos, alteração ampla de RLS ou migração irreversível exigem avaliação de risco/rollback e autorização explícita. Desenvolvimento deve ocorrer isolado e de forma aditiva/reversível até homologação.
