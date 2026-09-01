# SUPERPROMPT MESTRE — PRODUCT INTAKE ON TAP PUB

## ON TAP PUB + IMPULSIONITO — Plano Full, front premium de pub, PDV, estoque, taps, gastronomia, reservas, eventos, CRM, ERP/RP, financeiro, fiscal, mensageria, N8N, BI, growth, segurança e Go-Live

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / K1 / programador  
**TENANT:** On Tap Pub  
**SUBDOMÍNIO CANÔNICO:** `ontap.impulsionando.com.br`  
**PLANO:** Impulsionando Full  
**AGENTE CENTRAL:** Impulsionito  
**AGENTE ESPECIALIZADO:** não inventar nome; usar Impulsionito com contexto On Tap até nome oficial ser definido  

> **NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, FRONTEND, BACKEND, N8N, CREDENCIAIS, INFRAESTRUTURA OU PRODUÇÃO A PARTIR DESTE REGISTRO.** Este documento é exclusivamente Product Intake / Livro de Anotações para execução posterior pelo programador.

---

# 1. PRINCÍPIO DE EXECUÇÃO FUTURA

Executar a partir do estado real existente.

**AUDITAR → PRESERVAR → CORRIGIR → CONSOLIDAR → COMPLETAR → INTEGRAR → TESTAR → PUBLICAR → VALIDAR.**

Tudo que já estiver correto deve ser preservado.

---

# 2. ESTADO REAL EXISTENTE

O repositório já contém:

- rota dedicada `/ontap`;
- mapeamento de subdomínio;
- perfil On Tap dentro de `FullClientLanding`;
- classificação do tenant como bar;
- inclusão do subdomínio em matriz de fronts live.

Não recriar cegamente; auditar o que já existe e substituir apenas o que for genérico, incompleto ou incorreto.

---

# 3. BENCHMARK E POSICIONAMENTO REAL

Usar como referência factual atual:

- On Tap Pub na Tijuca desde 2015;
- endereço Rua Major Ávila, 455, Tijuca;
- vocação de pub/gastropub;
- aproximadamente 20 torneiras de chope como elemento icônico da experiência;
- cervejas artesanais e especiais;
- hambúrgueres e carnes defumadas;
- reservas;
- esportes/transmissões;
- ponto de encontro para happy hour, aniversários e grupos;
- ambiente de pub confortável e descontraído.

Referências externas devem ser usadas apenas como benchmark funcional e de posicionamento, sem copiar identidade ou conteúdo protegido.

---

# 4. ESSÊNCIA DE MARCA

O front deve transmitir:

- pub de verdade;
- Tijuca;
- tradição;
- cerveja premium;
- torneiras/taps em rotação;
- gastronomia bem executada;
- harmonização;
- música de qualidade;
- conforto;
- convivência;
- happy hour;
- noite;
- celebração;
- eventos.

A estética deve ser sofisticada sem perder simplicidade e espontaneidade de pub.

---

# 5. DIREÇÃO DE ARTE

Direção visual sugerida:

- madeira;
- metal escuro;
- cobre/latão;
- textura de tap handle;
- espuma de chope;
- âmbar;
- vermelho queimado;
- verde pub quando fizer sentido;
- preto/grafite;
- iluminação quente;
- fotografia real de comida e chope;
- elementos industriais discretos.

Evitar estética genérica de “bar temático” ou excesso de neon.

---

# 6. FRONT PÚBLICO — OBJETIVO

O visitante deve entender em menos de 10 segundos:

1. o que é o On Tap;
2. por que vale ir;
3. o que está rolando hoje;
4. quais chopes/rótulos estão disponíveis;
5. o que comer;
6. como reservar;
7. como chegar;
8. como falar com a casa.

---

# 7. HERO

Primeira dobra com CTA forte.

Mensagem-base:

**20 torneiras. Cervejas especiais. Gastronomia de verdade. A noite da Tijuca começa aqui.**

