# SUPERPROMPT MESTRE — PRODUCT INTAKE RIO BEER

## RIO BEER + BIERITO + IMPULSIONITO — Plano Full, inteligência de compras, gestão de portfólio, cervejas, vinhos, margem em tempo real, campanhas orientadas por dados, CRM, ERP/RP, estoque, importação histórica, fornecedores, BI, N8N, omnichannel, segurança e Go-Live

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / K1 / programador  
**TENANT:** Rio Beer  
**SUBDOMÍNIO CANÔNICO:** `riobeer.impulsionando.com.br`  
**PLANO:** Impulsionando Full  
**AGENTE CENTRAL:** Impulsionito  
**AGENTE ESPECIALIZADO:** BIERITO  
**CLIENTE REAL PRINCIPAL DA RIO BEER:** Grand Marché Itaipu  

> **NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, FRONTEND, BACKEND, N8N, CREDENCIAIS, INFRAESTRUTURA OU PRODUÇÃO A PARTIR DESTE REGISTRO.** Este documento é exclusivamente Product Intake / Livro de Anotações para execução posterior pelo programador.

---

# 1. PRINCÍPIO DE NEGÓCIO

A Rio Beer deve ser tratada como uma empresa de inteligência comercial e gestão especializada em bebidas, com foco em cervejas premium, artesanais, especiais, vinhos, portfólio, compras, margem, giro, campanhas, fornecedores e estratégia de venda.

O sistema não deve reduzi-la a uma simples loja ou distribuidora.

A arquitetura deve expressar:

**DADOS → ANÁLISE → RECOMENDAÇÃO → DECISÃO → COMPRA → ESTOQUE → CAMPANHA → VENDA → MARGEM → APRENDIZADO.**

---

# 2. ESTADO REAL E POSICIONAMENTO PÚBLICO

Referências públicas confirmam que a Rio Beer tem papel relevante na curadoria de cervejas especiais no Grand Marché Itaipu, incluindo atuação de Sérgio Marques / Serjão Rio Beer como curador cervejeiro em eventos e na seção de cervejas especiais. O festival Hora da Gelada, ligado ao Grand Marché Itaipu, é referência de varejo cervejeiro, com mais de 1.000 rótulos e forte participação da curadoria Rio Beer.

Esses fatos devem ser usados como benchmark e identidade de negócio, mas sempre auditados antes de publicação definitiva.

---

# 3. CLIENTE ÂNCORA: GRAND MARCHÉ ITAIPU

O Grand Marché Itaipu é o principal caso real inicial da Rio Beer.

A Rio Beer deve enxergar o Grand Marché como cliente dentro do seu CRM/ERP, com visão autorizada de:

- mix de bebidas;
- compras;
- giro;
- vendas;
- margem;
- ruptura;
- estoque;
- campanhas;
- performance por SKU;
- fornecedor;
- categoria;
- período;
- recomendações de compra;
- recomendações de campanha.

Não misturar tenants. O Grand Marché poderá ter tenant próprio no futuro.

---

# 4. GRAND MARCHÉ COMO PRIMEIRO TENANT DE SUPERMERCADO

Registrar como evolução futura:

Grand Marché Itaipu pode se tornar o primeiro tenant completo da vertical Supermercados da Impulsionando, com PDV, estoque, CRM, ERP, fiscal, promoções, fornecedores, validade/lotes, perdas, campanhas e BI.

Mas nesta fase o foco é Rio Beer.

---

# 5. BIERITO — CÉREBRO VIVO

Bierito é a instância especializada do Impulsionito para a Rio Beer.

Deve atuar como:

- analista de compras;
- analista de vendas;
- analista de margem;
- analista de estoque;
- analista de fornecedor;
- planejador de campanhas;
- curador de portfólio;
- assistente financeiro/comercial;
- especialista em cervejas e vinhos;
- copiloto de decisão.

---

# 6. BIERITO — PERGUNTAS QUE PRECISA RESPONDER

