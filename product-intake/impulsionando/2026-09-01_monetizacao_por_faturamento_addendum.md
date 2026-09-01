# ADENDO OFICIAL AO PRODUCT INTAKE MESTRE — IMPULSIONANDO

## MONETIZAÇÃO POR FATURAMENTO / REVENUE SHARE / VALOR FIXO VARIÁVEL

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**VINCULADO A:** `product-intake/impulsionando/2026-09-01_impulsionando_master_intake.md`  
**EXECUÇÃO FUTURA:** Cauã / programador  

> **NÃO EXECUTAR AGORA.** Este documento complementa e passa a fazer parte normativa do Superprompt Mestre da Impulsionando.

---

# 1. OBJETIVO

Preparar o ecossistema Impulsionando para um modelo futuro de monetização híbrida, no qual a receita da Impulsionando por tenant possa combinar:

- mensalidade/plano;
- percentual do faturamento bruto do cliente;
- valor fixo adicional;
- faixas progressivas/regressivas de faturamento;
- mínimo mensal garantido;
- teto mensal quando contratualmente previsto;
- combinações parametrizáveis.

O modelo deve funcionar de forma semelhante a contratos de shopping/locação percentual: existe o valor fixo de utilização da plataforma e, quando contratado, uma parcela variável vinculada ao faturamento do negócio.

---

# 2. CONFIGURAÇÃO CONTRATUAL POR CLIENTE

No Dashboard Master da Impulsionando, cada tenant deve possuir uma seção **Monetização por Faturamento**.

Campos parametrizáveis:

- habilitado: sim/não;
- data de início;
- data de término;
- base de cálculo;
- percentual contratado;
- valor fixo adicional;
- mínimo mensal;
- teto mensal;
- franquia/valor isento, quando houver;
- faixas de faturamento, quando houver;
- periodicidade de apuração;
- dia de fechamento;
- dia de vencimento;
- regra de arredondamento;
- regra de estorno/devolução;
- regra para cancelamentos;
- regra para impostos/frete/taxas na base, conforme contrato;
- contrato e versão do contrato;
- responsável pela aprovação;
- status.

Nenhuma regra deve ficar hard-coded.

---

# 3. BASE DE FATURAMENTO

A base de cálculo deve ser tecnicamente definida e contratualmente explícita.

Possíveis bases, conforme contrato:

- faturamento bruto aprovado;
- faturamento bruto liquidado;
- vendas faturadas;
- vendas efetivamente recebidas;
- vendas líquidas de cancelamentos;
- outra base parametrizada.

A interface deve sempre indicar qual base está sendo usada.

---

# 4. FONTE DO FATURAMENTO

Prioridade de fontes:

1. gateway/meio de pagamento do próprio tenant;
2. ERP Impulsionando;
3. e-commerce/PDV integrado;
4. conciliação bancária/Open Finance quando aplicável;
5. API externa autorizada;
6. importação manual auditada como contingência.

Nunca calcular revenue share sobre número fictício ou manual não auditado sem sinalização.

---

# 5. EXEMPLO DE CÁLCULO

Contrato: 2% do faturamento bruto.  
Faturamento-base do mês: R$ 100.000,00.  
Valor variável devido à Impulsionando: R$ 2.000,00.

O cálculo deve ser visível e auditável:

**R$ 100.000,00 × 2% = R$ 2.000,00**

Se houver mensalidade Full, o dashboard deve separar:

- mensalidade do plano;
- revenue share;
- outros adicionais contratados;
- total devido no período.

---

# 6. DASHBOARD DO CLIENTE / TENANT

Cada cliente deve possuir em seu próprio dashboard uma área clara de **Custos Impulsionando / Monetização**.

Exibir no período selecionado:

- faturamento-base do cliente;
- fonte do faturamento;
- percentual contratado;
- valor variável calculado;
- mensalidade do plano;
- adicionais;
- valor total devido à Impulsionando;
- valor pago;
- valor pendente;
- vencimento;
- status;
- histórico;
- notas fiscais;
- memória de cálculo.

