# SUPERPROMPT MESTRE FINAL — PRODUCT INTAKE COLORS SAÚDE

## REVISÃO TOTAL DE NEGÓCIO, ERP, CRM, BI, LOGÍSTICA, COMUNICAÇÃO, IA E CORE IMPULSIONANDO

**MODO DE EXECUÇÃO DESTE PROMPT: EXCLUSIVAMENTE PRODUCT INTAKE**

Este prompt deve ser processado pelo mecanismo de ingestão de informação de produto dentro da pasta/folder `product-intake`, seguindo rigorosamente o padrão documental existente.

**NÃO ALTERAR CÓDIGO.  
NÃO ALTERAR BANCO DE DADOS.  
NÃO EXECUTAR MIGRATIONS.  
NÃO FAZER DEPLOY.  
NÃO PUBLICAR FRONT.  
NÃO ALTERAR BACK-END.  
NÃO ALTERAR INFRAESTRUTURA.  
NÃO DISPARAR COMUNICAÇÕES REAIS.  
NÃO EMITIR NOTA FISCAL REAL.  
NÃO MOVIMENTAR ESTOQUE REAL.  
NÃO CRIAR PEDIDOS REAIS.**

Todas as instruções abaixo significam:

**registrar o comportamento desejado no Product Intake para análise e implementação posterior pelo programador responsável.**

---

## PRINCÍPIO Nº 1 — PENSAR COMO UMA EMPRESA REAL

Não documentar telas isoladas.

Não documentar apenas botões.

Não pensar apenas em front-end.

Não tratar ERP, CRM, estoque, logística, fiscal, comunicação ou IA como módulos independentes.

Para cada requisito, imaginar uma **operação comercial real acontecendo de ponta a ponta**.

Sempre perguntar:

**o que entrou?  
quem originou?  
quem é o cliente?  
que produto foi vendido?  
quantos potes físicos isso representa?  
de onde saiu o estoque?  
foi reservado?  
foi aprovado?  
foi pago?  
quem recebe comissão?  
quando recebe?  
precisa emitir nota?  
quando emite?  
quem separa?  
qual prazo para despacho?  
quando surge o rastreio?  
quem precisa ser avisado?  
qual informação entra no BI?  
que alerta administrativo pode nascer desse evento?  
o que a Íris precisa saber para responder ao cliente?**

Nenhuma jornada estará completa enquanto todas essas perguntas não tiverem resposta.

---

# 1. ARQUITETURA CENTRAL — CORE IMPULSIONANDO

A Colors não deverá possuir um conjunto de soluções desconectadas.

Ela deverá consumir módulos do **Core Impulsionando**, parametrizados para sua operação.

O padrão administrativo Impulsionando deverá ser modular e reutilizável para os clientes compatíveis com cada plano.

O Core deve contemplar, conforme permissões/plano:

**Dashboard; ERP; CRM; Comunicação; Financeiro; Fiscal; Estoque; Produtos; Clientes; Pedidos; Logística; Relatórios/BI; Automação; IA/agente virtual; Agendamento; Teleatendimento; Usuários; Permissões; Configurações; Auditoria.**

Regra arquitetural: uma melhoria verdadeiramente genérica criada para o Core deverá poder beneficiar os demais clientes que possuam aquele módulo/plano, evitando forks desnecessários.

Características particulares da Colors deverão ficar em **configuração, regra de negócio, identidade, permissões, parâmetros e integrações específicas**, e não em duplicação desnecessária do Core.

# 2. NOMENCLATURA UNIVERSAL — TELEATENDIMENTO

No Core Impulsionando, utilizar **TELEATENDIMENTO**, e não “teleconsulta” como nome universal do recurso.

O recurso pode atender medicina, consultoria, suporte, jurídico, orientação profissional, atendimento comercial ou qualquer outro segmento. “Teleconsulta” poderá existir apenas como label vertical/contextual quando um cliente de saúde desejar. O recurso estrutural no Core será **Teleatendimento**.

A Colors deverá possuir acesso ao módulo quando seu plano contemplar o recurso, mesmo que inicialmente não o utilize.

# 3. OPERAÇÃO REAL ATUAL DA COLORS

Documentar a realidade atual aproximada:

**90% → vendas online por afiliados.**  
**10% → vendas físicas/B2B através de representantes.**

Checkout predominante atual do canal afiliado: **Maisfy**.