CTAs:

- Ver chopes de hoje;
- Ver cardápio;
- Reservar mesa/evento;
- Falar no WhatsApp;
- Como chegar.

---

# 8. HORÁRIO E DAYPART

A experiência editorial deve ser orientada principalmente ao período da tarde/noite.

Referência operacional: comunicação de happy hour e noite a partir de aproximadamente 17h nos dias em que a casa operar nesse horário.

Nunca hard-code horário sem fonte operacional atualizada.

---

# 9. TAPS / TORNEIRAS EM TEMPO REAL

Criar módulo central de taps.

Cada torneira deve possuir:

- número;
- cervejaria;
- rótulo;
- estilo;
- ABV;
- IBU quando disponível;
- origem;
- descrição;
- copos/volumes;
- preço;
- saldo estimado;
- status: ativa/acabando/esgotada/limpeza/manutenção;
- data/hora da última atualização.

---

# 10. ESTOQUE DE CHOPE POR VOLUME

Controle por barril/keg:

- capacidade inicial;
- volume vendido;
- perdas;
- degustação/cortesia;
- sangria/limpeza;
- saldo estimado;
- barril atual;
- próximo barril;
- lote;
- validade;
- fornecedor.

Baixa por ml conforme venda no PDV.

---

# 11. OUTROS RÓTULOS

Catálogo também para:

- garrafas;
- latas;
- cervejas importadas;
- sem álcool quando houver;
- drinks;
- destilados;
- vinhos quando houver;
- refrigerantes e não alcoólicos.

---

# 12. CARDÁPIO GASTRONÔMICO

Estruturar por intenção:

- entradas;
- petiscos;
- hambúrgueres;
- carnes defumadas;
- pratos;
- sobremesas;
- especiais sazonais;
- harmonizações.

Cada item:

- nome;
- descrição;
- foto real;
- preço;
- disponibilidade;
- ingredientes principais;
- alergênicos;
- harmonização sugerida;
- tempo estimado quando apropriado.

---

# 13. HARMONIZAÇÃO

Transformar harmonização em diferencial editorial e operacional.

Regras de pareamento devem ser cadastradas e validadas por humano.

Exemplo:

**IPA → prato X**

O sistema pode sugerir, mas não inventar combinações sem regra aprovada.

---

# 14. JUNIOR / AUTORIDADE GASTRONÔMICA

Criar espaço editorial para apresentar Júnior como figura ligada à proposta gastronômica, somente com informações biográficas confirmadas pela própria casa.

Destacar:

- formação/experiência em gastronomia quando confirmada;
- filosofia de harmonização;
- criação de pratos;
- curadoria de experiência.

Não inventar títulos ou currículo.

---

# 15. MÚSICA E AMBIENTE

Área editorial:

- seleção musical;
- agenda de música ao vivo quando houver;
- eventos esportivos;
- qualidade do som;
- clima do pub.

Evitar prometer marcas/modelos de equipamentos de áudio sem validação.

---

# 16. EVENTOS E RESERVAS

Permitir:

- reserva de mesa;
- aniversário;
- confraternização;
- evento corporativo;
- grupo;
- transmissão esportiva;
- evento fechado/parcial quando política permitir.

---

# 17. MOTOR DE RESERVAS

Campos:

- data;
- horário;
- pessoas;
- tipo de evento;
- nome;
- telefone;
- e-mail;
- observações;
- acessibilidade;
- área desejada;
- consumo mínimo/caução quando aplicável;
- status;
- responsável.

---

# 18. RESERVAS — CAPACIDADE

Configurar capacidade real por:

- salão;
- mesa;
- área;
- evento;
- horário.

Bloquear overbooking.

---

# 19. RESERVAS — JORNADA

**solicitação → disponibilidade → confirmação → lembrete → chegada/check-in → consumo → fechamento → NPS.**

---

