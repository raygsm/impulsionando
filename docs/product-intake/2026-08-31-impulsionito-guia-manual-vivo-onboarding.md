# Product Intake — Impulsionito Guia / Manual Vivo / Onboarding Contínuo

## Status
APPROVED / IN_PROGRESS

## Prioridade
P1 — Core Impulsionando / experiência, adoção e retenção

## Objetivo
Criar uma camada viva de onboarding e ajuda dentro do dashboard, orientada por contexto, tenant, plano, módulos, papel e permissões. O usuário deve conseguir entender, aprender, testar e executar com assistência do Impulsionito, sem depender de documentação externa.

## Regra de produto
`LER -> VER -> APRENDER -> TESTAR -> FAZER COM O IMPULSIONITO -> FAZER PELO IMPULSIONITO quando permitido`.

## Escopo
- Manual Vivo dentro do dashboard;
- Impulsionito Guia sempre disponível;
- smart help contextual por rota;
- índice vivo por módulos;
- primeiros passos e checklist;
- CRM, comunicação, WhatsApp, e-mail/SMTP, templates, ERP, estoque, PDV, financeiro, billing, Mercado Pago, agenda, profissionais, aprovações, automações/N8N, BI, agentes, Clube, Vitrine, White Label, Private Chat, segurança e suporte;
- testes guiados e estados NOT_TESTED/TESTING/PASS/FAIL/DEGRADED;
- pesquisa semântica futura;
- guided tours;
- telemetria de adoção;
- recomendações de next-best-feature;
- recomendações semanais com controle de frequência;
- RBAC/RLS/tenant isolation;
- mobile e acessibilidade.

## Estado encontrado antes da implementação
O repositório já contém ativos relevantes que devem ser preservados e evoluídos, não reescritos: `src/routes/onboarding-guiado.tsx`, `src/routes/central-de-ajuda.tsx`, onboarding autenticado, health de onboarding, workflows N8N de onboarding, `ImpulsionitoDock` global no `AppShell`, além de rotas e infraestrutura de suporte. O onboarding público atual persiste progresso apenas em localStorage e a Central de Ajuda atual é principalmente FAQ pública; portanto ainda não constituem o Manual Vivo contextual solicitado.

## Fases
1. Consolidar fonte canônica de conteúdo/índice do Guia.
2. Publicar rota autenticada do Manual Vivo no dashboard.
3. Criar smart help contextual integrado ao Impulsionito.
4. Integrar tenant/plano/permissões ao catálogo exibido.
5. Persistir progresso e telemetria no backend.
6. Guided tours e testes reais de configuração.
7. CRM/Comunicação/WhatsApp/e-mail.
8. ERP/estoque/PDV.
9. Agenda/aprovações.
10. Automação/N8N/BI.
11. Adoption Score e recomendações proativas.
12. QA, deploy e verificação.

## Critério de conclusão
`DEPLOYED != VERIFIED`. O Intake só fecha após prova de funcionamento no dashboard real, em diferentes papéis/tenants, com ajuda contextual, persistência, testes guiados, acessibilidade e isolamento de tenant.