Representantes físicos atuais: **1 — Wellington, exclusivo no Estado de São Paulo.**

Esses percentuais não deverão ser hard-coded. O BI deverá calcular continuamente o mix real.

# 4. SIMULAÇÃO OBRIGATÓRIA DE VENDA

Para validar o Product Intake, documentar e testar conceitualmente pelo menos quatro cenários:

**Cenário A — venda online via afiliado**  
Cliente compra Super Green Black através de afiliado e checkout Maisfy. Mapear: origem → afiliado → checkout → pagamento → cliente → pedido → SKU → quantidade comercial → número físico de potes → estoque → comissão afiliado → fiscal → separação → despacho → rastreio → cliente → CRM → BI → pós-venda.

**Cenário B — venda física originada pelo Wellington**  
Wellington seleciona/cadastra empresa paulista → cria pedido → quantidade → disponibilidade de estoque → preço → pagamento → aprovação Colors → reserva/baixa → NF → separação → despacho → rastreio → comissão Wellington → BI.

**Cenário C — venda B2B direta pela Colors para empresa em São Paulo**  
Colors cria pedido manualmente → endereço/CEP identifica território SP → regra “comissão territorial automática” = SIM → Wellington recebe comissão mesmo sem ter digitado o pedido → pedido segue aprovação/faturamento/logística.

**Cenário D — venda B2B paulista quando parâmetro territorial = NÃO**  
Mesmo cliente e mesmo CEP. Regra administrativa alterada para NÃO. Pedido continua normalmente, mas nenhuma comissão territorial nova é constituída.

Cada cenário deve ser documentado passo a passo.

# 5. PEDIDO COMO OBJETO CENTRAL

Todo pedido deverá possuir identidade inequívoca. Registrar conceitualmente: número do pedido; cliente; CPF/CNPJ; tipo PF/PJ; canal; origem; afiliado; representante originador; representante territorial; vendedor/operador; data/hora; produtos; SKUs; quantidade comercial; quantidade física de potes; preços; descontos; frete; endereço; CEP; território; pagamento; fiscal; status; estoque; logística; rastreamento; comissão; histórico de eventos.

# 6. PRODUTO ≠ OFERTA ≠ QUANTIDADE FÍSICA

Separar **produto físico, SKU e kit/oferta comercial**.

Exemplo: oferta “3 potes” pode ser um item comercial, mas deverá baixar **3 unidades físicas reais**. Toda venda precisa produzir a quantidade consolidada de potes. O ERP e o BI deverão saber pedidos vendidos, ofertas vendidas e potes físicos vendidos.

# 7. ESTOQUE — ESTADOS MÍNIMOS

Por produto/local: **estoque físico/on hand; reservado; disponível; comprometido; mínimo; em reposição; sem estoque.**

Fórmula conceitual: **Disponível = físico − reservas válidas.**

Nunca vender olhando apenas “quantidade física”.

# 8. RESERVA DE ESTOQUE

Definir no Intake em que momento ocorre reserva. Para pedido B2B aguardando aprovação, avaliar reserva temporária para impedir dupla utilização da mesma mercadoria. Se pedido for rejeitado, expirado, cancelado ou não pago, a reserva deverá ser liberada conforme regra configurada.

# 9. ESTOQUE MÍNIMO PARAMETRIZÁVEL

Cada produto deverá possuir limite próprio configurável. Exemplo inicial: **Super Green Black → 50 potes.** Não hard-code. Gestão Colors pode mudar para 40, 75, 100 etc.

# 10. SEMÁFORO DE ESTOQUE

O dashboard deverá deixar a situação inequívoca. Conceitualmente:

**VERDE:** estoque saudável.  
**AMARELO:** atenção.  
**LARANJA:** risco elevado.  
**VERMELHO:** estoque crítico/ruptura iminente.

A classificação deverá ser baseada em parâmetros e cobertura, considerando disponível, mínimo, velocidade de venda, pedidos reservados e lead time de reposição.

# 11. ALERTA DE ESTOQUE BAIXO

Ao atingir o limite configurado, criar requisito de alerta administrativo. Destinatário atual: **sac@colorsaude.com.br**.

A comunicação deverá trazer produto, SKU, disponível, reservado, mínimo, média de saída, previsão de duração e recomendação de reposição.

# 12. PREVISÃO DE RUPTURA