# 20. PDV IMPULSIONANDO

Implementar PDV próprio do Core, integrado nativamente ao On Tap.

Recursos:

- abertura/fechamento de caixa;
- mesas;
- comandas;
- clientes;
- produtos;
- taps;
- cozinha;
- pagamentos;
- descontos;
- cupom;
- gorjeta/taxa de serviço;
- cancelamento;
- sangria;
- fechamento;
- fiscal;
- CRM;
- estoque.

---

# 21. COMANDA

Cada comanda deve registrar:

- mesa;
- cliente quando identificado;
- atendente;
- itens;
- horário;
- alterações;
- cancelamentos;
- descontos;
- total;
- pagamento;
- NF/cupom;
- NPS.

---

# 22. ESTOQUE EM TEMPO REAL

Baixa automática por venda.

Categorias:

- chope;
- cerveja;
- bebida;
- cozinha;
- embalagens;
- insumos;
- descartáveis;
- limpeza.

---

# 23. FICHA TÉCNICA

Cada prato/drink pode possuir ficha técnica:

- ingredientes;
- rendimento;
- unidade;
- custo;
- perdas;
- CMV;
- preço;
- margem.

Venda baixa insumos conforme receita validada.

---

# 24. CMV

Dashboard:

- CMV teórico;
- CMV real;
- diferença;
- perdas;
- margem por item;
- margem por categoria;
- chope por barril;
- desperdício.

---

# 25. ERP/RP FULL

On Tap deve usar:

- fornecedores;
- compras;
- produtos;
- estoque;
- vendas;
- contas a pagar;
- contas a receber;
- fluxo de caixa;
- centros de custo;
- fiscal;
- RH;
- relatórios;
- auditoria.

---

# 26. COMPRAS E FORNECEDORES

Fluxo:

**estoque mínimo → sugestão de compra → cotação → pedido → recebimento → conferência → estoque → financeiro.**

---

# 27. FINANCEIRO

Dashboard:

- vendas hoje;
- vendas mês;
- ticket médio;
- consumo por mesa;
- receita por categoria;
- margem;
- contas a pagar;
- caixa;
- previsão;
- taxas de pagamento;
- conciliação.

---

# 28. FISCAL

Integrar emissão/consulta de documento fiscal conforme provedor e legislação aplicável.

Cliente deve poder visualizar seu documento fiscal quando identificado.

---

# 29. ÁREA DO CLIENTE

Cliente autenticado pode visualizar:

- visitas;
- comandas;
- histórico de consumo;
- itens consumidos;
- documentos fiscais;
- pontos/benefícios se houver;
- reservas;
- avaliações;
- favoritos;
- preferências de cerveja quando consentido.

---

# 30. PÓS-VISITA

Após fechamento:

**visita → WhatsApp/e-mail → avaliação → NF → NPS → relacionamento.**

A jornada deve associar cliente + mesa/comanda + atendente + produtos consumidos.

---

# 31. NPS

Pesquisa mobile-first configurável:

- atendimento;
- recepção;
- ambiente;
- música;
- comida;
- chope/cerveja;
- tempo de espera;
- preço percebido;
- NPS 0–10;
- sugestão/elogio.

---

# 32. CRM 360º

Cadastro único:

- contato;
- visitas;
- consumo;
- ticket;
- reservas;
- preferências;
- campanhas;
- avaliações;
- NPS;
- tickets;
- consentimentos.

---

# 33. SEGMENTAÇÃO CRM

Exemplos:

- fã de IPA;
- fã de Lager;
- cliente de happy hour;
- alto ticket;
- aniversário;
- esportes;
- música;
- inativo;
- promotor NPS;
- detrator;
- frequentador recorrente.

---

# 34. GROWTH

Medir:

- aquisição;
- primeira visita;
- recorrência;
- frequência;
- ticket médio;
- LTV;
- churn/inatividade;
- reservas;
- campanhas;
- retorno por canal;
- NPS;
- indicação.

