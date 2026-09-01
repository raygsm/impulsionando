# ADENDO OFICIAL AO PRODUCT INTAKE MESTRE — IMPULSIONANDO

## IMPULSIONANDO PAYMENTS — CHECKOUT PRÓPRIO, SPLIT, AFILIADOS, COPRODUTORES, CARTEIRA, CHARGEBACK, D3/D33 E TURBO D+1

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**VINCULADO A:** `product-intake/impulsionando/2026-09-01_impulsionando_master_intake.md` e `product-intake/impulsionando/2026-09-01_monetizacao_por_faturamento_addendum.md`  
**EXECUÇÃO FUTURA:** Cauã / programador  

> **NÃO EXECUTAR AGORA.** Este documento consolida a camada futura de pagamentos, marketplace, split e antecipação da Impulsionando. Todas as taxas, prazos e capacidades operacionais dependentes de adquirente/subadquirente/provider devem ser parametrizáveis e confirmadas contratualmente antes do go-live real.

---

# 1. OBJETIVO

Criar uma camada nativa **Impulsionando Payments** para que tenants possam, opcionalmente, utilizar o checkout transparente da própria Impulsionando como camada comercial/orquestradora de pagamentos em vez de integrar diretamente seus checkouts a Getnet, Mercado Pago ou outro adquirente.

A Impulsionando deve poder monetizar de três formas, isoladas ou combinadas:

1. mensalidade do plano;
2. percentual do faturamento/revenue share;
3. taxa transacional sobre pagamentos processados pelo Impulsionando Payments.

Para determinados projetos, a Impulsionando poderá operar **sem mensalidade**, cobrando somente percentual/transação sobre tudo que for processado pela camada de pagamento, quando previsto em contrato.

---

# 2. MODELO COMERCIAL DE REFERÊNCIA

Valores de referência definidos para o Intake, sempre parametrizáveis:

### Pix
- taxa Impulsionando: **2%** sobre o valor aprovado;
- liquidação ao tenant: **D3**, conforme regra comercial definida;
- split automático quando provider suportar.

### Cartão de crédito
- taxa Impulsionando: **6%** sobre o valor aprovado;
- juros/encargos de parcelamento do adquirente repassados ao comprador final conforme política contratada;
- referência adicional de custo financeiro/adquirência: **2,99% ao mês, A CONFIRMAR conforme adquirente/provider e parcelamento**;
- liquidação padrão ao tenant: **D33**.

Todos esses valores devem existir como configuração versionada por:

- tenant;
- produto/plano;
- método de pagamento;
- adquirente;
- número de parcelas;
- vigência;
- contrato.

Nunca hard-code taxas no frontend ou no cálculo financeiro.

---

# 3. EXEMPLO PRINCIPAL — CARTÃO

Venda aprovada: **R$ 100.000,00**  
Taxa Impulsionando: **6%**  
Receita da Impulsionando: **R$ 6.000,00**  
Saldo bruto destinado ao tenant: **R$ 94.000,00**, antes de outros splits contratados, ajustes, antecipação e encargos do adquirente quando aplicáveis.

Memória de cálculo visível:

**R$ 100.000,00 × 6% = R$ 6.000,00**

**R$ 100.000,00 − R$ 6.000,00 = R$ 94.000,00**

---

# 4. EXEMPLO PRINCIPAL — PIX

Venda Pix aprovada: **R$ 100.000,00**  
Taxa Impulsionando: **2%**  
Receita da Impulsionando: **R$ 2.000,00**  
Saldo bruto destinado ao tenant: **R$ 98.000,00**, antes de outros splits/ajustes quando aplicáveis.

Liquidação operacional de referência ao tenant: **D3**.

---

# 5. CHECKOUT TRANSPARENTE IMPULSIONANDO

O checkout deve permitir, conforme tenant:

- Pix;
- cartão de crédito;
- parcelamento;
- cupom;
- identificação do cliente final;
- endereço quando necessário;
- antifraude/provider;
- cálculo de juros;
- split;
- afiliado;
- coprodutor;
- parceiro;
- comissão;
- origem/UTM;
- produto/serviço;
- pedido;
- NF do tenant quando aplicável;
- recibos;
- tracking de status.

A experiência do comprador final deve manter branding do tenant, com tecnologia Impulsionando em segundo plano.

---

# 6. ARQUITETURA DE PAGAMENTOS

A Impulsionando deve atuar como camada de orquestração, não inventar capacidades financeiras inexistentes.

O Core deve abstrair providers por interfaces comuns:

- create_payment;
- authorize;
- capture;
- create_pix;
- create_split;
- refund;
- chargeback;
- anticipate;
- payout;
- reconcile;
- get_balance;
- get_schedule.

Providers podem variar sem alterar a lógica de negócio do Core.

---

# 7. ONBOARDING FINANCEIRO DO TENANT

Para utilizar Impulsionando Payments, cada tenant deverá possuir onboarding financeiro/KYB compatível com o provider:

- CNPJ/CPF;
- razão social;
- responsáveis;
- documentos;
- conta bancária;
- chave Pix;
- dados societários quando exigidos;
- validação;
- status;
- contrato;
- aceite de taxas;
- política de chargeback;
- política de antecipação.

Status:

- não iniciado;
- em cadastro;
- em análise;
- aprovado;
- pendência;
- bloqueado;
- suspenso.

---

# 8. MOTOR DE SPLIT

Criar motor genérico de split por transação.

Atores possíveis:

- Impulsionando;
- tenant/produtor principal;
- afiliado;
- coprodutor;
- parceiro;
- vendedor;
- profissional;
- unidade/franquia;
- comissão customizada.

Cada split deve ser configurável em:

- percentual;
- valor fixo;
- prioridade;
- base de cálculo;
- vigência;
- produto;
- campanha;
- tenant;
- regra de estorno.

---

# 9. EXEMPLO MULTIATOR

Venda: R$ 100.000,00  
Impulsionando: 6% = R$ 6.000,00  
Coprodutor: 1% = R$ 1.000,00  
Saldo restante do produtor/tenant: R$ 93.000,00, antes de outros encargos do adquirente e demais splits.

Cada ator visualiza imediatamente no dashboard:

- valor da venda;
- percentual;
- comissão/split;
- status;
- data prevista para liberação;
- saldo disponível;
- saldo futuro;
- retenções;
- ajustes.

---

# 10. ORDEM DE CÁLCULO

Definir formalmente no contrato/configuração a ordem de incidência:

1. valor bruto da venda;
2. descontos/cupons;
3. taxa Impulsionando;
4. custo do adquirente/parcelamento quando aplicável;
5. splits de terceiros;
6. reservas/retenções;
7. saldo líquido do tenant.

A ordem deve ser parametrizável e versionada, pois diferentes providers podem tratar split e MDR de formas distintas.

---

# 11. AFILIADOS

Módulo universal de afiliados, inspirado funcionalmente em plataformas como Monetizze/Perfect Pay, sem copiar identidade ou propriedade intelectual.

Recursos:

- cadastro;
- aprovação;
- links únicos;
- UTMs;
- cookies/atribuição quando permitidos;
- cupons exclusivos;
- campanhas;
- produtos habilitados;
- percentual/valor de comissão;
- regras por produto;
- ranking;
- metas;
- premiações;
- carteira;
- extrato;
- saque/repasse;
- chargeback;
- bloqueio;
- auditoria.

---

# 12. COPRODUTORES

O tenant deve poder cadastrar coprodutores com:

- identificação;
- KYC/KYB;
- contrato;
- produto associado;
- percentual;
- vigência;
- responsabilidades;
- carteira;
- repasses;
- ajustes;
- histórico.

O coprodutor visualiza apenas suas próprias operações e valores.