Não esperar obrigatoriamente chegar a 50. Se houver 120 potes disponíveis, mas vendas atuais equivalem a 60/dia, o ERP deve ser capaz de indicar **“aproximadamente 2 dias de cobertura”**. O objetivo é antecipar risco.

# 13. DASHBOARD INICIAL COLORS

Ao entrar no administrativo Colors, a gestão precisa compreender a saúde da empresa em segundos.

Primeira dobra: **Faturamento do mês; Pedidos do mês; Potes vendidos; Meta mensal; Ticket médio; Canal online; Canal físico/B2B; Estoque crítico; Pedidos aguardando aprovação; Pedidos aguardando despacho; Comissões a vencer.**

# 14. RELATÓRIOS — VISÃO DE CARA

Dentro de **Relatórios**, apresentar imediatamente: total de vendas; faturamento; total de pedidos; total de potes; ticket médio; valor médio por pote; vendas afiliados; vendas representantes; vendas B2B diretas; comissões; estoque; metas.

# 15. COMPARAÇÕES

Sempre que adequado: hoje × ontem; semana atual × anterior; semana atual × mesma semana ano anterior; mês atual × mês anterior; mês atual × mesmo mês ano anterior; acumulado ano × acumulado equivalente ano anterior; produto × produto; canal × canal; representante × representante; afiliado × afiliado.

# 16. PERÍODOS EQUIVALENTES

Comparações precisam ser matematicamente honestas. Dia 15 do mês: comparar dias 1–15 atual com dias 1–15 anterior. Não comparar mês incompleto contra mês completo como se fossem equivalentes.

# 17. META COMERCIAL

Criar no Intake um motor de metas configurável. Configuração inicial da Colors: **meta de crescimento mensal = +5%.**

Objetivo do mês atual = vendas de referência × 1,05. O percentual deverá ser alterável no dashboard sem código.

# 18. BASE DA META

Default inicial: **crescer 5% em relação ao mês imediatamente anterior.** Futuramente permitir mesmo mês ano anterior; orçamento definido; meta absoluta; meta por produto; meta por canal; meta por representante.

# 19. TERMÔMETRO DA META

Exibir claramente meta prevista, realizado, falta, percentual alcançado e projeção até fim do período.

# 20. CALOR DA SITUAÇÃO

Referência solicitada:

**0–25% → situação inicial/crítica**  
**26–50% → evolução insuficiente**  
**51–75% → aproximação**  
**76–100% → proximidade/atingimento**

Padrão visual: **vermelho → laranja → amarelo → verde**. Para mais de 100%: **META SUPERADA**.

O desenho deverá considerar também o **tempo transcorrido no mês**. Além da faixa absoluta, criar conceito de **ritmo esperado × ritmo realizado**.

# 21. PROJEÇÃO INTELIGENTE

O BI deverá estimar fechamento e indicar projeção acima ou abaixo da meta.

# 22. VENDA AFILIADO — FLUXO COMPLETO

Checkout Maisfy conclui venda. Registrar/sincronizar origem; afiliado; cliente; CPF; contato; produto; oferta; quantidade física; valor; pagamento; comissão; endereço; estoque; logística. Criar pedido central no ERP quando tecnicamente viável. O CRM deverá conhecer o mesmo cliente.

# 23. ATRIBUIÇÃO DE AFILIADO

Preservar a origem original. Nunca perder associação após importação. Registrar external_sale_id; afiliado; plataforma; comissão; status; timestamps.

# 24. WELLINGTON — REPRESENTANTE TERRITORIAL

Estado: **SP**. Exclusividade atual: **SIM**. Tudo configurável.

# 25. COMISSÃO TERRITORIAL

Parâmetro: **“Venda B2B/manual no território gera comissão ao representante?”** Default Colors atual: **SIM**. Se cliente elegível estiver em SP: atribuir Wellington. A gestão poderá mudar para NÃO.

# 26. PROTEGER CONTRA DUPLA COMISSÃO

Uma venda online de afiliado cujo comprador seja de São Paulo não deve, por mera coincidência geográfica, necessariamente gerar duas comissões. Criar parâmetro separado: **“Venda online afiliada dentro de território gera comissão territorial adicional?”** Configurável. Nunca inferir.

# 27. COMISSÕES E PRAZOS

Regra inicial: **Pix = D+7. Cartão = D+37.** Configurável. Definir tecnicamente o evento zero da contagem, preferencialmente confirmação/compensação financeira.

# 28. RELÓGIO

