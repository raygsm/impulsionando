# SUPERPROMPT — PRODUCT INTAKE — PARTNER REVENUE & COMMISSIONS ENGINE

**PROJETO:** Impulsionando / Core Full  
**MÓDULO:** ERP/RP → Parceiros, Produtores, Coprodutores, Afiliados, Indicadores e Comissionamento  
**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  

> NÃO EXECUTAR AUTOMATICAMENTE. Este documento é especificação de Product Intake para implementação futura. Auditar o estado real, preservar o que estiver correto, consolidar regras existentes e implementar somente na etapa técnica autorizada.

## 1. OBJETIVO
Construir no ERP/RP da Impulsionando um motor universal, parametrizável, auditável e transparente de parceiros e participação em receita, capaz de administrar produtores, coprodutores, afiliados, indicadores e parceiros comerciais em vendas pontuais e recorrentes.

## 2. PRINCÍPIO
Nenhuma comissão deve depender de planilha paralela ou cálculo manual. Todo valor deve ser reconstruível de ponta a ponta: **parceiro → vínculo → cliente → contrato → cobrança → item → pagamento → competência → regra → base elegível → comissão → janela de liberação → repasse → comprovante**.

## 3. TIPOS CANÔNICOS DE PARCEIRO
Criar taxonomia parametrizável com, inicialmente: `PRODUTOR`, `COPRODUTOR`, `AFILIADO`, `INDICADOR`, `PARCEIRO_COMERCIAL`, `REPRESENTANTE`, `CONSULTOR`, `AGENCIA/PARCEIRO_DE_CANAL` e `OUTRO`. A gestão pode criar grupos/subgrupos sem alterar código.

## 4. GRUPOS DE PARCEIROS
Permitir grupos como Afiliados Premium, Indicadores, Coprodutores, Parceiros Estratégicos, Representantes Regionais etc., com regras default herdáveis e override individual auditado.

## 5. CADASTRO DO PARCEIRO
Nome/razão social, CPF/CNPJ, contatos, dados fiscais, dados de pagamento, Pix quando aplicável, status, tipo, grupo, responsável interno, início/fim, documentos, contrato, consentimentos, observações e histórico.

## 6. STATUS
`DRAFT`, `PENDING_VALIDATION`, `ACTIVE`, `PAUSED`, `BLOCKED`, `INACTIVE`, `TERMINATED`. Desativar não apaga histórico nem recebíveis legitimamente adquiridos.

## 7. VÍNCULO COMERCIAL
Um parceiro pode ter múltiplos vínculos com clientes, planos, produtos, serviços, campanhas ou contratos, cada qual com regra própria e vigência.

## 8. MODELOS DE REMUNERAÇÃO
Suportar: valor fixo, percentual, híbrido quando aprovado, pontual, recorrente, primeira competência integral, número definido de competências, período definido ou durante a vigência/adimplência do contrato.

## 9. BASES DE INCIDÊNCIA
A gestão deve selecionar facilmente: `SETUP`, `PRORATA`, `FIRST_FULL_MONTHLY_FEE`, `RECURRING_MONTHLY_FEE`, `ADDON`, `SERVICE`, `PRODUCT`, `OTHER_ELIGIBLE_ITEM`.

## 10. SETUP
Setup deve poder ser elegível ou inelegível por regra. O default atual da Impulsionando é **setup sem comissão**, mas a arquitetura não deve hard-code isso: a política deve ser configurável e versionada.

## 11. PRIMEIRA MENSALIDADE
A opção “somente primeira mensalidade” deve significar, por padrão, a primeira mensalidade integral elegível efetivamente recebida, e não um pequeno pro rata inicial.

## 12. RECORRÊNCIA
A opção recorrente gera participação apenas sobre competências elegíveis efetivamente pagas enquanto vínculo, contrato e regra estiverem ativos.

## 13. PRORRATA
O pro rata deve ser item financeiro próprio (`PRORATA_INITIAL_PERIOD`) e sua elegibilidade configurável separadamente.

