# INTAKE MESTRE — MODELOS DE MONETIZAÇÃO DO ECOSSISTEMA IMPULSIONANDO

**Destinatários:** K1 / Cauã / equipe de desenvolvimento
**Natureza:** Intake arquitetural e comercial. Não executar alterações de código a partir deste documento sem priorização explícita.
**Objetivo:** garantir que toda a arquitetura do Ecossistema Impulsionando seja preparada, desde o Core, para suportar todos os canais de monetização atuais e futuros sem forks, duplicações ou regras financeiras hardcoded.

---

## 1. VISÃO GERAL

A Impulsionando não deve ser tratada apenas como um CRM/ERP SaaS. O produto deve ser arquitetado para operar simultaneamente como:

1. SaaS B2B para empresas finais;
2. plataforma White Label/licenciamento;
3. Clube Impulsionando B2C;
4. plataforma de afiliados e produtores/coprodutores;
5. marketplace transacional;
6. checkout próprio Impulsionando;
7. camada de pagamentos, splits, comissões, repasses, conciliação e BI;
8. plataforma central de dados e inteligência operacional, conectada ao Impulsionito.

A lógica macro deve ser sempre:

**Core único -> módulos reutilizáveis -> tenant/configuração -> identidade e regras específicas -> operação comercial -> transação -> ERP/CRM/BI/automação.**

Nenhum canal de monetização deve exigir um sistema separado.

---

## 2. MONETIZAÇÃO 1 — PLANOS PARA EMPRESAS FINAIS

Público: bares, restaurantes, farmácias, supermercados, materiais de construção, saúde, varejo, serviços e demais empresas que utilizem diretamente a Impulsionando.

### Preços oficiais

- **Plano Essencial:** 0,5 salário mínimo vigente por mês.
- **Plano Ideal:** 1 salário mínimo vigente por mês.
- **Plano Full:** 2 salários mínimos vigentes por mês.

### Regra crítica

Não utilizar valores nominais em reais hardcoded. A precificação deve referenciar uma tabela parametrizável de salário mínimo vigente, com histórico de vigência, permitindo reajuste sem alteração de código e preservando contratos já fechados conforme sua regra comercial.

Os módulos devem nascer no mesmo Core. Diferenças entre planos devem ser controladas por permissões, limites, capacidade, usuários, clientes finais, volume, consumo ou regras comerciais — nunca por duplicação de código.

---

## 3. MONETIZAÇÃO 2 — WHITE LABEL / LICENCIAMENTO

White Label é um modelo distinto dos planos empresariais finais. O licenciador utiliza todo o ecossistema Impulsionando com sua própria marca, identidade, domínio/subdomínio, usuários e carteira de clientes, administrando sua operação sobre o mesmo Core.

### Preços e capacidade White Label

| Nível | Mensalidade | Pontos adicionados | Capacidade acumulada |
|---|---:|---:|---:|
| WL1 | 1 salário mínimo | +10 | 10 pontos |
| WL2 | 2 salários mínimos | +13 | 23 pontos |
| WL3 | 3 salários mínimos | +18 | 41 pontos |
| WL4 | 4 salários mínimos | +20 | 61 pontos |

### Consumo de pontos por cliente do White Label

- Cliente Essencial: 1 ponto.
- Cliente Ideal: 3 pontos.
- Cliente Full: 5 pontos.

### Regras

- Usuários ilimitados dentro da lógica do White Label.
- Capacidade controlada por pontos.
- Upgrade/downgrade deve ser suportado.
- O sistema deve acompanhar consumo e saldo de pontos e sinalizar antecipadamente quando houver necessidade de mudança de nível.
- O White Label funciona como um mini-Master subordinado à Impulsionando.
- O White Label pode administrar seus próprios clientes, módulos, usuários, permissões, cobrança e branding.
- O White Label não pode visualizar outros White Labels, clientes diretos da Impulsionando ou informações globais do ecossistema.
- Não criar forks de código para White Labels. Branding, domínio, módulos, regras e permissões devem ser configuráveis por tenant.

---

## 4. MONETIZAÇÃO 3 — CLUBE IMPULSIONANDO B2C