---

# 13. CARTEIRA FINANCEIRA POR ATOR

Cada ator deve possuir ledger/carteira com saldos separados:

- saldo pendente;
- saldo a liberar;
- saldo disponível;
- saldo reservado;
- saldo em disputa;
- saldo negativo;
- saldo pago.

Nunca usar apenas um campo `balance` mutável sem ledger transacional.

---

# 14. LEDGER DE DUPLA ENTRADA

Implementar ledger financeiro robusto com lançamentos imutáveis/correlacionados.

Eventos:

- venda;
- taxa;
- split;
- comissão;
- reserva;
- liberação;
- antecipação;
- payout;
- refund;
- chargeback;
- reversão;
- ajuste;
- NF.

Nunca editar histórico financeiro; usar lançamentos compensatórios.

---

# 15. CHARGEBACK

Quando houver chargeback:

- localizar transação original;
- identificar todos os atores beneficiados;
- calcular reversão proporcional;
- debitar carteira de cada ator;
- se saldo insuficiente, gerar saldo negativo/débito futuro;
- bloquear saque se necessário;
- registrar disputa;
- atualizar dashboard;
- notificar envolvidos conforme regra;
- conciliar provider.

---

# 16. REFUND / ESTORNO

Suportar:

- total;
- parcial;
- antes do payout;
- depois do payout;
- em múltiplas parcelas quando provider permitir.

Reversão dos splits deve seguir exatamente a transação original e as regras do provider.

---

# 17. RESERVA DE SEGURANÇA

Prever, quando contratualmente/provider exigir:

- rolling reserve;
- reserva por risco;
- retenção temporária;
- bloqueio por chargeback elevado;
- saldo mínimo.

Tudo visível e auditável.

---

# 18. CALENDÁRIO DE RECEBÍVEIS

Cada tenant/ator deve possuir agenda financeira com:

- venda;
- método;
- data da venda;
- parcelas;
- valor bruto;
- taxas;
- splits;
- data prevista de liberação;
- data prevista de payout;
- status.

Para referência comercial atual:

- Pix: **D3**;
- cartão padrão: **D33**.

Esses prazos devem ser configuráveis por provider/tenant.

---

# 19. ANTECIPAÇÃO MANUAL

O tenant pode selecionar um recebível elegível de cartão e solicitar antecipação manual.

Fluxo:

**recebível D33 → selecionar → simular antecipação → mostrar custo → confirmar → provider processa → receber D+1 útil quando elegível.**

Cada solicitação é individual e exige ação explícita do usuário autorizado.

---

# 20. SIMULAÇÃO DE ANTECIPAÇÃO

Antes da confirmação, mostrar:

- valor bruto;
- saldo líquido sem antecipação;
- data original D33;
- taxa de antecipação;
- valor da taxa;
- valor líquido antecipado;
- nova data prevista;
- provider;
- observações.

Nada deve ser antecipado sem preview e aceite.

---

# 21. MODO TURBO

Criar feature **TURBO**.

Quando ativado pelo tenant autorizado:

- todos os recebíveis de cartão elegíveis passam automaticamente para liquidação **D+1 útil**;
- aplicar taxa adicional de antecipação de referência de **6%**, conforme regra comercial definida;
- taxa deve ser parametrizável e confirmada por provider/adquirente;
- novos recebíveis devem exibir desde a venda o valor líquido estimado e a data D+1;
- tenant pode desligar o Turbo para vendas futuras;
- mudança não deve alterar retroativamente recebíveis já processados sem regra explícita.

---

# 22. TURBO — EXEMPLO

Venda cartão: R$ 100.000,00.  
Taxa Impulsionando base: 6% = R$ 6.000,00.  
Saldo após taxa base: R$ 94.000,00.  
Turbo: taxa adicional de referência 6%, calculada sobre a base contratualmente definida.