Colors vê contagem regressiva para pagar comissão. Representante vê contagem regressiva até liberação. Vencido: **PAGAMENTO DEVIDO**. Pago: registrar data, valor e comprovante.

# 29. PEDIDO B2B

Representante busca cliente; não encontra → cadastra; encontra → seleciona; escolhe produto; informa quantidade; confirma dados; escolhe pagamento; envia pedido. Status: **AGUARDANDO APROVAÇÃO COLORS.**

# 30. COMITÊ COLORS

Antes de aprovar, verificar quantidade, preço, condição, estoque disponível, impacto na reserva, cliente, pagamento e comissão. Aprovação deve possuir usuário/data/hora.

# 31. FISCAL — CONFIGURAÇÃO

Parâmetro **NF automática venda física/B2B** — default **SIM**.  
Parâmetro **NF automática venda online** — default **NÃO**.  
Ambos configuráveis.

# 32. GATILHO DA NF B2B

Não emitir simplesmente no “Finalizar” do representante. Fluxo: pedido submetido → aprovação Colors → critérios financeiros/fiscais satisfeitos → emissão.

# 33. DOCUMENTO FISCAL

Vincular ao pedido status; número; série; chave; XML; DANFE/PDF; data; cancelamento; histórico.

# 34. ACESSO À NF

Após emissão: gestão Colors acessa; representante autorizado acessa; cliente acessa. Comunicar automaticamente quando disponível.

# 35. LOGÍSTICA — SLA DE DESPACHO

Configurar prazo operacional da Colors: **até 4 dias para despacho**, conforme regra do negócio. Esse prazo deverá existir como parâmetro, não apenas dentro do texto da Íris. O agente deve consultar a regra vigente.

# 36. LINHA DO TEMPO DO PEDIDO

Pedido recebido; pagamento confirmado; aprovado; separação; faturado; NF disponível; aguardando despacho; despachado; código de rastreio; em trânsito; saiu para entrega; entregue. Cada transição deve gerar timestamp.

# 37. RASTREAMENTO

Ao receber código, associar ao pedido: transportadora; URL; status; última atualização; previsão quando disponível.

# 38. COMUNICAÇÃO DE RASTREIO

Quando código for disponibilizado, avisar cliente pelos canais autorizados e disponibilizar também na área do cliente.

# 39. ÍRIS — CÉREBRO VIVO DA COLORS

A Íris não deve funcionar como FAQ. Ela deverá ser concebida como **agente operacional contextual da empresa**. Deve compreender cliente; produtos; pedidos; pagamento; prazo; logística; rastreamento; afiliados; representantes; regras; jornadas; atendimento; políticas.

# 40. ÍRIS NÃO DEVE INVENTAR STATUS

Antes de informar situação de pedido: identificar cliente; autenticar/validar de forma proporcional ao dado consultado; consultar pedido; ler eventos reais; responder. Nunca afirmar status não suportado pelos sistemas.

# 41. CASO REAL — CLIENTE NO SEGUNDO DIA

Pergunta: **“Comprei há dois dias e ainda não recebi o código de rastreio.”**

A Íris deverá conduzir de forma natural. Poderá solicitar, conforme necessário, nome, número do pedido, CPF ou outro fator de validação. Após localizar e validar, consulta data da compra, status e prazo atual de despacho.

Se compra = 2 dias; SLA = 4 dias; ainda não despachado; não existe problema logístico, resposta conceitual:

**“Encontrei seu pedido. Ele foi realizado há dois dias e continua dentro do prazo normal de despacho, que é de até quatro dias. Assim que o envio for realizado, você receberá automaticamente o código de rastreamento. Está tudo dentro do prazo neste momento.”**

Sem prometer data que não existe.

# 42. QUANDO O PRAZO FOR ULTRAPASSADO

Se dia 5 e SLA = 4, Íris não deve repetir “aguarde”. Deve reconhecer exceção e criar evento/alerta/escalonamento apropriado.

# 43. IDENTIDADE E FORMA DE TRATAMENTO

A Íris deverá guardar, conforme consentimento/contexto, nome, nome preferido e forma de tratamento. Não inferir gênero somente pelo nome. Se for necessário personalizar tratamento, perguntar de maneira natural como a pessoa prefere ser chamada/tratada.

# 44. MEMÓRIA CONTEXTUAL

