# Política obrigatória CORE-FIRST — Impulsionando

## Regra absoluta
Toda melhoria criada para qualquer cliente, em qualquer vertical, módulo, jornada, automação, integração, regra, interface ou recurso deve ser avaliada imediatamente para reutilização no Core Impulsionando.

Nenhuma funcionalidade reutilizável pode permanecer implementada apenas no namespace, rota, migration, tabela ou fluxo exclusivo de um cliente.

## Fluxo obrigatório
1. Identificar a demanda específica do cliente.
2. Separar o que é universal do que é realmente exclusivo do tenant.
3. Implementar ou promover a capacidade universal no módulo correspondente do Core.
4. Parametrizar comportamento por tenant, nicho, plano, feature flag, regra ou configuração.
5. Conectar o cliente demandante à capacidade Core.
6. Atualizar catálogo, documentação, testes, provisioning e observabilidade.
7. Garantir que novos tenants possam receber a capacidade sem novo desenvolvimento estrutural.
8. Registrar exceções exclusivas com justificativa explícita.

## O que pertence ao Core
Exemplos não exaustivos:
- agenda e disponibilidade;
- presença, check-in, tolerância e no-show;
- reagendamento com consentimento;
- eventos, convites, inscrições e check-in;
- CRM, captação, conversão, relacionamento e retenção;
- tickets, protocolos e ouvidoria;
- pagamentos, cupons, billing, recorrência e repasses;
- prontuário/registro operacional parametrizável por vertical;
- reputação, avaliações e pesquisas de satisfação;
- contratos, aceite, assinatura e trilha de auditoria;
- comunicação e templates multicanal;
- cadastro, validação de documentos e CEP;
- BI, indicadores e comparativos;
- autenticação, RBAC, RLS e segurança;
- integrações e conectores;
- agentes e ferramentas do Impulsionito;
- provisioning, publicação e observabilidade.

## O que pode permanecer exclusivo do cliente
Somente itens realmente específicos, como:
- identidade visual e branding;
- nomes, textos institucionais e posicionamento;
- tabela comercial específica;
- regras contratuais particulares;
- dados cadastrais e documentos do tenant;
- integrações privadas exclusivas;
- exceções regulatórias ou operacionais comprovadamente particulares.

Mesmo nesses casos, o mecanismo que suporta a exceção deve preferencialmente permanecer no Core e a diferença deve ser configuração.

## Regra de arquitetura
Código universal não deve depender de IDs fixos de cliente, nomes de cliente, domínios específicos ou regras hardcoded quando puder ser parametrizado por `company_id`, módulo, capability, feature flag ou configuração.

## Regra de migrations
Toda migration criada a partir de demanda de cliente deve ser classificada antes do merge:
- `CORE_UNIVERSAL`;
- `VERTICAL_REUSABLE`;
- `TENANT_SPECIFIC`.

Para `VERTICAL_REUSABLE` e `TENANT_SPECIFIC`, deve existir justificativa de por que não é totalmente universal.

## Regra de front-end
Componentes e jornadas reutilizáveis devem viver em bibliotecas/módulos compartilhados e receber branding/configuração por tenant. Duplicação de telas entre clientes é considerada dívida técnica prioritária.

## Regra de automação
Workflows N8N, cron jobs, webhooks, jornadas e agentes reutilizáveis devem ser provisionáveis automaticamente para novos clientes através do Core.

## Regra do Impulsionito
O Impulsionito é o cérebro central do ecossistema. Toda nova capacidade registrada no Core deve ser incorporada ao seu catálogo operacional para que ele possa:
- descobrir a capacidade;
- explicar ao cliente;
- configurar quando autorizado;
- monitorar seu funcionamento;
- detectar falhas;
- sugerir uso quando pertinente;
- reutilizar a capacidade em novos tenants.

Princípio: **Impulsionito tudo sabe. Tudo vê. Tudo aproveita. Tudo multiplica.**

## Definition of Done obrigatória
Uma melhoria de cliente só pode ser considerada concluída quando:
- [ ] necessidade do cliente atendida;
- [ ] parte universal promovida ao Core;
- [ ] configuração por tenant implementada quando aplicável;
- [ ] catálogo de capability atualizado;
- [ ] provisioning de novos tenants atualizado;
- [ ] testes compartilhados criados/atualizados;
- [ ] observabilidade/auditoria cobrem o recurso;
- [ ] documentação atualizada;
- [ ] Impulsionito consegue descobrir/explicar/monitorar a capacidade;
- [ ] não há duplicação evitável entre clientes.

Esta política é obrigatória para todos os clientes atuais e futuros e prevalece sobre implementações locais anteriores.