A base exata da antecipação deve ser parametrizada conforme provider, podendo incidir sobre bruto, líquido ou recebível elegível.

O sistema nunca deve inferir silenciosamente essa base.

---

# 23. TURBO — CONFIGURAÇÃO

Campos:

- ativo/inativo;
- taxa;
- base de cálculo;
- D+ alvo;
- métodos elegíveis;
- parcelas elegíveis;
- provider;
- vigência;
- aceite;
- usuário que ativou;
- data/hora;
- limite;
- exceções.

---

# 24. PERMISSIONAMENTO DA ANTECIPAÇÃO

Perfis possíveis:

- Master tenant: configurar Turbo e antecipar;
- Financeiro tenant: antecipar se autorizado;
- Contador: somente visualizar;
- Impulsionando Financeiro: administrar regras/provider;
- Master Impulsionando: visão total auditada.

Ativação do Turbo deve exigir MFA/step-up authentication quando tecnicamente possível.

---

# 25. DASHBOARD DO TENANT — PAYMENTS

Área própria:

- faturamento bruto;
- vendas aprovadas;
- Pix;
- cartão;
- taxas Impulsionando;
- custo adquirente;
- splits;
- afiliados;
- coprodutores;
- saldo pendente;
- saldo disponível;
- próximos recebimentos;
- D3;
- D33;
- Turbo;
- antecipações;
- chargebacks;
- refunds;
- payouts;
- NF/documentos.

---

# 26. DASHBOARD DO TENANT — TRANSPARÊNCIA DE CADA VENDA

Cada venda deve abrir uma memória financeira detalhada:

**Valor bruto → desconto → taxa Impulsionando → custo adquirente → juros → split afiliado → split coprodutor → reserva → líquido tenant → calendário de recebimento.**

---

# 27. DASHBOARD DO AFILIADO

Mostrar:

- cliques/leads quando rastreados;
- vendas atribuídas;
- comissão;
- pendente;
- disponível;
- pago;
- chargeback;
- saldo negativo;
- campanhas;
- cupons;
- metas;
- ranking.

---

# 28. DASHBOARD DO COPRODUTOR

Mostrar:

- produtos vinculados;
- vendas;
- percentual;
- comissão;
- agenda de recebíveis;
- saldo;
- ajustes;
- chargebacks;
- extrato;
- documentos.

---

# 29. DASHBOARD MASTER IMPULSIONANDO — PAYMENTS

KPIs:

- TPV/GMV processado;
- receita transacional;
- receita Pix;
- receita cartão;
- receita Turbo;
- taxa efetiva média;
- tenants ativos;
- volume por tenant;
- splits pagos;
- payouts;
- chargeback rate;
- refund rate;
- antecipações;
- saldo em risco;
- receita prevista;
- receita realizada.

---

# 30. FILTROS MASTER

Filtrar por:

- tenant;
- período;
- método;
- provider;
- produto;
- afiliado;
- coprodutor;
- status;
- chargeback;
- Turbo ativo;
- D3/D33/D+1.

---

# 31. REPASSE / PAYOUT

Payout automático conforme calendário e saldo elegível.

Controlar:

- conta bancária;
- chave Pix;
- data;
- valor;
- provider;
- id externo;
- status;
- erro;
- retry;
- conciliação.

Nunca disparar payout duplicado.

---

# 32. PIX D3

Para a regra comercial definida:

**venda Pix aprovada → taxa 2% → splits → saldo tenant → payout automático D3.**

Mostrar countdown/data prevista.

---

# 33. CARTÃO D33

Para regra padrão:

**venda cartão aprovada → taxa base 6% → custos/juros/splits → recebível → payout D33**, salvo antecipação manual ou Turbo.

---

# 34. PARCELAMENTO

Para cartão parcelado:

- mostrar número de parcelas;
- juros do comprador;
- custo/provider;
- agenda de recebíveis;
- taxa de antecipação;
- split por parcela ou liquidação, conforme provider;
- chargeback/refund.