## 14. COBRANÇA CONSOLIDADA
Uma única cobrança pode conter setup + pro rata + mensalidade integral + add-ons, mas o ledger deve manter cada componente separado para cálculo correto da comissão.

## 15. VENCIMENTO FIXO
Quando cliente entra próximo ao vencimento padrão, calcular dias proporcionais e explicar claramente período e valor.

## 16. EXPERIÊNCIA RECOMENDADA DE PRORRATA
Oferecer, conforme política, opção recomendada de pagar **pro rata + próxima mensalidade integral em uma única cobrança**, fazendo o próximo vencimento ocorrer apenas no ciclo seguinte, evitando duas cobranças muito próximas.

## 17. ALTERNATIVA
Se política permitir, cliente pode pagar apenas pro rata e receber a mensalidade integral no vencimento próximo. A UI deve deixar isso explícito antes da confirmação.

## 18. PARÂMETROS DE PRORRATA
Configurar: dia fixo de vencimento, método de cálculo, timezone, inclusão/exclusão do dia inicial/final, limiar para recomendar cobrança consolidada e comportamento em meses de tamanhos diferentes.

## 19. FATO GERADOR
Receita prevista não gera comissão disponível. O fato gerador é pagamento elegível confirmado e conciliado conforme regra.

## 20. PIX
Regra operacional inicial: pagamento Pix confirmado → repasse do parceiro em **D7**.

## 21. CARTÃO
Regra operacional inicial: pagamento por cartão confirmado → repasse do parceiro em **D37**.

## 22. PARAMETRIZAÇÃO D7/D37
D7/D37 devem ser valores configuráveis do Core, com versionamento e data de vigência, embora sejam os defaults atuais.

## 23. MOTIVO DOS PRAZOS
O sistema deve distinguir data de recebimento, janela operacional, data prevista de liberação, data programada e data efetiva do repasse.

## 24. LEDGER IMUTÁVEL
Não manter apenas “saldo”. Criar ledger append-only/auditável para fatos financeiros, ajustes e reversões.

## 25. ESTADOS DA COMISSÃO
`EXPECTED`, `PAYMENT_PENDING`, `ELIGIBILITY_PENDING`, `ELIGIBLE`, `HOLD_D7`, `HOLD_D37`, `PAYABLE`, `PAYOUT_SCHEDULED`, `PAID_OUT`, `BLOCKED`, `REVERSED`, `CANCELLED`, `DISPUTED`.

## 26. INADIMPLÊNCIA
Sem pagamento confirmado do cliente, não liberar comissão. Exibir claramente valor previsto/bloqueado e motivo.

## 27. REGULARIZAÇÃO
Pagamento posterior confirmado deve reavaliar elegibilidade e iniciar a janela de liberação correta a partir do evento definido pela política.

## 28. CHARGEBACK
Cartão com chargeback deve gerar bloqueio/reversão conforme política, sem apagar o evento original.

## 29. REEMBOLSO
Reembolso total/parcial recalcula a base elegível e gera ajuste/reversão auditável.

## 30. CANCELAMENTO
Cancelamento futuro interrompe novas competências recorrentes sem apagar comissões já legitimamente adquiridas, salvo regra contratual válida de reversão.

## 31. SUSPENSÃO DO CLIENTE
Inadimplência pode suspender serviço conforme contrato e política de billing; o motor de comissão acompanha o mesmo estado financeiro sem decisões paralelas conflitantes.

## 32. REATIVAÇÃO
Pagamento identificado → reativação conforme regra → comissão volta ao fluxo de elegibilidade quando aplicável.

## 33. REGRA DE ATRIBUIÇÃO
Definir quem originou o cliente e como resolver múltiplas atribuições: first-touch, last-touch, código/cupom, link, indicação manual aprovada, campanha, contrato ou regra customizada.

## 34. SPLIT ENTRE PARCEIROS
Uma venda pode remunerar mais de um participante quando autorizado, com percentuais/valores e limites claros.

## 35. VALIDAÇÃO DO SPLIT
Impedir configurações incoerentes, como percentuais que ultrapassem limites definidos pela gestão.