---

# 35. CAPTAÇÃO

Fontes:

- Google;
- Instagram;
- TikTok;
- indicação;
- eventos;
- WhatsApp;
- busca orgânica;
- Google Maps;
- parceiros;
- QR no salão.

---

# 36. SEO LOCAL

Otimizar para buscas como:

- pub Tijuca;
- cerveja artesanal Tijuca;
- chope artesanal Tijuca;
- happy hour Tijuca;
- bar perto do Maracanã;
- hambúrguer Tijuca;
- gastropub Tijuca;
- aniversário em bar Tijuca.

Sem keyword stuffing.

---

# 37. GOOGLE / UTM

Implementar:

- GA4;
- GTM quando adotado;
- Search Console;
- conversões;
- UTM persistente;
- origem da reserva;
- origem da venda quando atribuível;
- campanhas.

---

# 38. SOCIAL CONTENT ENGINE

Criar estrutura para publicar/organizar:

- tap list do dia;
- novidade de chope;
- prato da semana;
- harmonização;
- happy hour;
- jogo;
- evento;
- música;
- aniversário;
- bastidores.

A publicação automática em redes só quando API oficial e autorização permitirem.

---

# 39. WHATSAPP

Fluxos:

- reserva;
- confirmação;
- lembrete;
- lista de taps;
- evento;
- aniversário;
- pós-visita;
- NPS;
- reativação.

---

# 40. E-MAIL

Templates com identidade On Tap:

- boas-vindas;
- reserva;
- confirmação;
- aniversário;
- evento;
- novidades;
- pós-visita;
- NPS;
- recuperação;
- documento fiscal.

---

# 41. N8N — RESERVAS

**reserva → confirmação → lembrete → check-in → fechamento → NPS.**

---

# 42. N8N — NOVO CLIENTE

**cadastro/primeira comanda identificada → CRM → boas-vindas → segmentação → relacionamento.**

---

# 43. N8N — PÓS-CONSUMO

**fechamento → NF → pesquisa → NPS → classificação → ação.**

---

# 44. N8N — DETRATOR

NPS baixo:

- criar tarefa;
- alertar gestor;
- registrar motivo;
- contato humano;
- resolução;
- acompanhamento.

---

# 45. N8N — PROMOTOR

NPS alto:

- agradecer;
- convidar para avaliação pública de forma não coercitiva;
- indicar novidades;
- programa de indicação quando adotado.

---

# 46. N8N — ESTOQUE

Alertas:

- tap acabando;
- barril próximo do fim;
- item abaixo mínimo;
- insumo crítico;
- produto parado;
- divergência de inventário.

---

# 47. N8N — EVENTOS

**evento criado → divulgação → reserva → confirmação → operação → pós-evento → NPS.**

---

# 48. N8N — CLIENTE INATIVO

Regra configurável por dias sem visita.

Enviar comunicação relevante, não spam.

---

# 49. BI DA DIREÇÃO

Primeira tela deve responder:

- quanto vendeu hoje?;
- ticket médio?;
- mesas abertas?;
- taps ativos?;
- barris acabando?;
- itens mais vendidos?;
- CMV?;
- margem?;
- reservas hoje?;
- ocupação?;
- NPS?;
- clientes retornando?;
- campanhas convertendo?;
- perdas?

---

# 50. BI DE TAP

Por rótulo:

- volume vendido;
- faturamento;
- margem;
- velocidade de giro;
- duração do barril;
- perdas;
- preferência de clientes.

---

# 51. BI DE GASTRONOMIA

Por prato:

- vendas;
- receita;
- CMV;
- margem;
- cancelamento;
- tempo;
- harmonizações convertidas.

---

# 52. DASHBOARD OPERACIONAL

Perfis:

- direção;
- gerente;
- caixa;
- garçom;
- cozinha;
- estoque;
- financeiro;
- marketing;
- contador;
- Master Impulsionando.