Exemplos:

- O que devo comprar esta semana?
- Qual cerveja está com margem baixa?
- Qual vinho está vendendo bem, mas com estoque insuficiente?
- Qual SKU está imobilizando capital?
- Qual produto deveria entrar em campanha?
- Qual campanha tem melhor histórico de retorno?
- Quanto devo comprar considerando os últimos 30/60/90/365 dias?
- Qual fornecedor está melhor em preço, prazo e margem?
- Qual SKU está com ruptura recorrente?
- Qual item perdeu giro?
- Qual categoria cresceu?
- Qual categoria está canibalizando outra?
- Qual é a previsão para o próximo período?

---

# 7. REGRA DE VERDADE DO BIERITO

Bierito nunca deve inventar:

- custo;
- margem;
- estoque;
- histórico;
- fornecedor;
- preço;
- campanha;
- volume vendido;
- previsão;
- recomendação quantitativa.

Toda recomendação deve trazer a base usada.

---

# 8. EXPLICAÇÃO DA RECOMENDAÇÃO

Quando sugerir uma ação, Bierito deve explicar o racional.

Exemplo:

`Sugiro campanha para 8 SKUs porque combinam margem média acima da meta, estoque suficiente para X dias, giro abaixo do desejado e boa resposta em campanhas anteriores.`

Não recomendar sem justificativa auditável.

---

# 9. IMPORTAÇÃO HISTÓRICA

A Rio Beer precisa importar históricos de sistemas anteriores.

Formatos:

- CSV;
- XLSX;
- integrações/API quando disponíveis.

Entidades:

- vendas;
- compras;
- estoque;
- fornecedores;
- clientes;
- preços;
- custos;
- campanhas;
- promoções;
- notas/documentos;
- produtos;
- categorias.

---

# 10. PIPELINE DE IMPORTAÇÃO

**upload → preview → mapear campos → validar → normalizar → deduplicar → rejeitar inconsistências → importar → reconciliar → relatório.**

Nunca importar silenciosamente erro de estrutura.

---

# 11. DATA QUALITY

Criar regras para:

- SKU duplicado;
- descrição divergente;
- custo impossível;
- data inválida;
- quantidade negativa sem motivo;
- margem inconsistente;
- fornecedor sem cadastro;
- produto sem categoria;
- unidade errada.

---

# 12. MASTER DATA DE PRODUTOS

Cada produto deve suportar:

- SKU;
- EAN/código de barras;
- marca;
- cervejaria/vinicola;
- categoria;
- subcategoria;
- estilo;
- país/origem;
- volume;
- embalagem;
- teor alcoólico;
- IBU quando aplicável;
- safra quando aplicável;
- custo;
- preço;
- margem;
- fornecedor;
- estoque;
- validade/lote quando aplicável;
- foto;
- descrição;
- notas de degustação;
- harmonização;
- status.

---

# 13. CATEGORIAS

Estruturar no mínimo:

- cerveja artesanal;
- cerveja especial;
- cerveja premium;
- importada;
- nacional;
- IPA;
- Lager;
- Sour;
- Stout;
- Weiss;
- Belgian;
- vinhos tintos;
- brancos;
- rosés;
- espumantes;
- outros tipos conforme catálogo real.

---

# 14. ESTOQUE

Estados:

- disponível;
- reservado;
- em trânsito;
- em recebimento;
- vendido;
- ruptura;
- excesso;
- baixa rotação;
- próximo da validade;
- bloqueado;
- avariado.

---

# 15. ESTOQUE — KPIs

- cobertura em dias;
- giro;
- ruptura;
- excesso;
- estoque parado;
- capital imobilizado;
- idade média;
- validade;
- curva ABC;
- XYZ;
- margem associada;
- sell-through.

---

# 16. CURVA ABC

Calcular por:

- receita;
- margem;
- unidades;
- contribuição.

Permitir filtros por cliente, loja, categoria, período e fornecedor.

---