O cliente deve enxergar exatamente como o valor foi calculado.

---

# 7. ERP DO CLIENTE

Quando o revenue share do período for apurado, o ERP do próprio tenant deverá gerar automaticamente a obrigação financeira correspondente.

Exemplo:

- faturamento-base: R$ 100.000,00;
- percentual: 2%;
- obrigação: R$ 2.000,00;
- favorecido/fornecedor: Impulsionando;
- categoria: Plataforma / Revenue Share / Tecnologia, conforme plano de contas configurado;
- centro de custo: configurável;
- competência: mês da apuração;
- vencimento: conforme contrato.

Esse lançamento deve aparecer em **Contas a Pagar** do tenant.

---

# 8. CONTABILIZAÇÃO NA IMPULSIONANDO

Simultaneamente, no ERP/RP da Impulsionando, o mesmo evento deve gerar:

- conta a receber do tenant;
- competência;
- faturamento-base informado;
- percentual;
- valor calculado;
- plano relacionado;
- contrato;
- status de cobrança;
- NF relacionada;
- pagamento;
- conciliação.

Os dois lados devem possuir correlação por identificador único.

---

# 9. GERAÇÃO AUTOMÁTICA DE NOTA FISCAL

Após o evento fiscal/financeiro definido pela parametrização do tenant, a Impulsionando deverá gerar automaticamente a NF correspondente ao valor recebido/devido pelo serviço de revenue share, observando validação contábil/fiscal.

No exemplo de R$ 2.000,00:

- prestador: Impulsionando;
- tomador: cliente/tenant;
- valor do serviço: R$ 2.000,00;
- descrição conforme natureza contratual/fiscal;
- referência: competência e contrato;
- status da NF;
- número;
- PDF/XML ou documentos equivalentes quando provider disponibilizar.

Nunca duplicar NF por retry/webhook duplicado.

---

# 10. DISPONIBILIZAÇÃO AUTOMÁTICA DA NF AO CLIENTE

A NF emitida pela Impulsionando deve ser automaticamente disponibilizada no dashboard do tenant.

Área:

**Financeiro → Impulsionando → Notas Fiscais**

Mostrar:

- competência;
- valor;
- número;
- data de emissão;
- status;
- download/visualização;
- cobrança relacionada;
- memória de cálculo.

Também poderá ser enviada por e-mail conforme configuração.

---

# 11. COBRANÇA JUNTO COM A MENSALIDADE

A arquitetura deve permitir:

### A. Cobrança separada
Mensalidade e revenue share como cobranças independentes.

### B. Cobrança consolidada
Uma única fatura/cobrança contendo:

- Plano Full;
- revenue share;
- adicionais.

A opção deve ser parametrizada por contrato/tenant.

---

# 12. RETENÇÃO AUTOMÁTICA NO GATEWAY

Quando o gateway/provider do tenant suportar split ou retenção automática e houver contrato/autorização compatível, prever modo de liquidação automática:

**venda do tenant → gateway → percentual Impulsionando separado → saldo tenant + saldo Impulsionando.**

Esse modo deve ser tratado como capacidade específica do provider, nunca presumida.

Se split automático não estiver disponível, usar apuração + cobrança posterior.

---

# 13. SPLIT — CONTROLES

Quando habilitado:

- split configurado por tenant;
- percentual versionado;
- vigência;
- provider;
- conta recebedora;
- webhook;
- conciliação;
- estorno proporcional;
- chargeback;
- cancelamento;
- refund;
- logs;
- auditoria.

Alteração de percentual exige autorização e nova vigência contratual.

---

# 14. CANCELAMENTOS / ESTORNOS / DEVOLUÇÕES

O cálculo mensal deve tratar corretamente:

- venda cancelada;
- estorno total;
- estorno parcial;
- chargeback;
- devolução;
- ajuste posterior;
- venda de competência anterior.