---

# 53. RH

Módulo:

- funcionários;
- função;
- escala;
- jornada;
- acesso;
- treinamento;
- documentos;
- metas;
- desempenho operacional.

---

# 54. GARÇOM MOBILE

Interface rápida:

- mesas;
- comandas;
- adicionar item;
- observação;
- tap list;
- item indisponível;
- chamar fechamento.

Poucos toques.

---

# 55. COZINHA / KDS

Painel:

- pedidos;
- horário;
- prioridade;
- observações;
- status;
- tempo em fila;
- pronto.

---

# 56. CAIXA

Fluxo:

- abertura;
- recebimentos;
- split de conta;
- múltiplos meios;
- gorjeta/taxa;
- descontos autorizados;
- fechamento;
- sangria;
- divergência.

---

# 57. PAGAMENTOS

Integrar providers homologados ou Impulsionando Payments quando contratado.

Suportar:

- Pix;
- cartão;
- divisão de conta;
- múltiplos pagamentos;
- conciliação.

---

# 58. PROGRAMA DE BENEFÍCIOS

Opcional e configurável:

- clube;
- desconto;
- aniversário;
- pontos;
- cashback;
- tap especial;
- prioridade em eventos.

Não implementar programa artificial sem regra comercial aprovada.

---

# 59. EVENTOS ESPORTIVOS

Calendário editorial e de reservas para jogos/transmissões relevantes.

Não prometer exibição sem confirmação operacional/licenciamento.

---

# 60. EXPERIÊNCIA DE HOJE

Home deve possuir bloco dinâmico:

**Hoje no On Tap**

- horário;
- taps em destaque;
- comida em destaque;
- evento/jogo/música;
- happy hour;
- capacidade/reserva.

---

# 61. FOTOS E CONTEÚDO

Priorizar fotos reais do estabelecimento, comida, equipe e chope.

Não usar imagens de banco que prometam algo diferente do ambiente real.

---

# 62. ACESSIBILIDADE

- contraste;
- navegação por teclado;
- labels;
- texto alternativo;
- informações de acesso físico confirmadas;
- cardápio legível;
- mobile.

---

# 63. SEGURANÇA

- RLS;
- RBAC;
- tenant isolation;
- MFA para gestão;
- Vault;
- logs;
- auditoria;
- backups;
- rate limiting;
- proteção de APIs;
- LGPD.

---

# 64. CONTADOR

Área segregada:

- faturamento;
- documentos fiscais;
- contas;
- extratos;
- conciliação;
- DRE gerencial;
- fechamento;
- exportações.

---

# 65. TESTE E2E — COMANDA

**mesa → cliente → chope 300ml → baixa de 300ml do barril → comida → cozinha → fechamento → pagamento → fiscal → CRM → NPS.**

---

# 66. TESTE E2E — BARRIL

Cadastrar barril → conectar a tap → vender volumes diferentes → registrar perda → saldo → alerta de fim → troca de barril → histórico.

---

# 67. TESTE E2E — RESERVA

Site/WhatsApp → reserva → capacidade → confirmação → lembrete → check-in → consumo → fechamento → NPS.

---

# 68. TESTE E2E — CLIENTE

Primeira visita identificada → CRM → histórico de consumo → segunda visita → reconhecimento → preferência → campanha relevante.

---

# 69. TESTE E2E — FISCAL

Fechamento → documento fiscal único → área do cliente → ERP → conciliação.

---

# 70. TESTE E2E — ESTOQUE

Compra → recebimento → estoque → venda → ficha técnica → baixa → inventário → divergência.

---

# 71. TESTE — N8N

Nenhum workflow ACTIVE sem:

- workflow publicado;
- ID real;
- credencial;
- trigger;
- idempotência;
- logs;
- retry;
- E2E.

---

# 72. TESTE — PERMISSÕES