# 17. CURVA XYZ

Classificar previsibilidade de demanda.

Usar para recomendar estoque de segurança.

---

# 18. RUPTURA

Alertas:

- ruptura iminente;
- ruptura atual;
- produto com histórico de ruptura;
- perda de venda estimada;
- sugestão de reposição.

---

# 19. EXCESSO DE ESTOQUE

Detectar:

- cobertura alta;
- baixo giro;
- produto sem venda X dias;
- capital imobilizado;
- validade em risco.

---

# 20. MARGEM EM TEMPO REAL

Calcular por:

- SKU;
- categoria;
- marca;
- fornecedor;
- cliente;
- campanha;
- período;
- canal.

---

# 21. MARGEM — CAMADAS

Mostrar:

- margem bruta;
- margem percentual;
- markup;
- margem após desconto;
- margem após frete;
- margem após taxas;
- margem promocional;
- margem líquida estimada quando dados disponíveis.

---

# 22. ALERTA DE EROSÃO DE MARGEM

Gatilhos:

- aumento de custo;
- desconto excessivo;
- campanha agressiva;
- fornecedor alterado;
- preço final abaixo da meta.

---

# 23. SIMULADOR DE PREÇO

Permitir simular:

- custo;
- margem alvo;
- preço sugerido;
- desconto;
- campanha;
- impacto final.

---

# 24. HISTÓRICO DE PREÇO

Guardar:

- custo por data;
- preço por data;
- fornecedor;
- promoção;
- margem resultante.

---

# 25. COMPRAS

Fluxo:

**demanda → estoque → previsão → fornecedor → cotação → comparação → pedido → aprovação → recebimento → conferência → financeiro.**

---

# 26. RECOMENDAÇÃO DE COMPRA

Considerar:

- venda histórica;
- tendência;
- sazonalidade;
- estoque atual;
- estoque em trânsito;
- lead time;
- estoque de segurança;
- campanha prevista;
- margem;
- lote mínimo;
- validade;
- orçamento disponível.

---

# 27. FORNECEDORES

Cadastro:

- empresa;
- contatos;
- produtos;
- condições;
- prazo;
- frete;
- MOQ;
- histórico de preço;
- lead time real;
- divergências;
- devoluções;
- performance.

---

# 28. SCORE DE FORNECEDOR

Indicadores:

- preço;
- pontualidade;
- qualidade;
- disponibilidade;
- margem gerada;
- prazo;
- confiabilidade;
- atendimento.

---

# 29. COTAÇÃO MULTIFORNECEDOR

Comparar em uma tela:

- produto;
- fornecedor;
- custo;
- frete;
- prazo;
- condição;
- margem projetada;
- lote mínimo.

---

# 30. FATURAMENTO

Dashboard:

- hoje;
- semana;
- mês;
- ano;
- MTD;
- YTD;
- comparação período anterior;
- comparação ano anterior;
- crescimento;
- queda.

---

# 31. FATURAMENTO POR DIMENSÃO

- cliente;
- SKU;
- categoria;
- marca;
- fornecedor;
- campanha;
- loja;
- período.

---

# 32. TICKET MÉDIO

Por:

- cliente;
- pedido;
- categoria;
- período;
- campanha.

---

# 33. SELL-IN X SELL-OUT

Quando houver dados do cliente varejista:

- sell-in Rio Beer → cliente;
- sell-out cliente → consumidor final;
- estoque intermediário;
- cobertura;
- recompra.

---

# 34. GRAND MARCHÉ — VISÃO ESPECÍFICA

Dashboard cliente:

- vendas;
- estoque;
- giro;
- margem;
- compras;
- produtos top;
- rupturas;
- excessos;
- campanhas;
- recomendação de compra;
- recomendação de mix.

---

# 35. HORA DA GELADA — EVENTO/CASE

Usar o evento Hora da Gelada como caso real de campanha e evento de alta escala, auditando dados reais.

Permitir no futuro medir:

- catálogo participante;
- preço;
- estoque pré-evento;
- vendas;
- margem;
- fornecedores;
- degustações;
- ativações;
- ROI;
- pós-evento.

---

# 36. CAMPANHAS ORIENTADAS POR DADOS

Campanha deve considerar:

- margem;
- estoque;
- giro;
- histórico;
- objetivo;
- sazonalidade;
- canal;
- público;
- verba;
- ROI.

---

# 37. NÃO FAZER CAMPANHA CEGA

Regras:

- produto com ruptura → evitar impulsionar;
- margem insuficiente → alertar;
- validade crítica → campanha especial;
- excesso + margem alta → oportunidade;
- boa resposta histórica → prioridade.

---

# 38. TIPOS DE CAMPANHA

- cerveja premium;
- vinho;
- IPA;
- importadas;
- nacionais;
- lançamentos;
- sazonais;
- datas comemorativas;
- inverno;
- verão;
- harmonização;
- festival;
- queima controlada de estoque.

---

# 39. CAMPANHA DE VINHO

Permitir segmentar por:

- tinto;
- branco;
- rosé;
- espumante;
- país;
- uva;
- faixa de preço;
- margem;
- estoque;
- ocasião.

---

# 40. CAMPANHA DE CERVEJA

Segmentar por:

- estilo;
- cervejaria;
- país;
- ABV;
- IBU;
- preço;
- margem;
- raridade;
- estoque.

---

# 41. ROI DE CAMPANHA

Medir:

- receita incremental;
- margem incremental;
- custo da campanha;
- conversão;
- ticket;
- volume;
- giro;
- estoque pós-campanha.

---

# 42. CRM FULL

Entidades:

- clientes;
- contatos;
- leads;
- oportunidades;
- fornecedores;
- campanhas;
- histórico;
- propostas;
- pedidos;
- tickets;
- NPS.

---

# 43. PIPELINE B2B

**lead → diagnóstico → mix → proposta → negociação → pedido → entrega → reposição → expansão.**

---

# 44. CLIENTES

Cadastro:

- empresa;
- CNPJ;
- contatos;
- unidades;
- perfil;
- mix;
- histórico;
- margem;
- faturamento;
- campanhas;
- contratos;
- observações;
- documentos.

---

# 45. SEGMENTAÇÃO DE CLIENTES

- supermercado;
- empório;
- bar;
- restaurante;
- loja especializada;
- distribuidor;
- evento;
- outros.

---

# 46. OPORTUNIDADES

Registrar:

- expansão de mix;
- nova categoria;
- fornecedor novo;
- campanha;
- evento;
- reposição;
- renegociação.

---

# 47. ERP/RP FULL

Módulos:

- clientes;
- fornecedores;
- produtos;
- compras;
- estoque;
- vendas;
- financeiro;
- contas a pagar;
- contas a receber;
- fiscal;
- contratos;
- documentos;
- RH;
- relatórios;
- auditoria.

---

# 48. FINANCEIRO

Dashboard:

- faturamento;
- margem;
- contas a receber;
- contas a pagar;
- fluxo de caixa;
- previsão;
- inadimplência;
- rentabilidade por cliente;
- rentabilidade por categoria.

---

# 49. RENTABILIDADE POR CLIENTE

Considerar:

- receita;
- margem;
- descontos;
- frete;
- custo de atendimento;
- devoluções.

---

# 50. FISCAL

Integrar provider homologado para documentos fiscais, conforme operação real.

---

# 51. CONTRATOS

Registrar:

- cliente;
- vigência;
- condições;
- SLA;
- regras comerciais;
- anexos;
- renovação.

---

# 52. RH

Perfis:

- direção;
- compras;
- comercial;
- marketing;
- financeiro;
- estoque;
- BI;
- contador;
- Master Impulsionando.

---

# 53. BI EXECUTIVO

Primeira tela:

- faturamento;
- margem;
- estoque;
- capital imobilizado;
- rupturas;
- excesso;
- compras previstas;
- campanhas;
- clientes;
- top SKUs;
- bottom SKUs;
- fornecedores;
- forecast.

---

# 54. BI DE COMPRAS

- comprado;
- custo médio;
- variação;
- prazo;
- fornecedor;
- volume;
- economia;
- ruptura evitada;
- excesso gerado.

---

# 55. BI DE MARGEM

Heatmap:

- SKU;
- cliente;
- fornecedor;
- campanha;
- categoria;
- mês.

---

# 56. BI DE ESTOQUE

- cobertura;
- giro;
- idade;
- ABC;
- XYZ;
- ruptura;
- excesso;
- validade.

---

# 57. BI DE CLIENTES

- receita;
- margem;
- crescimento;
- frequência;
- mix;
- potencial;
- risco.

---

# 58. FORECAST

Prever:

- demanda;
- compra;
- faturamento;
- margem;
- estoque.

Sempre apresentar intervalo/confiança quando modelo permitir.

---

# 59. SAZONALIDADE

Considerar:

- mês;
- clima;
- feriados;
- datas comemorativas;
- eventos;
- histórico.

---

# 60. CENÁRIOS

Simular:

- aumentar preço;
- reduzir preço;
- comprar mais;
- campanha;
- fornecedor novo;
- alteração de mix.

---

# 61. ALERTAS INTELIGENTES

- margem caiu;
- ruptura próxima;
- excesso;
- campanha performando mal;
- fornecedor atrasado;
- custo subiu;
- cliente reduziu compra;
- SKU explodiu demanda;
- validade crítica.

---

# 62. N8N — PRINCÍPIO

Automação baseada em eventos reais.

Nenhum workflow ACTIVE sem E2E.

---

# 63. N8N — ESTOQUE

**estoque crítico → alerta → sugestão compra → responsável → ação.**

---

# 64. N8N — COMPRA

**recomendação → aprovação → cotação → fornecedor → pedido → recebimento → financeiro.**

---

# 65. N8N — CAMPANHA

**oportunidade → segmento → campanha → aprovação → disparo → venda → ROI.**

---

# 66. N8N — CLIENTE INATIVO

Detectar queda de compra e acionar comercial.

---

# 67. N8N — MARGEM

Margem abaixo da meta → alerta → revisão de custo/preço/campanha.

---

# 68. N8N — FORNECEDOR

Atraso ou custo fora de faixa → alerta e comparação alternativa.

---

# 69. N8N — RELATÓRIOS

Gerar relatórios periódicos:

- diário;
- semanal;
- mensal;
- cliente;
- compras;
- margem;
- estoque;
- campanhas.

---

# 70. MENSAGERIA

Canais:

- e-mail;
- WhatsApp;
- notificações internas;
- social quando aplicável.

---

# 71. TEMPLATES DE E-MAIL

Biblioteca:

- relatório semanal;
- recomendação de compra;
- cotação;
- pedido;
- alerta de estoque;
- alerta de margem;
- campanha;
- cliente inativo;
- relatório de performance;
- evento.

---

# 72. WHATSAPP

Templates:

- aprovação de compra;
- alerta crítico;
- reposição;
- campanha;
- cliente;
- fornecedor;
- relatório resumido.

---

# 73. INSTAGRAM

Auditar perfil oficial da Rio Beer e usar como canal de conteúdo/branding.

Conteúdos:

- rótulos;
- curadoria;
- bastidores;
- eventos;
- recomendações;
- educação cervejeira;
- vinhos.

---

# 74. GRAND MARCHÉ — REDES

Auditar Instagram e presença digital do Grand Marché Itaipu para integrar campanhas autorizadas e mensuração.

---

# 75. HORA DA GELADA — CONTEÚDO

Usar o festival como ativo editorial e histórico.

---

# 76. LOGOMARCA E IDENTIDADE

Auditar logo atual Rio Beer.

Se não houver asset canônico de boa qualidade:

- obter logo oficial;
- vetorizar apenas com validação;
- criar derivados web;
- favicon;
- social preview;
- templates.

---

# 77. SÉRGIO / SERJÃO RIO BEER

Sérgio Marques é figura pública ligada à curadoria Rio Beer e ao Grand Marché.

Criar bloco editorial sobre sua autoridade no universo cervejeiro somente com informações confirmadas.

Não gerar avatar fotorrealista do Sérgio sem foto de referência fornecida/autorizada. Se necessário, usar ilustração genérica de curador cervejeiro ou solicitar asset oficial.

---

# 78. FRONT PÚBLICO

O front deve comunicar:

- inteligência;
- curadoria;
- paixão por cerveja/vinho;
- precisão comercial;
- dados;
- experiência;
- eventos;
- clientes.

---

# 79. HERO

Conceito:

**Curadoria, estratégia e inteligência para fazer cada rótulo girar melhor.**

CTAs:

- Conhecer a Rio Beer;
- Falar com Bierito;
- Ver serviços;
- Conhecer cases;
- Solicitar diagnóstico.

---

# 80. SERVIÇOS NO FRONT

- estratégia de compras;
- curadoria;
- gestão de portfólio;
- análise de margem;
- campanhas;
- eventos;
- inteligência comercial;
- consultoria de bebidas.

---

# 81. CASE GRAND MARCHÉ

Criar case apenas com dados autorizados.

Mostrar:

- contexto;
- estratégia;
- curadoria;
- eventos;
- seção cervejeira;
- resultados quando aprovados.

---

# 82. SEO

Otimizar para:

- consultoria cerveja;
- curadoria cervejeira;
- gestão de bebidas;
- cervejas especiais;
- estratégia de compras de cerveja;
- eventos cervejeiros;
- Niterói/Rio quando relevante.

---

# 83. UTM

Persistir origem de leads e campanhas.

---

# 84. SUPORTE / TICKETS

Usar módulo universal de chamados.

Tickets:

- cliente;
- fornecedor;
- operação;
- sistema;
- relatório;
- campanha;
- compra.

---

# 85. SLA

Parametrizável por cliente/contrato.

---

# 86. SEGURANÇA

- RLS;
- RBAC;
- tenant isolation;
- MFA;
- Vault;
- logs;
- auditoria;
- backups;
- rate limit;
- LGPD.

---

# 87. ACESSO A DADOS DO CLIENTE

Rio Beer só pode acessar dados do Grand Marché que estejam autorizados para a relação comercial.

---

# 88. AUDITORIA

Toda alteração crítica:

- preço;
- custo;
- margem;
- compra;
- campanha;
- estoque;
- fornecedor;
- aprovação.

Registrar usuário/data/motivo.

---

# 89. TESTE E2E — IMPORTAÇÃO

Planilha histórica → preview → validação → importação → dashboard → comparação histórica.

---

# 90. TESTE E2E — COMPRA

Estoque crítico → Bierito recomenda → usuário revisa → cotação → pedido → recebimento → estoque → financeiro.

---

# 91. TESTE E2E — MARGEM

Custo sobe → margem recalcula → alerta → simulação → decisão → preço atualizado.

---

# 92. TESTE E2E — CAMPANHA

Excesso + margem alta → Bierito sugere → campanha → segmento → execução → vendas → ROI → aprendizado.

---

# 93. TESTE E2E — GRAND MARCHÉ

Importar/integrar dados autorizados → calcular giro → ruptura → compra sugerida → campanha → resultado.

---

# 94. TESTE E2E — FORNECEDOR

Fornecedor atrasa → score atualiza → alerta → alternativa → decisão.

---

# 95. TESTE E2E — BIERITO

Perguntas reais de compra/margem/estoque/campanha → resposta baseada em dados → evidência → ação proposta.

---

# 96. TESTE — PERMISSÕES