O Clube cria uma relação direta da Impulsionando com o consumidor final e consolida sua identidade e histórico dentro do ecossistema.

### Preço

**R$ 16,90/mês — valor ainda deve ser confirmado como definitivo antes do go-live.**

Não considerar definitivo em implementação financeira sem confirmação expressa.

### Benefícios e dados do assinante

O assinante deve poder acessar, conforme disponibilidade e permissões:

- histórico de estabelecimentos visitados;
- data e hora das visitas;
- pedidos e compras;
- itens consumidos/comprados;
- valores;
- benefícios e campanhas;
- avaliações e NPS;
- recorrência;
- pedido/comanda;
- cupom fiscal/NFC-e/NF-e quando disponível;
- documentos e registros vinculados à relação com os estabelecimentos.

### Regra PDV

Quando o cliente estiver identificado como membro do Clube, o PDV próprio da Impulsionando deve vincular automaticamente a operação ao cadastro do assinante.

Nem todo estabelecimento obrigatoriamente enviará documento fiscal para o Clube, pois isso depende do contexto fiscal e de integrações disponíveis. Porém, **o pedido de consumo é obrigatório** quando o consumidor estiver identificado no Clube.

A venda/pedido deve entrar no histórico do consumidor e alimentar CRM, BI e jornadas, respeitando LGPD, permissões e regras de privacidade.

---

## 5. MONETIZAÇÃO 4 — PLATAFORMA DE AFILIADOS

A Impulsionando deve ser preparada para assumir, progressivamente, funções hoje exercidas por plataformas como Monetizze, Hotmart e similares.

Objetivo: permitir que produtores tragam seus produtos e afiliados para dentro da Impulsionando, reduzindo dependência de plataformas externas e gerando receita transacional e/ou recorrente para o ecossistema.

### Fluxo conceitual

**Produtor -> Produto -> Oferta -> Campanha -> Afiliado -> Lead/Comprador -> Pedido -> Checkout -> Pagamento -> Split -> Comissão -> Saldo -> Repasse -> Conciliação -> BI.**

### Perfis suportados

- produtor;
- coprodutor;
- afiliado;
- comprador;
- gestor do tenant;
- Master Impulsionando.

### Recursos necessários

- cadastro e aprovação de produtores;
- cadastro de produtos e ofertas;
- coprodução e percentuais;
- cadastro/aprovação de afiliados;
- links, códigos, cupons e atribuição de vendas;
- campanhas para afiliados;
- ranking e desempenho;
- metas e premiações;
- comissão parametrizável;
- split automático;
- extrato individual;
- saldo disponível e futuro;
- regras de saque/repasse;
- reversão proporcional em cancelamentos, estornos e chargebacks;
- trilha de auditoria completa;
- relatórios e BI exportáveis.

### Colors como caso estratégico

A arquitetura deve permitir que operações como a Colors migrem progressivamente da dependência de checkout/plataformas externas e tragam sua base de milhares de afiliados para o ecossistema Impulsionando.

---

## 6. MONETIZAÇÃO 5 — COBRANÇA SOBRE PRODUTOR, COPRODUTOR E AFILIADO

A plataforma deve permitir modelos comerciais flexíveis e configuráveis, tais como:

- percentual sobre venda;
- tarifa fixa por transação;
- mensalidade;
- mensalidade + percentual;
- fee por serviço/plano;
- regras diferenciadas por produtor, coprodutor, afiliado, tenant ou campanha;
- eventuais fees de repasse/saque quando juridicamente e comercialmente aplicáveis.

Nenhuma taxa deve ser fixa no código.

Criar conceito de **fee rules versionadas**, com data de início/fim de vigência, para que cada venda preserve a regra financeira válida no momento em que foi realizada.

---

## 7. MONETIZAÇÃO 6 — CHECKOUT IMPULSIONANDO

A Impulsionando deve poder oferecer checkout próprio para empresas, produtores e operações do ecossistema.

A experiência é Impulsionando, ainda que a liquidação financeira utilize PSP, adquirente, banco ou parceiro homologado.

### Hipótese comercial inicial

Exemplo de modelagem:

- cobrança ao cliente: 5% no crédito à vista;
- custo negociado com operador: aproximadamente 2,5%;
- margem bruta transacional: diferença entre taxa cobrada e custo efetivo.

**Esses percentuais são hipótese de negócio e não contrato vigente. Devem ser totalmente parametrizáveis.**

### Arquitetura multi-PSP

Mercado Pago pode ser o primeiro provedor, mas a arquitetura não pode ficar presa a ele.

O Core deve permitir troca ou convivência entre provedores conforme custo, modalidade, cliente, volume e negociação comercial.

Entidades/regras devem suportar:

**tenant -> merchant account/subaccount -> PSP -> credentials -> métodos de pagamento -> MDR/custo -> fee Impulsionando -> settlement -> reconciliation.**

---

## 8. SUBCONTAS E ISOLAMENTO FINANCEIRO

Cada cliente que utilizar checkout/pagamentos deve ter isolamento financeiro e contábil claro.

Quando suportado pelo PSP, utilizar subcontas/contas conectadas ou modelo equivalente. A arquitetura deve preservar:

- titularidade financeira;
- regras de split;
- saldo;
- recebíveis;
- taxas;
- antecipações, se houver;
- estornos;
- chargebacks;
- repasses;
- conciliação;
- trilha de auditoria.

Credenciais financeiras nunca devem ser compartilhadas de maneira insegura entre tenants.

---

## 9. LEDGER FINANCEIRO CENTRAL

Este é requisito estrutural.

A Impulsionando deve possuir ledger próprio, reconciliável e com trilha de auditoria. Não basta consultar o gateway para descobrir o estado financeiro.

O ledger deve permitir representar, por transação:

- valor bruto;
- custo do PSP/adquirente;
- fee Impulsionando;
- comissão de afiliado;
- participação do produtor;
- participação do coprodutor;
- impostos/obrigações quando aplicáveis;
- reservas;
- estornos;
- chargebacks;
- saldo futuro;
- saldo disponível;
- repasses;
- liquidação;
- reconciliação.

Princípio: **o PSP informa o movimento do dinheiro; o ledger Impulsionando explica economicamente a quem pertence cada valor.**

---

## 10. UMA ÚNICA VENDA EM TODO O ECOSSISTEMA

ERP, CRM, checkout, afiliados, estoque, fiscal, BI e automações não podem criar versões independentes da mesma venda.

Cada operação deve possuir identificador único, capaz de relacionar:

- tenant;
- comprador;
- membro do Clube;
- produto/serviço;
- pedido;
- estoque;
- checkout;
- pagamento;
- PSP;
- afiliado;
- produtor/coprodutor;
- comissão;
- split;
- documento fiscal;
- CRM;
- financeiro;
- jornadas N8N;
- BI;
- pós-venda.

Uma venda confirmada deve poder disparar, conforme configuração:

1. confirmação de pagamento;
2. baixa/comprometimento de estoque;
3. registro no CRM;
4. atualização de recorrência e LTV;
5. cálculo de comissão e split;
6. lançamento no ledger;
7. atualização de dashboards e metas;
8. emissão/consulta fiscal quando aplicável;
9. comunicação transacional;
10. jornadas de relacionamento, retenção e recompra;
11. registro no histórico do Clube quando aplicável.

---

## 11. BI MASTER DE MONETIZAÇÃO

O Master Impulsionando deve possuir visão consolidada e drill-down de todos os motores de receita.

Indicadores esperados:

- MRR e ARR SaaS;
- receita por plano empresarial;
- receita White Label;
- número de WLs por nível;
- utilização de pontos por WL;
- receita do Clube;
- assinantes ativos;
- churn do Clube;
- GMV processado;
- GMV por tenant/produtor/afiliado;
- take rate;
- receita bruta transacional;
- custo PSP;
- margem transacional;
- receita por fees;
- afiliados ativos;
- produtores/coprodutores ativos;
- comissão paga/prevista;
- saldo a repassar;
- refunds;
- chargebacks;
- taxa de aprovação;
- ticket médio;
- LTV;
- CAC quando disponível;
- churn SaaS;
- inadimplência;
- receita total do ecossistema.