Garçom tenta financeiro → NEGADO.  
Cozinha tenta desconto → NEGADO.  
Marketing tenta editar caixa → NEGADO.  
Cliente A tenta comanda de B → NEGADO.  
Contador tenta CRM detalhado → NEGADO.  
Master autorizado → PERMITIDO/AUDITADO.

---

# 73. TESTE — PUBLICAÇÃO

Após implementação futura:

- branch correta;
- commit;
- build;
- deploy;
- SHA em produção;
- `ontap.impulsionando.com.br`;
- cache;
- home;
- taps;
- cardápio;
- reservas;
- login;
- dashboard;
- PDV;
- mobile.

---

# 74. ZERO MOCK

Produção não pode mostrar:

- tap fictício;
- preço fictício;
- estoque fake;
- prato fake;
- reserva fake;
- dashboard estático;
- vendas inventadas.

---

# 75. COMITÊ MULTIESPECIALISTA

Revisar com perspectivas de:

- arquitetura;
- backend;
- frontend;
- banco;
- DevOps;
- UX/UI;
- design instrucional;
- gastronomia;
- gestão de bares;
- cerveja artesanal;
- estoque;
- PDV;
- financeiro;
- fiscal;
- CRM;
- CX;
- growth;
- SEO local;
- eventos;
- automação;
- segurança.

---

# 76. CRITÉRIO DE GO-LIVE

Somente considerar pronto quando:

- branding/front PASS;
- taps PASS;
- estoque por volume PASS;
- cardápio PASS;
- harmonização PASS;
- PDV PASS;
- comandas PASS;
- cozinha PASS;
- reservas PASS;
- eventos PASS;
- CRM PASS;
- ERP PASS;
- financeiro PASS;
- fiscal PASS;
- área do cliente PASS;
- NPS PASS;
- N8N crítico PASS;
- BI PASS;
- RBAC/RLS PASS;
- publicação PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 77. ACEITE POR PERSONA

**Cliente:** vejo rapidamente o que beber, comer e como reservar?  
**Garçom:** lanço uma comanda em poucos toques?  
**Cozinha:** recebo pedidos claros e priorizados?  
**Gerente:** sei o que está acontecendo agora?  
**Estoque:** sei quanto há em cada barril e insumo?  
**Financeiro:** concilio caixa, vendas e pagamentos?  
**Marketing:** sei quem veio de cada campanha?  
**Direção:** entendo margem, CMV, giro, ocupação e retorno?  
**Master Impulsionando:** consigo auditar tudo sem romper isolamento?

---

# 78. RESULTADO FINAL ESPERADO

O On Tap deve operar como um ecossistema único:

**TRÁFEGO/GOOGLE/REDES → FRONT → TAP LIST/CARDÁPIO → RESERVA/CLIENTE → CRM → PDV → COMANDA → COZINHA → ESTOQUE → PAGAMENTO → FISCAL → ERP → PÓS-VISITA → NPS → RETENÇÃO → BI.**

A experiência pública deve vender **qualidade de vida, encontro, cerveja premium, gastronomia, harmonização e noite na Tijuca**.

A operação interna deve eliminar planilhas paralelas e integrar venda, estoque, barril, cozinha, cliente, financeiro e relacionamento.

---

# 79. REGRA FINAL AO PROGRAMADOR

Universalizar no Core tudo que for reutilizável:

- PDV;
- comandas;
- estoque;
- ficha técnica;
- reservas;
- CRM;
- ERP;
- fiscal;
- NPS;
- mensageria;
- N8N;
- BI;
- segurança.

Manter no tenant On Tap:

- branding;
- cardápio;
- taps;
- preços;
- regras de casa;
- conteúdo;
- eventos;
- dados operacionais.

**Implementar profundidade operacional por baixo e simplicidade absoluta para cliente e equipe.**

---

**STATUS:** PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** CAUÃ / K1 / PROGRAMADOR  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**