Criar lançamentos de ajuste em vez de apagar histórico.

---

# 15. FECHAMENTO MENSAL

Processo sugerido:

**captura contínua → prévia diária → fechamento da competência → reconciliação → apuração → cobrança → NF → pagamento/conciliação → fechamento.**

Status:

- aberto;
- prévia;
- em reconciliação;
- fechado;
- faturado;
- pago;
- ajustado.

---

# 16. PRÉVIA EM TEMPO QUASE REAL

Durante o mês, cliente e Impulsionando podem visualizar uma prévia:

- faturamento acumulado;
- revenue share estimado até o momento;
- mensalidade;
- total estimado.

A interface deve marcar claramente **PRÉVIA / NÃO FATURADO** até o fechamento.

---

# 17. DASHBOARD MASTER — VISÃO CONSOLIDADA

Criar área no Dashboard Master:

## Monetização por Faturamento

KPIs:

- faturamento bruto total monitorado dos tenants;
- receita variável da Impulsionando no mês;
- receita variável recebida;
- receita variável a receber;
- mensalidades recebidas;
- receita total por clientes;
- previsão do mês seguinte;
- receita acumulada no ano;
- ticket médio de revenue share;
- número de tenants com modelo ativo;
- inadimplência do revenue share.

---

# 18. DASHBOARD MASTER — POR CLIENTE

Permitir filtro/drill-down por tenant mostrando:

- nome do cliente;
- faturamento do período em R$;
- percentual contratado;
- valor variável calculado;
- mensalidade;
- adicionais;
- total gerado para Impulsionando;
- total recebido;
- total pendente;
- histórico mensal;
- acumulado anual;
- acumulado desde início do contrato;
- previsão futura;
- NF emitidas;
- cobranças;
- ajustes.

---

# 19. RANKINGS E ANÁLISE

Permitir rankings administrativos:

- maiores faturamentos;
- maiores receitas para Impulsionando;
- maior crescimento mensal;
- maior crescimento anual;
- maior ticket médio;
- maior participação variável;
- clientes em queda;
- clientes com divergência de dados.

Esses rankings são internos e permissionados.

---

# 20. HISTÓRICO

Preservar por competência:

- faturamento-base;
- fonte;
- percentual vigente;
- fórmula;
- valor calculado;
- ajustes;
- total final;
- cobrança;
- NF;
- pagamento;
- conciliação;
- contrato vigente.

Nunca recalcular retroativamente silenciosamente quando regra futura mudar.

---

# 21. PREVISÃO

Criar forecast de receita para Impulsionando baseado em:

- contratos ativos;
- mensalidades;
- percentuais;
- faturamento histórico;
- sazonalidade quando houver dados suficientes;
- crescimento/queda observada.

Distinguir claramente:

- realizado;
- contratado;
- previsto;
- estimado.

---

# 22. CONTRATO

O contrato deve definir explicitamente:

- percentual/valor;
- base de cálculo;
- fonte oficial;
- período de apuração;
- vencimento;
- auditoria;
- divergências;
- estornos;
- cancelamentos;
- acesso a dados de faturamento;
- emissão fiscal;
- inadimplência;
- suspensão, se aplicável;
- vigência;
- reajuste/alteração.

Revisão jurídica, contábil e tributária obrigatória antes da ativação comercial real.

---

# 23. AUDITORIA DO FATURAMENTO

Toda competência precisa guardar evidências de origem dos números.

Permitir reconciliação entre:

- gateway;
- ERP;
- PDV/e-commerce;
- banco;
- NF de vendas quando aplicável.

Divergência relevante cria alerta e bloqueia fechamento automático conforme política.

---

# 24. PERMISSIONAMENTO

### Cliente/Tenant
Vê apenas seu próprio cálculo, cobrança, histórico e NF.

### Financeiro do tenant
Pode conferir e conciliar.

### Contador do tenant
Pode visualizar obrigação, NF e lançamentos contábeis permitidos.