Referência de **2,99% a.m.** deve permanecer marcada como **A CONFIRMAR POR ADQUIRENTE/PROVIDER**, nunca como regra universal.

---

# 35. NF E DOCUMENTAÇÃO

Separar obrigações fiscais de:

- venda do tenant ao cliente final;
- serviço/taxa cobrada pela Impulsionando ao tenant;
- comissões de afiliados/coprodutores quando juridicamente aplicável.

Fluxos fiscais devem ser definidos com contador/jurídico antes do go-live.

---

# 36. CONCILIAÇÃO

Conciliar:

- pedido;
- pagamento;
- captura;
- taxa;
- split;
- recebível;
- payout;
- extrato provider;
- extrato bancário;
- NF;
- chargeback;
- refund;
- antecipação.

---

# 37. ANTIFRAUDE

Provider de antifraude/configuração conforme risco.

Estados:

- aprovado;
- revisão;
- recusado;
- contestado.

Nunca armazenar dados completos de cartão fora de ambiente PCI/provider apropriado.

---

# 38. PCI / SEGURANÇA DE CARTÃO

Preferir tokenização e hosted fields/sdk do provider.

Impulsionando não deve armazenar PAN/CVV bruto.

Validar escopo PCI DSS antes do go-live.

---

# 39. WEBHOOKS FINANCEIROS

Eventos críticos:

- payment.created;
- payment.approved;
- payment.failed;
- pix.paid;
- receivable.created;
- split.created;
- payout.scheduled;
- payout.paid;
- anticipation.requested;
- anticipation.approved;
- chargeback.created;
- refund.created;
- wallet.negative.

Todos idempotentes e auditáveis.

---

# 40. IMPULSIONITO

O Impulsionito deve responder com dados reais:

- “Quanto processamos hoje?”
- “Quanto a Impulsionando ganhou em taxas?”
- “Quanto o tenant X recebe em D3?”
- “Quais recebíveis do tenant X estão em D33?”
- “O Turbo está ativo?”
- “Quanto custaria antecipar esta venda?”
- “Quais afiliados estão com saldo negativo por chargeback?”
- “Qual o maior coprodutor do mês?”

---

# 41. AGENTES DOS TENANTS

Agentes especializados podem informar, conforme permissão:

- status de pagamento;
- data prevista;
- recibo;
- Pix;
- parcela;
- refund;
- payout.

Nunca podem alterar split, antecipar ou ativar Turbo sem autorização forte.

---

# 42. TESTE E2E — CARTÃO PADRÃO

1. cliente final compra R$ 100.000;
2. cartão aprovado;
3. taxa Impulsionando 6% calculada;
4. splits terceiros calculados;
5. ledger criado;
6. tenant visualiza líquido e D33;
7. Impulsionando visualiza receita;
8. recebível liberado conforme agenda;
9. payout realizado;
10. conciliação PASS.

---

# 43. TESTE E2E — PIX

1. Pix R$ 100.000;
2. pagamento confirmado;
3. taxa 2%;
4. splits;
5. líquido tenant;
6. calendário D3;
7. payout D3;
8. conciliação.

---

# 44. TESTE E2E — COPRODUTOR

Venda R$ 100.000 com coprodutor 1%:

- comissão calculada R$ 1.000;
- carteira do coprodutor atualizada;
- tenant vê split;
- Master vê split;
- payout segue calendário configurado.

---

# 45. TESTE E2E — CHARGEBACK

Após payout/split:

1. chargeback recebido;
2. transação original localizada;
3. todos os splits revertidos proporcionalmente;
4. carteiras debitadas;
5. saldo insuficiente vira negativo;
6. futuros créditos compensam débito;
7. dashboards atualizados;
8. auditoria completa.

---

# 46. TESTE E2E — ANTECIPAÇÃO MANUAL

