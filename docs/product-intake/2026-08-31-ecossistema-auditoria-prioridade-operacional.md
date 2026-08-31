# Adendo de prioridade operacional — Auditoria Master Impulsionando

Data: 2026-08-31
Status: APPROVED / IN_PROGRESS
Natureza: alteração somente da ordem de prioridade; não substitui, cancela, reduz ou encerra o Superprompt Master já aprovado.

## Regra de continuidade
PROMPT MASTER ANTERIOR + ESTE ADENDO = UMA ÚNICA EXECUÇÃO CONTÍNUA.

Não reiniciar a auditoria. Não perder nenhuma descoberta, correção, evidência ou pendência já aberta. Como a CHRISMED já está em fase avançada de auditoria/homologação, concluir o bloco técnico atual sem interrompê-lo de forma que gere regressão ou trabalho duplicado.

## Nova ordem executiva
1. Concluir o bloco CHRISMED atualmente em andamento até um ponto tecnicamente seguro de fechamento/homologação, sem forçar declaração de 100% onde faltar evidência.
2. IMPULSIONANDO CORE — prioridade máxima absoluta até a operação própria estar integralmente auditada, corrigida, testada, deployada e verificada.
3. CHRISMED — qualquer complemento residual que tenha sido deliberadamente postergado por depender do Core canônico.
4. COLORS SAÚDE.
5. Demais tenants/verticais conforme o Superprompt Master.

## Escopo prioritário obrigatório do IMPULSIONANDO CORE
A prioridade máxima é finalizar a operação da própria Impulsionando, incluindo, sem limitar o escopo anterior:

- ERP/RP próprio Impulsionando e sua integração com o restante do Core;
- Dashboard Master da Impulsionando;
- criação e gestão de clientes/tenants pelo dashboard;
- criação de cliente com escolha/validação de subdomínio `cliente.impulsionando.com.br`;
- associação obrigatória de plano durante onboarding/provisionamento;
- possibilidade de contratação/onboarding pelo próprio cliente, respeitando autorização, segurança e regras comerciais;
- provisionamento idempotente de tenant, subdomínio, plano, módulos, permissões, CRM, automações, jornadas, comunicação e agente;
- gestão completa dos clientes no dashboard Master;
- Impulsionito permanentemente disponível no dashboard Master e nos dashboards de tenants;
- Impulsionito como orquestrador central, com contexto correto de tenant, plano, módulos, usuário e permissões;
- conexão de WhatsApp por QR Code na área de Comunicação do módulo CRM, quando a modalidade configurada utilizar sessão QR/Evolution API;
- coexistência governada com API oficial quando aplicável, sem misturar credenciais/sessões;
- área de Comunicação dentro do CRM com canais, estado de conexão, templates, histórico, jornadas e handoff humano;
- planos comerciais efetivamente persistidos, versionados e utilizáveis;
- catálogo de módulos/entitlements por plano;
- parametrizações operacionais e comerciais por switches booleanos SIM/NÃO, sem hardcode quando a regra for configurável;
- parâmetros herdáveis Core -> plano -> tenant, com override explícito e auditável quando autorizado;
- cobrança efetiva dos planos;
- pró-rata de primeira competência conforme regra comercial vigente;
- vencimento padrão dia 5 onde aplicável;
- Mercado Pago per-tenant/Core com checkout transparente;
- PIX;
- cartão de crédito;
- parcelamento com juros conforme condições efetivamente retornadas/configuradas pela operadora/adquirente, sem inventar taxa;
- webhooks autenticados e idempotentes;
- identificação/reconciliação automática de pagamento;
- estados de cobrança: pendente, pago, vencido, em tentativa, inadimplente, suspenso, reativado, cancelado e demais estados canônicos necessários;
- relógios regressivos no dashboard para vencimento, repasses, suspensão e reativação quando aplicáveis;
- suspensão automática por inadimplência somente segundo política configurada;
- reativação automática após pagamento efetivamente identificado, de forma idempotente;
- separação absoluta entre suspender acesso e excluir dados;
- trilha de auditoria de cobrança, pagamento, suspensão, reativação, alteração de plano e mudança de parâmetros;
- repasses e respectivos relógios/regras quando o produto/tenant possuir repasse;
- CRM, ERP, PDV, estoque, financeiro, agenda, billing, fiscal, BI, N8N, WhatsApp, email, SMS, voz/VoIP, pagamentos, Clube, vitrines, white-label, afiliados, Private Chat e demais módulos conhecidos permanecem no catálogo mestre e não podem desaparecer por causa da repriorização.