## 36. VIGÊNCIA
Toda regra possui `valid_from` e opcional `valid_until`. Alterar regra futura não reescreve histórico passado.

## 37. VERSIONAMENTO
Cada alteração cria nova versão de regra; recebíveis mantêm referência à versão usada no cálculo.

## 38. OVERRIDE
Permitir exceção por parceiro/cliente/contrato somente a usuário autorizado, exigindo motivo e auditoria.

## 39. SIMULADOR
Antes de salvar regra, mostrar exemplos: venda de R$ X, setup Y, mensalidade Z, Pix/cartão, comissão prevista e datas.

## 40. WIZARD DE CONFIGURAÇÃO
Fluxo simples: **tipo/grupo → escopo → base de incidência → fixo/% → pontual/recorrente → vigência → D7/D37 → regras de reversão → simulação → confirmação**.

## 41. DASHBOARD MASTER
Cards: parceiros ativos, MRR atribuído, comissão prevista, em processamento, liberada, paga, bloqueada, reversões, próximos repasses e concentração por parceiro.

## 42. PAINEL DO PARCEIRO
Saldo previsto, em processamento, liberado, pago, bloqueado, receita recorrente projetada, clientes ativos, inadimplentes e churn atribuído.

## 43. TABELA DETALHADA
Cliente | Contrato | Competência | Item | Base elegível | Regra | Comissão | Método | Pagamento | Liberação | Relógio | Status.

## 44. RELÓGIO REGRESSIVO
Cada recebível elegível deve mostrar countdown individual até a data prevista de liberação/pagamento.

## 45. TRANSPARÊNCIA
O parceiro deve entender de onde saiu cada centavo sem acesso a informações do cliente além do necessário e permitido.

## 46. PROJEÇÕES
Projetar próximos meses com base em contratos ativos e calendário, sempre rotulando claramente como **projeção**, nunca saldo adquirido.

## 47. MÉTRICAS DO PARCEIRO
Receita originada, MRR atribuído, ARR atribuído, comissão acumulada, ticket médio, clientes ativos, inadimplência, churn, LTV atribuído quando calculável e previsão futura.

## 48. MÉTRICAS POR GRUPO
Comparar grupos, canais e campanhas sem transformar correlação em causalidade indevida.

## 49. MÉTRICAS DA IMPULSIONANDO
Receita bruta, receita líquida após participações, custo de aquisição via parceiro, margem por canal, payback e concentração de receita.

## 50. HISTÓRICO
Linha do tempo completa desde atribuição até último repasse/reversão.

## 51. EXTRATO DO PARCEIRO
Exportável por período, competência, cliente mascarado quando necessário, regra, status e pagamento.

## 52. RELATÓRIOS
CSV/XLSX/PDF quando suportado pelo módulo de relatórios, com filtros, data/hora, origem e auditoria.

## 53. COMPROVANTE DE REPASSE
Associar comprovante/ID do provider, data, valor e lote.

## 54. LOTE DE PAGAMENTO
Permitir consolidar vários recebíveis em um payout sem perder granularidade do ledger.

## 55. APROVAÇÃO DE LOTE
Workflow parametrizável por valor/risco; evitar pagamento crítico sem permissão adequada.

## 56. DADOS BANCÁRIOS
Protegidos por RBAC/RLS, mascaramento e auditoria. Nunca expor no frontend além do necessário.

## 57. FISCAL DO PARCEIRO
Permitir checklist de documentos/NF quando juridicamente/fiscalmente necessário, parametrizado e validado pela contabilidade.

## 58. BLOQUEIO FISCAL
Quando política exigir documento fiscal antes do repasse, status deve indicar exatamente a pendência, sem apagar o valor devido.

## 59. CONTRATO DO PARCEIRO
Contrato versionado com regras de comissão, vigência, reversão, responsabilidades e aceite/assinatura.

## 60. CUPONS/CÓDIGOS
Afiliados podem possuir códigos/links rastreáveis quando aplicável, sem depender exclusivamente deles para atribuição.