### Financeiro Impulsionando
Pode operar cobranças, ajustes e conciliação.

### Master Impulsionando
Visão total consolidada.

### Comercial
Pode visualizar condições contratuais necessárias, sem alterar valores financeiros já fechados.

---

# 25. IMPULSIONITO

O Impulsionito deve compreender esse modelo.

Perguntas de teste:

- “Quanto a Impulsionando faturou de revenue share este mês?”
- “Qual cliente gerou mais receita variável?”
- “Quanto o Cliente X faturou e quanto deve à Impulsionando?”
- “Quais clientes ainda não pagaram o percentual do mês?”
- “Qual a previsão de revenue share do próximo mês?”
- “A NF do Cliente X foi emitida?”

Todas as respostas devem partir de dados reais e respeitar permissões.

---

# 26. AUTOMAÇÕES / EVENTOS

Eventos sugeridos:

- tenant.revenue_updated;
- revenue_share.preview_updated;
- revenue_share.period_closed;
- revenue_share.invoice_created;
- revenue_share.payment_due;
- revenue_share.payment_approved;
- revenue_share.payment_failed;
- revenue_share.adjusted;
- revenue_share.nf_issued.

N8N pode orquestrar comunicações e tarefas, mantendo o cálculo financeiro no Core transacional.

---

# 27. TESTE E2E PRINCIPAL

Cenário:

1. tenant possui contrato Full + 2% de faturamento;
2. tenant realiza R$ 100.000,00 de faturamento válido;
3. sistema consolida a base;
4. revenue share calculado = R$ 2.000,00;
5. dashboard do tenant mostra cálculo;
6. ERP tenant gera R$ 2.000,00 em Contas a Pagar para Impulsionando;
7. ERP Impulsionando gera R$ 2.000,00 em Contas a Receber;
8. cobrança é criada/consolidada conforme contrato;
9. NF de R$ 2.000,00 é emitida pela Impulsionando;
10. NF aparece automaticamente no dashboard do tenant;
11. pagamento é identificado;
12. ambos ERPs são conciliados;
13. Dashboard Master agrega o valor ao total mensal da Impulsionando.

Todos os passos devem ser auditáveis.

---

# 28. TESTES DE EXCEÇÃO

Testar:

- faturamento zero;
- cancelamentos;
- estorno após fechamento;
- webhook duplicado;
- gateway indisponível;
- faturamento divergente;
- percentual alterado no meio do mês;
- contrato encerrado;
- pagamento parcial;
- NF falhou;
- retry de NF;
- chargeback;
- tenant inadimplente;
- importação manual corrigida.

---

# 29. CRITÉRIO DE PRONTO

O módulo somente estará pronto quando:

- parametrização contratual PASS;
- captura de faturamento PASS;
- cálculo PASS;
- memória de cálculo PASS;
- dashboard tenant PASS;
- lançamento ERP tenant PASS;
- lançamento ERP Impulsionando PASS;
- cobrança PASS;
- NF PASS;
- disponibilização da NF PASS;
- pagamento/conciliação PASS;
- Dashboard Master PASS;
- histórico PASS;
- forecast PASS;
- RBAC/RLS PASS;
- auditoria PASS;
- testes de exceção PASS.

---

# 30. PRINCÍPIO FINAL

A monetização variável precisa ser **transparente para ambos os lados**.

O cliente sempre deve conseguir responder:

**“Quanto faturei, qual percentual contratei, quanto devo à Impulsionando e qual documento fiscal corresponde a esse valor?”**

A Impulsionando deve conseguir responder:

**“Quanto cada cliente faturou, quanto gerou de receita, quanto já recebemos, quanto falta receber e qual é a projeção consolidada?”**

Tudo integrado a contrato + gateway + ERP/RP + financeiro + NF + BI + Impulsionito.

---

**STATUS:** ADENDO DE PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** CAUÃ / PROGRAMADOR  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**