Dentro das permissões e políticas adequadas, a Íris deve evitar perguntar repetidamente aquilo que a plataforma já sabe e está autorizada a usar. Princípio: **mínimo atrito + máxima segurança.**

# 45. ÍRIS + CRM

Toda conversa relevante deverá poder alimentar CRM: intenção; problema; pedido relacionado; status; satisfação; oportunidade; necessidade de humano; resultado.

# 46. ÍRIS + OPENAI

Utilizar o agente dentro de arquitetura controlada: contexto; ferramentas; permissões; logs; guardrails; observabilidade; avaliação. A inteligência deve vir do modelo, mas os fatos operacionais devem vir dos sistemas.

# 47. ÍRIS + WHATSAPP

WhatsApp integrado ao CRM. Quando conexão baseada em sessão: QR Code acessível no administrativo. Quando API oficial: status da integração e saúde da conexão. Não exibir QR fictício.

# 48. COMUNICAÇÃO PROATIVA

Eventos elegíveis: pedido recebido; pagamento confirmado; problema no pagamento; aprovação; NF; despacho; rastreio; atraso; entrega; pós-venda; recompra. Templates parametrizáveis.

# 49. NÃO ENCHER O CLIENTE DE MENSAGENS

Criar conceito de prioridade; canal; frequência; consentimento; horário; deduplicação. Três sistemas não podem disparar três mensagens iguais para o mesmo evento.

# 50. EVENTOS COMO COLUNA VERTEBRAL

O desenho futuro deve considerar eventos operacionais consistentes. Exemplos: `order.created`, `order.approved`, `payment.confirmed`, `inventory.reserved`, `invoice.issued`, `fulfillment.ready`, `shipment.dispatched`, `tracking.available`, `delivery.completed`.

Cada consumidor usa o mesmo fato. Sem criar verdades divergentes.

# 51. BI — FUNIL OPERACIONAL

Mostrar pedidos criados; aprovados; pagos; faturados; enviados; entregues; cancelados. Detectar gargalo.

# 52. LOGÍSTICA NO DASHBOARD

Cards: aguardando aprovação; aguardando pagamento; separar hoje; próximos do SLA; SLA vencido; despachados; sem código; em trânsito; entregues.

# 53. SLA VISUAL

Pedido com prazo 4 dias: **Dia 1/4; Dia 2/4; Dia 3/4 — atenção; Dia 4/4 — limite; Dia 5 — atrasado.** Visual intuitivo.

# 54. BI DE PRODUTOS

Por produto: faturamento; pedidos; potes; participação; ticket; estoque; giro; cobertura; crescimento; devolução; recompra.

# 55. BI DE AFILIADOS

Afiliados ativos; vendas; faturamento; conversão quando disponível; ticket; potes; comissão; cancelamento; ranking; crescimento.

# 56. BI DO WELLINGTON

Clientes; pedidos; faturamento; potes; ticket; comissão constituída; D+; comissão paga; crescimento; participação em SP.

# 57. BI TERRITORIAL

Brasil → UF → cidade → CEP/região. Cruzar canal; afiliado; representante; produto; faturamento; potes.

# 58. META POR MÊS

Guardar histórico. Se gestão mudar meta de 5% para 8% em março, não alterar silenciosamente janeiro e fevereiro.

# 59. AUDITORIA DE PARAMETRIZAÇÕES

Toda regra crítica — estoque mínimo; meta; comissão; território; D+; NF automática; SLA despacho — deverá guardar quem alterou; quando; valor anterior; valor novo; início de vigência.

# 60. ALERTAS ADMINISTRATIVOS

Exemplos: estoque baixo; ruptura prevista; pedido grande; atraso no despacho; NF com falha; integração offline; comissão vencida; queda de venda; meta em risco; anomalia de cancelamentos.

# 61. META EM RISCO

Não esperar o último dia. Se projeção indicar fechamento abaixo de 5%, dashboard pode mostrar **META EM RISCO** e apresentar realizado, ritmo necessário e média diária necessária.

# 62. INDICADORES PRECISAM SER CLICÁVEIS

Card **7 pedidos atrasados** → clique abre os 7 pedidos. Card **3 produtos em estoque crítico** → clique abre esses 3 produtos. Dashboard não deve ser um cartaz; deve ser operacional.

# 63. DRILL-DOWN

Total vendido → canal → produto → representante/afiliado → cliente → pedido. Sem exportar planilha apenas para descobrir a origem do número.