## 61. UTM
Registrar origem/campanha/UTM e relacionar ao parceiro quando a regra de atribuição permitir.

## 62. INDICAÇÃO MANUAL
Gestão pode atribuir lead/cliente a indicador, exigindo justificativa e trilha de auditoria.

## 63. CONFLITO DE ATRIBUIÇÃO
Criar fila de disputa/validação em casos de dois parceiros reivindicando a mesma venda.

## 64. PRECEDÊNCIA
Regras de precedência devem ser configuráveis e visíveis, nunca escondidas no código.

## 65. CLIENTE 360º
No CRM do cliente mostrar parceiro originador, grupo, regra, histórico e custo de canal conforme permissão.

## 66. PARCEIRO 360º
No cadastro do parceiro mostrar clientes, contratos, receitas, comissões, pagamentos, documentos, tickets e histórico.

## 67. BILLING INTEGRADO
Motor de parceiros deve consumir eventos reais do billing, não duplicar a verdade financeira.

## 68. EVENTOS
Padronizar: `partner.created`, `partner.activated`, `attribution.created`, `invoice.item.created`, `payment.confirmed`, `commission.eligible`, `commission.blocked`, `commission.payable`, `payout.scheduled`, `payout.completed`, `commission.reversed`.

## 69. N8N
Jornadas event-driven e idempotentes para avisos, cobrança de documentos, liberação próxima, payout concluído, inadimplência e regularização.

## 70. AVISO DE VENDA
Parceiro pode ser avisado de nova venda atribuída, distinguindo “venda registrada” de “comissão adquirida”.

## 71. AVISO DE PAGAMENTO
Quando pagamento elegível for confirmado, informar base, regra, comissão e previsão D7/D37.

## 72. AVISO DE INADIMPLÊNCIA
Informar que a comissão está bloqueada aguardando regularização, sem expor informação excessiva.

## 73. AVISO DE LIBERAÇÃO
Notificar quando valor se tornar `PAYABLE`.

## 74. AVISO DE REPASSE
Notificar valor, lote, data e extrato/comprovante.

## 75. COBRANÇA DO CLIENTE
Integrar com a régua global de billing: lembrete pré-vencimento, vencimento, inadimplência, suspensão e reativação.

## 76. HORÁRIOS
Todos os horários de cobrança/aviso devem ser parametrizáveis. A política pode inicialmente usar véspera e dia do vencimento às 06:00, mas não hard-code.

## 77. PRÉ-PAGAMENTO
Mensalidade é pré-paga conforme política comercial vigente; checkout deve explicar competência de forma explícita.

## 78. UX DO CHECKOUT
Antes de pagar, cliente vê período, pro rata, próxima competência, setup, add-ons, total e próximo vencimento.

## 79. UX DO DASHBOARD
Evitar linguagem contábil obscura. Usar labels claros com tooltip para competência, base elegível, D7/D37, bloqueio e projeção.

## 80. FILTROS
Parceiro, grupo, cliente, plano, produto, período, competência, método, status, regra e campanha.

## 81. BUSCA
Busca por parceiro, cliente, contrato, cobrança, payout e ID transacional.

## 82. PERMISSÕES
Perfis: master, financeiro, comercial, gestor de parceiros, auditor/contador, parceiro. Cada um com least privilege.

## 83. RLS
Parceiro acessa exclusivamente seus próprios vínculos/recebíveis permitidos. Zero cross-tenant/cross-partner leakage.

## 84. AUDITORIA
Registrar criação/alteração de regra, atribuição, override, bloqueio, aprovação, payout, reversão, exportação e alteração de dados bancários.

## 85. SEGURANÇA
MFA para perfis críticos, Vault para secrets, proteção de webhooks, idempotência, rate limiting, logs e backups.

## 86. WEBHOOKS
Pagamento/reembolso/chargeback devem validar origem/assinatura, schema, replay e idempotência.

## 87. CONCILIAÇÃO
Repasse só pode ser marcado pago com evidência real do provider/conciliação ou ação manual autorizada e auditada.