1. venda cartão possui D33;
2. financeiro seleciona recebível;
3. sistema calcula custo;
4. usuário confirma;
5. provider aceita;
6. agenda muda para D+1 útil;
7. taxa registrada;
8. líquido atualizado;
9. payout;
10. conciliação.

---

# 47. TESTE E2E — TURBO

1. Master tenant ativa Turbo;
2. aceite e taxa versionados;
3. nova venda cartão aprovada;
4. taxa base + taxa Turbo calculadas conforme bases configuradas;
5. calendário = D+1 útil;
6. dashboard mostra líquido;
7. payout D+1;
8. Master Impulsionando reconhece receita Turbo;
9. desligamento afeta apenas novas vendas conforme regra;
10. auditoria PASS.

---

# 48. TESTES DE EXCEÇÃO

Testar:

- adquirente fora do ar;
- Pix expirado;
- cartão recusado;
- split inválido;
- soma de splits > 100%;
- coprodutor bloqueado;
- KYC pendente;
- payout falho;
- conta bancária inválida;
- webhook duplicado;
- chargeback pós-payout;
- refund parcial;
- antecipação negada;
- Turbo ativo com recebível inelegível;
- saldo negativo;
- mudança de taxa no meio da vigência;
- provider altera calendário;
- arredondamento de centavos.

---

# 49. VALIDAÇÕES DE NEGÓCIO

Bloquear automaticamente:

- splits > base disponível;
- percentual negativo;
- ator sem onboarding quando provider exigir;
- payout para conta não validada;
- antecipação de recebível indisponível;
- alteração retroativa não autorizada;
- edição de ledger fechado.

---

# 50. CONTRATOS

Contratos do Impulsionando Payments devem definir:

- taxa Pix;
- taxa cartão;
- juros/parcelamento;
- provider;
- D3;
- D33;
- antecipação;
- Turbo;
- taxa Turbo;
- splits;
- chargeback;
- reservas;
- payout;
- refund;
- responsabilidades;
- contestação;
- encerramento.

Revisão jurídica, regulatória, tributária e contábil obrigatória antes de operar dinheiro real.

---

# 51. REGULATORY / PAYMENT PROVIDER GATE

Antes do go-live, confirmar com provider e assessoria especializada:

- se o modelo exige subadquirência/marketplace/payment facilitator;
- KYC/KYB dos recebedores;
- responsabilidade por chargeback;
- regras de split;
- liquidação;
- antecipação;
- reservas;
- contas de pagamento;
- obrigações regulatórias/fiscais.

O software deve suportar o modelo, mas não presumir autorização regulatória.

---

# 52. CRITÉRIO DE PRONTO

Somente considerar pronto quando:

- provider escolhido/validado;
- checkout PASS;
- Pix PASS;
- cartão PASS;
- parcelamento PASS;
- split PASS;
- afiliado PASS;
- coprodutor PASS;
- ledger PASS;
- wallet PASS;
- D3 PASS;
- D33 PASS;
- antecipação manual PASS;
- Turbo PASS;
- chargeback PASS;
- refund PASS;
- payout PASS;
- conciliação PASS;
- dashboards PASS;
- RBAC/RLS PASS;
- auditoria PASS;
- compliance/legal PASS;
- zero P0/P1 impeditivo.

---

# 53. PRINCÍPIO FINAL

O Impulsionando Payments deve ser percebido pelo tenant como uma infraestrutura transparente:

**Vendeu → recebeu → taxa ficou clara → splits ficaram claros → calendário ficou claro → cada ator viu seu valor → payout aconteceu → qualquer chargeback foi revertido corretamente → tudo conciliou.**

A Impulsionando precisa conseguir monetizar projetos simples ou complexos por mensalidade, percentual de faturamento, taxa transacional ou combinação desses modelos, sempre com total transparência, ledger auditável e regras parametrizadas.

---

**STATUS:** ADENDO CONSOLIDADO DE PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** CAUÃ / PROGRAMADOR  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**