Marketing tenta editar custo → NEGADO.  
Estoque tenta aprovar pagamento → NEGADO.  
Cliente tenta acessar outro cliente → NEGADO.  
Bierito tenta dado sem permissão → NEGADO.  
Master autorizado → PERMITIDO/AUDITADO.

---

# 97. TESTE — PUBLICAÇÃO

Validar:

- branch;
- build;
- deploy;
- SHA;
- `riobeer.impulsionando.com.br`;
- front;
- login;
- dashboard;
- Bierito;
- CRM;
- ERP;
- mobile.

---

# 98. ZERO MOCK

Não mostrar como real:

- vendas;
- margem;
- estoque;
- fornecedores;
- clientes;
- campanhas;
- resultados.

---

# 99. COMITÊ MULTIESPECIALISTA

Perspectivas:

- arquitetura;
- backend;
- frontend;
- UX/UI;
- BI;
- compras;
- supply chain;
- varejo;
- supermercado;
- cerveja;
- vinho;
- pricing;
- margem;
- financeiro;
- CRM;
- growth;
- automação;
- segurança.

---

# 100. ANÁLISE CRÍTICA

Para cada módulo:

1. existe?;
2. funciona?;
3. usa dados reais?;
4. tem integração?;
5. tem UX adequada?;
6. pertence ao Core?;
7. está duplicado?;
8. falta teste?;
9. risco?;
10. prioridade?;
11. evidência?

---

# 101. CRITÉRIO DE GO-LIVE

Somente considerar pronto quando:

- front PASS;
- branding PASS;
- Bierito PASS;
- importação PASS;
- produtos PASS;
- estoque PASS;
- compras PASS;
- margem PASS;
- fornecedores PASS;
- CRM PASS;
- ERP PASS;
- financeiro PASS;
- campanhas PASS;
- BI PASS;
- Grand Marché case PASS;
- N8N crítico PASS;
- RBAC/RLS PASS;
- publicação PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 102. ACEITE POR PERSONA

**Sérgio/Rio Beer:** consigo tomar decisão de compra/margem em minutos?  
**Compras:** sei exatamente o que comprar e por quê?  
**Comercial:** sei onde há oportunidade?  
**Marketing:** sei o que promover sem destruir margem?  
**Financeiro:** sei a rentabilidade real?  
**Cliente:** recebo recomendações baseadas no meu histórico?  
**Bierito:** consigo explicar cada recomendação com dados?  
**Master Impulsionando:** audito sem romper isolamento?

---

# 103. RESULTADO FINAL

A Rio Beer deve operar como um organismo de inteligência:

**HISTÓRICO → ERP → ESTOQUE → VENDAS → MARGEM → BIERITO → PREVISÃO → COMPRA → FORNECEDOR → CAMPANHA → RESULTADO → APRENDIZADO.**

---

# 104. PRINCÍPIO DE CORE

Universalizar:

- CRM;
- ERP;
- compras;
- estoque;
- margem;
- fornecedores;
- importação;
- campanhas;
- BI;
- N8N;
- tickets;
- segurança.

Manter na Rio Beer:

- branding;
- Bierito;
- expertise cervejeira/vinhos;
- regras de negócio;
- clientes;
- portfólio;
- estratégias;
- conteúdo.

---

# 105. REGRA FINAL AO PROGRAMADOR

Não transformar Rio Beer em catálogo de bebidas.

O diferencial é a capacidade de **entender dados, gerar inteligência e orientar decisões melhores de compra, estoque, preço, margem e campanha**.

Se o sistema só registrar informação, está incompleto.

Se recomendar sem dados, está errado.

Se o Bierito não conseguir explicar por que está recomendando algo, está incompleto.

**A Rio Beer precisa ser uma gestora cirúrgica de portfólio e margem, amplificada pela inteligência do Bierito e pelo Core da Impulsionando.**

---

**STATUS:** PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** CAUÃ / K1 / PROGRAMADOR  
**SUBDOMÍNIO:** `riobeer.impulsionando.com.br`  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**