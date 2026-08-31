# Product Intake — Auditoria Master do Ecossistema Impulsionando

## Status
APPROVED / IN_PROGRESS

## Data
2026-08-31

## Origem
Comando explícito do dono do produto: executar integralmente o último superprompt de auditoria, começando pela CHRISMED, preservando o que estiver correto, corrigindo o que estiver incorreto e validando o funcionamento real de todo o ecossistema.

## Escopo
- CHRISMED como primeira fase obrigatória;
- Core Impulsionando;
- todos os tenants atuais e futuros encontrados no inventário;
- identidade visual e logos oficiais;
- frontend, backend, banco, APIs, auth, RLS, RBAC;
- plano Full e módulos habilitados;
- CRM, ERP, PDV, estoque, agenda, billing, fiscal, BI;
- N8N, automações, nurturing e jornadas;
- agentes, Impulsionito, RAG, memória, tools/MCPs;
- Clube, white-label, vitrine, Private Chat;
- infraestrutura, DNS, SSL, VPS, reverse proxy, publicação da main;
- segurança, LGPD, logs, observabilidade e rollback;
- QA ponta a ponta por ator e por vertical;
- demos e verticais, incluindo DIBA e bares/restaurantes, após resolução de identidade quando necessário.

## Regra
Não declarar funcionalidade como pronta sem evidência de teste. DEPLOYED != CLOSED.

## Ordem
1. CHRISMED
2. Core Impulsionando
3. tenants ativos
4. demos prioritários
5. bares/restaurantes/cervejarias
6. materiais de construção/DIBA
7. demais verticais
8. testes transversais
9. segurança
10. QA completo
11. deploy controlado
12. verificação real
13. documentação e fechamento

## Critério final
Cada item deve terminar com evidência de estado: não auditado / auditado / falhou / corrigido / testado / homologado / deployado / verificado.