Todo indicador deve, sempre que possível, permitir drill-down até as operações que o compõem.

---

## 12. ENTIDADES CONCEITUAIS A PREVER NA ARQUITETURA

Não significa implementar tudo imediatamente. Significa garantir que a reengenharia não bloqueie esta evolução.

Considerar, entre outras:

- plans;
- plan_versions;
- subscriptions;
- tenants;
- white_label_accounts;
- white_label_capacity;
- white_label_contracts;
- club_memberships;
- products;
- offers;
- campaigns;
- producers;
- co_producers;
- affiliates;
- affiliate_links;
- attribution;
- orders;
- order_items;
- payments;
- payment_accounts;
- payment_providers;
- fee_rules;
- splits;
- commissions;
- ledger_entries;
- receivables;
- settlements;
- payouts;
- refunds;
- chargebacks;
- reconciliations.

Os nomes finais podem variar conforme a modelagem existente; o requisito é preservar os conceitos e relacionamentos.

---

## 13. PRINCÍPIO DE ARQUITETURA PARA K1/CAUÃ

Antes de criar qualquer recurso financeiro/comercial, responder:

1. Isto pertence ao Core ou apenas a um tenant?
2. A regra precisa ser parametrizável?
3. Existe histórico/versionamento da regra comercial?
4. Esta transação está ligada ao mesmo pedido/venda do ERP/CRM?
5. O Master consegue auditar e conciliar?
6. Há isolamento entre tenants e White Labels?
7. O módulo pode funcionar com outro PSP no futuro?
8. O recurso suporta produtor/coprodutor/afiliado quando aplicável?
9. O Clube consegue receber o histórico autorizado da operação?
10. O Impulsionito e o BI conseguem compreender o evento sem duplicação de dados?

---

## 14. VISÃO DO CICLO COMPLETO

A estratégia de monetização fecha o ciclo quando:

**Empresa contrata Impulsionando -> opera no Core -> vende -> consumidor pode estar no Clube -> pedido entra no histórico -> afiliado pode originar a venda -> Checkout Impulsionando processa -> PSP liquida -> split distribui -> ledger registra -> ERP contabiliza -> CRM conhece -> BI consolida -> automações atuam -> Impulsionito aprende, orienta e multiplica.**

White Labels utilizam a mesma arquitetura para suas próprias carteiras, respeitando isolamento e hierarquia.

---

## 15. REGRAS DE PREÇO — RESUMO EXECUTIVO

### Empresa final
- Essencial: 0,5 salário mínimo/mês.
- Ideal: 1 salário mínimo/mês.
- Full: 2 salários mínimos/mês.

### White Label
- WL1: 1 salário mínimo/mês — 10 pontos.
- WL2: 2 salários mínimos/mês — 23 pontos acumulados.
- WL3: 3 salários mínimos/mês — 41 pontos acumulados.
- WL4: 4 salários mínimos/mês — 61 pontos acumulados.

Consumo por cliente White Label:
- Essencial: 1 ponto.
- Ideal: 3 pontos.
- Full: 5 pontos.

### Clube Impulsionando
- R$ 16,90/mês — pendente de confirmação final antes do go-live.

### Afiliados / produtores / coprodutores
- cobrança por percentual, fee fixo, mensalidade ou composição, sempre parametrizável e versionada.

### Checkout Impulsionando
- hipótese inicial de referência: cobrar 5% no crédito à vista e buscar custo de aproximadamente 2,5% junto ao operador.
- percentuais não são definitivos nem devem ser hardcoded.

---

## 16. STATUS DESTE DOCUMENTO

**Status:** Intake oficial.

**Execução:** não executar alteração de código automaticamente.

**Uso:** referência obrigatória para arquitetura, reengenharia, modelagem financeira, pagamentos, ERP, CRM, PDV, Clube, White Label, afiliados, checkout, BI e Impulsionito.

**Prioridade arquitetural:** decisões tomadas agora não podem inviabilizar nenhum dos canais de monetização descritos acima.

**Regra de preservação:** este Intake complementa os Intakes anteriores; em caso de divergência de preços, prevalecem as regras comerciais consolidadas neste documento, salvo instrução posterior expressa de Raygs.