# 64. FILTROS PADRÃO

Período; canal; produto; SKU; representante; afiliado; UF; cidade; status; pagamento.

# 65. EXPORTAÇÃO

Relatórios operacionais poderão permitir exportação adequada. A informação principal precisa estar inteligível no dashboard.

# 66. RESPONSIVIDADE

Gestor precisa conseguir abrir no celular e compreender vendas; meta; estoque; alertas; pedidos. Sem uma tabela desktop esmagada.

# 67. HOME ADMINISTRATIVA PADRÃO IMPULSIONANDO

Criar no Core uma estrutura consistente: **Resumo; ERP; CRM; Comunicação; Agenda/Teleatendimento; Relatórios; Configurações.** Os submódulos aparecem conforme plano/permissão.

# 68. UX CONSISTENTE

Um conceito deve possuir o mesmo comportamento no ecossistema. Não reinventar a interface por cliente.

# 69. AGENTE VIRTUAL COMO CORE

O conceito de agente especializado deverá ser estrutural. Core: identidade de agente; ferramentas; memória/contexto permitido; CRM; comunicação; handoff humano; teleatendimento; observabilidade; métricas. Cliente: persona; conhecimento; regras; catálogo; linguagem; jornadas. Na Colors: **Íris.**

# 70. MONITORAMENTO DO AGENTE

Medir atendimentos; resolução; escalonamento; motivos; satisfação; vendas assistidas; recuperação; erros; respostas sem confiança; tempo.

# 71. AGENTE PRECISA SER ALIMENTADO PELO NEGÓCIO

Alteração de SLA; produto; regra; preço; comissão; política deve chegar ao contexto operacional do agente por fonte confiável. Evitar prompt manual desatualizado.

# 72. FONTE DA VERDADE

Estoque → ERP. Pedido → ERP. Cliente → cadastro/CRM. Rastreamento → logística. Pagamento → financeiro/gateway. Configuração → administração. Íris consulta. Íris não inventa.

# 73. ESTADO DE SAÚDE DO NEGÓCIO

Dashboard deverá permitir avaliação resumida de **Comercial; Financeiro; Estoque; Logística; Atendimento; Metas**. Cada dimensão pode produzir estado saudável; atenção; risco; crítico.

# 74. CORES COM SEMÂNTICA

Verde = saudável/bateu. Amarelo = atenção. Laranja = risco relevante. Vermelho = crítico/abaixo do esperado. Sempre combinar cor com texto, ícone e número. A acessibilidade não pode depender exclusivamente da cor.

# 75. CRITÉRIO DE ACEITE DA VENDA SIMULADA

Ao final da futura implementação, uma venda de teste deverá permitir responder sem ambiguidades: quem comprou? quem vendeu? quem originou? qual canal? quantos potes? quanto custou? foi pago? qual comissão? qual prazo? qual estoque antes? qual estoque depois? houve reserva? precisa NF? NF foi emitida? está separado? está dentro do SLA? foi despachado? qual rastreio? cliente foi avisado? entrou no CRM? entrou no BI? afetou a meta? gerou algum alerta?

Se qualquer resposta exigir olhar manualmente em três sistemas diferentes, considerar a jornada incompleta.

# 76. CRITÉRIO DE ACEITE DA ÍRIS

Testar perguntas reais: “Cadê meu pedido?”, “Qual meu rastreio?”, “Comprei há dois dias.”, “Já passou o prazo.”, “Meu pagamento foi aprovado?”, “Posso alterar endereço?”, “Quando chega?”. A Íris deverá entender, identificar, consultar, explicar, agir quando autorizada e escalar quando necessário.

# 77. CRITÉRIO DE ACEITE DO DASHBOARD

Um gestor, ao abrir o dashboard, deve conseguir responder em menos de um minuto: quanto vendemos? quantos potes? estamos melhores que mês passado? estamos melhores que ano passado? batemos a meta? vamos bater a meta? qual canal vende mais? temos produto acabando? há pedido atrasado? quanto temos de comissão a pagar?

# 78. CRITÉRIO DE ACEITE DO CORE

Antes de implementar algo exclusivamente na Colors, perguntar: **isso é uma capacidade universal?** Se SIM, desenvolver posteriormente no Core e parametrizar para a Colors.

Exemplos claramente universais: metas; dashboards; filtros; alertas; estoque; ERP; CRM; teleatendimento; comunicação; auditoria; permissões; agentes; eventos.