## 88. CONTABILIDADE
Separar contabilmente receita da Impulsionando, obrigação com parceiros, ajustes e pagamentos; validar desenho final com contador.

## 89. COMPETÊNCIA
Toda comissão deve carregar competência e data do fato financeiro, evitando confusão entre caixa e competência.

## 90. TIMEZONE
Usar timezone configurado da operação e regras consistentes para D7/D37.

## 91. DIAS CORRIDOS/ÚTEIS
Definir explicitamente se D7/D37 significam dias corridos ou úteis conforme política vigente; não inferir silenciosamente.

## 92. FERIADOS
Se política usar dias úteis, calendário deve ser parametrizado e auditável.

## 93. ARREDONDAMENTO
Regra monetária única, com precisão decimal e arredondamento determinístico.

## 94. MOEDA
Preparar modelo para moeda por contrato, embora operação atual possa ser BRL.

## 95. AJUSTES MANUAIS
Somente usuários autorizados, com motivo obrigatório, referência e dupla aprovação acima de limite configurável.

## 96. NEGATIVO/CARRY FORWARD
Definir política para reversões superiores ao saldo atual sem apagar dívida/ajuste.

## 97. ENCERRAMENTO DO PARCEIRO
Bloquear novas atribuições, preservar histórico e liquidar obrigações conforme contrato.

## 98. REATIVAÇÃO DO PARCEIRO
Nova vigência/regra sem reescrever período anterior.

## 99. ALERTAS DE ANOMALIA
Comissão anormalmente alta, duplicidade, percentual inesperado, payout repetido, base negativa, divergência de conciliação.

## 100. BI DE FRAUDE/QUALIDADE
Monitorar padrões anormais de atribuição, cancelamento, chargeback e overrides.

## 101. API INTERNA
Serviços claros para cálculo, simulação, elegibilidade, ledger, payout e consulta; não espalhar fórmula pelo frontend.

## 102. MOTOR DE REGRAS
Regras declarativas/versionadas, evitando condicionais específicas por parceiro no código.

## 103. PRECEDÊNCIA DO MOTOR
Resolver escopo específico antes de default de grupo/global conforme política explícita.

## 104. EXPLAINABILITY
Para qualquer comissão, endpoint/UI deve responder “por que esse valor?”.

## 105. REPROCESSAMENTO
Permitir recalcular em sandbox/simulação; em produção, correções devem gerar eventos compensatórios, não apagar histórico.

## 106. MIGRAÇÃO DO HISTÓRICO
Importar registros anteriores com origem marcada (`LEGACY_IMPORT`) e reconciliação.

## 107. RECONCILIAÇÃO DE MIGRAÇÃO
Totais por parceiro/período devem bater com fonte anterior ou divergência ficar explicitamente aberta.

## 108. NÃO DUPLICAR CADASTRO
Parceiro deve reutilizar cadastro único de pessoa/empresa quando arquitetura Core permitir.

## 109. PORTAL DO PARCEIRO
Login próprio, responsivo, seguro e simples, sem acesso ao dashboard master.

## 110. ONBOARDING DO PARCEIRO
Convite → cadastro → documentos → contrato → dados de pagamento → validação → ativação.

## 111. IMPULSIONITO
Impulsionito deve poder explicar regras e pendências a usuários autorizados com base no ledger real, sem inventar saldos.

## 112. GESTÃO POR EXCEÇÃO
Impulsionito alerta sobre regra incompleta, payout travado, documento ausente, conflito de atribuição, conciliação divergente e anomalia.

## 113. TESTE — SETUP INELEGÍVEL
Venda com setup + mensalidade: comissão não incide sobre setup quando regra assim determinar.

## 114. TESTE — SETUP ELEGÍVEL
Quando gestão criar regra excepcional de setup elegível, cálculo deve seguir exatamente a versão autorizada.

## 115. TESTE — PRIMEIRA MENSALIDADE
Pro rata pequeno + primeira competência integral: regra “primeira mensalidade” incide apenas sobre a competência integral por default.

## 116. TESTE — RECORRENTE
Cliente paga três competências: três comissões; quarta inadimplente: nenhuma liberação da quarta.