## Matriz de parametrização
Toda regra que o produto definiu como configurável deve ser modelada como configuração explícita, preferencialmente com:
- chave canônica;
- tipo;
- valor default;
- escopo Core/plano/tenant;
- SIM/NÃO quando booleana;
- descrição funcional;
- permissão de edição;
- impacto;
- validação;
- histórico de alteração;
- autor/data;
- rollback quando aplicável.

Não criar switches decorativos. Cada SIM/NÃO deve controlar comportamento real no backend e refletir estado real no frontend.

## Provisionamento obrigatório
Fluxo-alvo:
`criar/contratar cliente -> validar identidade -> escolher subdomínio -> escolher plano -> criar tenant -> persistir identidade -> provisionar entitlements -> provisionar CRM/comunicação/jornadas/agente -> configurar cobrança -> configurar Mercado Pago -> publicar frontend base -> validar DNS/SSL -> smoke tests -> ativar operação`.

O fluxo deve ser idempotente, observável, retryable, auditável e seguro. Falha intermediária não pode produzir tenant parcialmente ativo sem estado explícito de recuperação.

## Billing / lifecycle
Fluxo-alvo:
`plano -> contrato -> cobrança -> checkout -> pagamento/webhook -> reconciliação -> ativo -> vencimento -> grace/política -> suspensão -> pagamento identificado -> reativação`.

Cada transição deve possuir timestamp, origem, motivo, idempotency key quando aplicável e log auditável. Relógios regressivos devem derivar desses dados canônicos, não de contadores apenas visuais.

## Impulsionito
No Dashboard Impulsionando, o Impulsionito deve ser parte estrutural da operação e não um chat isolado. Deve conseguir, dentro das permissões do usuário:
- consultar contexto do tenant/cliente;
- explicar plano e módulos;
- orientar configuração;
- iniciar/acompanhar onboarding;
- apoiar CRM/comunicação;
- apoiar billing e lifecycle;
- indicar pendências operacionais;
- acionar ferramentas autorizadas pelo Tool/MCP Gateway;
- respeitar RBAC, tenant isolation, purpose binding e trilha de auditoria;
- nunca expor segredo ou dados de outro tenant.

## Critério de 100% para a Impulsionando
Não considerar a operação própria finalizada porque telas, tabelas, rotas ou workflows existem. Para fechamento, provar pelo menos:
1. criação real controlada de tenant de teste;
2. subdomínio corretamente associado;
3. plano corretamente associado;
4. entitlements corretos;
5. provisionamento sem duplicidade em retry;
6. dashboard Master gerenciando o tenant;
7. Impulsionito operando no contexto correto;
8. conexão de comunicação conforme modalidade configurada;
9. checkout transparente PIX funcional em ambiente apropriado;
10. checkout transparente cartão funcional em ambiente apropriado;
11. parcelamento obedecendo condições reais da operadora;
12. webhook e reconciliação idempotentes;
13. relógios derivados de datas canônicas;
14. suspensão controlada por política;
15. reativação controlada após pagamento identificado;
16. dados preservados durante suspensão;
17. RBAC/RLS/tenant isolation aprovados;
18. N8N/jornadas críticas com execução observada;
19. logs/observabilidade/rollback;
20. deploy no ambiente correto e verificação real pós-deploy.

## Regra para CHRISMED e Colors
CHRISMED permanece sendo concluída no bloco atual para não introduzir risco por interrupção no meio da homologação. Depois, o foco passa integralmente ao Core Impulsionando. CHRISMED volta somente para dependências residuais que exijam o Core já corrigido. Colors Saúde é a próxima prioridade de tenant depois de Impulsionando/CHRISMED, antes dos demais tenants.