# 79. PARTICULARIDADES COLORS

Permanecem específicas/configuráveis: Íris; Super Green Black; Maisfy; afiliados; Wellington; regra SP; comissão Colors; SLA Colors; estoque mínimo Colors; templates Colors; identidade visual.

# 80. OBSERVABILIDADE

Toda integração crítica deverá futuramente possuir status; última execução; sucesso/falha; retry; erro visível para gestão técnica apropriada. Uma integração quebrada não pode ficar dias silenciosamente desligada.

# 81. IDEMPOTÊNCIA

Webhook repetido não pode duplicar pedido, duplicar comissão, baixar estoque duas vezes ou emitir duas notas. Registrar requisito explícito.

# 82. REVERSÕES

Cancelamento deverá repercutir corretamente em pedido; estoque; pagamento; comissão; fiscal; logística; BI. Sem apagar histórico.

# 83. HISTÓRICO IMUTÁVEL

Não sobrescrever silenciosamente passado. Mudanças de regra devem possuir vigência. Pedido antigo mantém regra de comissão, prazo, preço, meta contextual e configuração fiscal relevantes vigentes naquele evento.

# 84. CLIENTE ÚNICO

Deduplicar cuidadosamente. CPF/CNPJ, e-mail, celular e outros sinais ajudam, respeitando regras de dados. Uma pessoa não deve virar 15 clientes porque comprou por canais diferentes.

# 85. ERP + CRM NÃO SÃO DUPLICATAS

ERP = operação/transação. CRM = relacionamento/contexto. Ambos compartilham identificadores e eventos. Não duplicar verdades conflitantes.

# 86. SEGURANÇA E PERMISSÕES

Representante não pode acessar carteira nacional. Afiliado não pode ver dados de outro afiliado. Cliente só acessa seus pedidos/documentos. Fiscal acessa fiscal. Logística acessa o necessário para logística. Colors Master tem visão adequada. Impulsionando Master segue governança central.

# 87. LGPD / MINIMIZAÇÃO

A Íris e demais usuários devem acessar apenas os dados necessários para a tarefa. CPF não deve aparecer integralmente onde não precisa. Dados sensíveis operacionais exigem controles adequados.

# 88. PRODUCT INTAKE — FORMATO

Para cada item registrar, conforme modelo existente: problema; contexto; estado desejado; atores; evento de entrada; fluxo; dados; regra; configuração; integrações; saída; alertas; comunicação; exceções; permissões; auditoria; dependências; critérios de aceite; prioridade; status.

# 89. NÃO ASSUMIR IMPLEMENTAÇÃO

Caso encontre funcionalidade semelhante já existente, registrar: **VALIDAR IMPLEMENTAÇÃO ATUAL CONTRA O PRODUCT INTAKE.** Não assumir concluída.

# 90. RESULTADO FINAL DESTA FASE

Gerar somente documentação estruturada de Product Intake. O conjunto final deverá permitir que o programador execute posteriormente uma revisão da Colors **como empresa em funcionamento**, e não como conjunto de telas.

Nenhuma implementação deve ocorrer nesta fase.

---

# REGRA MESTRE FINAL

A partir deste Intake, a unidade mínima de análise não é **“uma feature”**. É **“um evento real do negócio e todas as consequências que ele precisa produzir.”**

Uma venda não terminou quando o checkout respondeu `paid`.

Uma venda somente estará corretamente integrada quando **cliente + pedido + produto + potes + pagamento + estoque + comissão + fiscal + logística + comunicação + CRM + BI + agente** estiverem coerentes entre si.

E o princípio universal do Ecossistema será: **melhorias reutilizáveis pertencem ao Core Impulsionando; particularidades pertencem à configuração do cliente.**

Na Colors, a Íris deverá ser o cérebro vivo da operação digital: compreender o contexto e consultar os sistemas corretos para atender, orientar e agir dentro de suas permissões — sempre usando dados reais, nunca inventando fatos operacionais.

---

## STATUS DESTA ANOTAÇÃO

- Tipo: Product Intake / caderno de requisitos.
- Destino: Cauan, programador responsável pela análise e execução posterior.
- Execução de código nesta etapa: **PROIBIDA**.
- Alteração de banco, deploy, migrations, infraestrutura ou produção: **PROIBIDA**.
- Ação permitida nesta etapa: **somente preservar/documentar este Intake**.