## 117. TESTE — PIX
Pagamento confirmado → comissão elegível → D7 → payable → payout.

## 118. TESTE — CARTÃO
Pagamento confirmado → comissão elegível → D37 → payable → payout.

## 119. TESTE — INADIMPLÊNCIA
Cobrança vencida → comissão bloqueada → parceiro informado → regularização → fluxo retomado.

## 120. TESTE — CHARGEBACK
Payout ainda não realizado: bloquear/reverter. Já realizado: aplicar política de ajuste futuro e auditoria.

## 121. TESTE — COBRANÇA CONSOLIDADA
Setup + pro rata + mês integral em um pagamento; cada item mantém base própria e comissão correta.

## 122. TESTE — SPLIT
Dois parceiros elegíveis; soma e limites validados; ledger individual.

## 123. TESTE — ALTERAÇÃO DE REGRA
Nova regra vale apenas da vigência em diante.

## 124. TESTE — DUPLICIDADE
Webhook repetido não duplica comissão nem payout.

## 125. TESTE — PERMISSÃO
Parceiro A tenta acessar Parceiro B → NEGADO + auditado.

## 126. TESTE — EXPLICAÇÃO
Selecionar qualquer comissão e reconstruir matematicamente sua origem.

## 127. TESTE — PROJEÇÃO
Projeção futura muda com churn/inadimplência sem alterar saldo adquirido.

## 128. TESTE — PRORRATA UX
Cliente próximo ao vencimento entende claramente pagar somente proporcional ou consolidar proporcional + próxima mensalidade conforme política.

## 129. CRITÉRIO DE ACEITE FINANCEIRO
Soma do ledger de parceiros deve reconciliar com obrigações e payouts do financeiro.

## 130. CRITÉRIO DE ACEITE UX
Gestor não precisa programar regra: deve configurar por wizard em poucos passos e visualizar simulação antes de ativar.

## 131. CRITÉRIO DE ACEITE PARCEIRO
Parceiro consegue responder sozinho: quanto vendeu, quanto tem previsto, quanto está bloqueado, quanto está liberado, quando receberá e por quê.

## 132. CRITÉRIO DE ACEITE GESTÃO
Gestão consegue ativar/desativar parceiro, criar grupo, definir fixo/% e incidência, alterar vigência, visualizar impacto e auditar histórico sem planilha paralela.

## 133. CRITÉRIO DE ACEITE TÉCNICO
Nenhuma fórmula crítica no frontend; cálculo centralizado, testável, versionado, idempotente e auditável.

## 134. CRITÉRIO DE ACEITE DE SEGURANÇA
RLS/RBAC, tenant isolation, logs, proteção de dados financeiros e webhooks validados.

## 135. REGRA FINAL AO PROGRAMADOR
Se uma comissão não puder ser reconstruída matematicamente, está errado. Se setup/pro rata/mensalidade forem misturados, está errado. Se inadimplência liberar comissão, está errado. Se alteração de regra reescrever histórico, está errado. Se parceiro precisar perguntar ao financeiro quando receberá, está incompleto. Se gestão precisar editar código para criar uma regra comercial, está incompleto. Se o dashboard não distinguir previsão, bloqueio, disponibilidade e pagamento, está incompleto. Se D7/D37 não estiverem vinculados ao pagamento real e à política versionada, está errado.

## 136. RESULTADO FINAL
O módulo deve funcionar como uma verdadeira plataforma de revenue sharing do Ecossistema Impulsionando: **VENDA → ATRIBUIÇÃO → COBRANÇA → PAGAMENTO → ELEGIBILIDADE → COMISSÃO → HOLD D7/D37 → REPASSE → EXTRATO → BI**, totalmente integrado a CRM, ERP/RP, billing, N8N, financeiro, contabilidade, contratos, auditoria e Impulsionito.

**STATUS:** PRODUCT INTAKE PARA EXECUÇÃO FUTURA PELO CAUÃ.  
**NÃO EXECUTAR AUTOMATICAMENTE.**