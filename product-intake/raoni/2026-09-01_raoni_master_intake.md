# SUPERPROMPT MESTRE — PRODUCT INTAKE BOTECO DO RAONI

## BOTECO DO RAONI + IMPULSIONITO — Plano Full, identidade lúdica, front autoral, PDV, taps, estoque por ml, gastronomia, eventos, reservas, vouchers, CRM, ERP/RP, financeiro, fiscal, N8N, omnichannel, BI, growth, segurança e Go-Live

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / K1 / programador  
**TENANT:** Boteco do Raoni  
**SUBDOMÍNIO CANÔNICO:** `raoni.impulsionando.com.br`  
**PLANO:** Impulsionando Full  
**AGENTE CENTRAL:** Impulsionito  
**AGENTE ESPECIALIZADO:** não inventar nome; usar Impulsionito contextualizado para o Boteco do Raoni até definição oficial  

> **NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, FRONTEND, BACKEND, N8N, CREDENCIAIS, INFRAESTRUTURA OU PRODUÇÃO A PARTIR DESTE REGISTRO.** Este documento é exclusivamente Product Intake / Livro de Anotações para execução posterior pelo programador.

---

# 1. PRINCÍPIO CENTRAL

O Boteco do Raoni não deve ser tratado como um bar genérico. A marca é fortemente associada à personalidade de Raoni, ao humor, à cultura cervejeira, a nomes criativos de pratos e bebidas, à convivência e a experiências de boteco que misturam cerveja artesanal, gastronomia, entretenimento e irreverência.

O sistema deve transformar essa personalidade em produto digital sem comprometer clareza operacional.

**PERSONALIDADE NA EXPERIÊNCIA + PRECISÃO ABSOLUTA NA TRANSAÇÃO.**

---

# 2. REGRA DE CONTINUIDADE

Na execução futura:

**AUDITAR → PRESERVAR → CORRIGIR → CONSOLIDAR → COMPLETAR → INTEGRAR → TESTAR → PUBLICAR → VALIDAR.**

Regras:

- correto → preservar;
- incompleto → completar;
- duplicado → consolidar;
- genérico demais → personalizar;
- mock em produção → remover/isolar;
- integração desenhada sem E2E → marcar não homologada;
- front sem backend → incompleto;
- backend sem jornada utilizável → incompleto;
- commit ≠ deploy;
- deploy ≠ produção correta;
- produção correta somente após validação no domínio canônico.

---

# 3. ESTADO REAL EXISTENTE

O repositório já possui:

- rota dedicada `/raoni`;
- mapeamento do subdomínio;
- perfil `Boteco do Raoni` em `FullClientLanding`;
- classificação vertical como bar;
- inclusão de `raoni.impulsionando.com.br` na matriz de fronts live.

Nada deve ser recriado cegamente.

---

# 4. IDENTIDADE VISUAL CANÔNICA

Usar como referência oficial o logo fornecido pelo cliente nesta conversa:

- placa branca com recorte clássico;
- assinatura “Boteco do RAONI”;
- ilustração do rosto/barba de Raoni;
- azul acinzentado como cor institucional dominante;
- arabescos clássicos;
- linguagem humana, autoral, divertida e reconhecível.

O logo deve ser registrado futuramente como asset canônico, preservando proporção e desenho.

---

# 5. DIREÇÃO DE ARTE

Construir design system a partir do logo, combinando:

- azul acinzentado institucional;
- branco/off-white;
- tons de espuma;
- âmbar de cerveja;
- madeira;
- grafite;
- detalhes em malte/trigo/lúpulo quando coerentes;
- ilustração editorial;
- fotografia real do boteco;
- microanimações leves.

Evitar estética industrial genérica de pub que apague a personalidade do Raoni.

---

# 6. PERSONALIDADE VERBAL

A linguagem deve ser:

- espirituosa;
- inteligente;
- informal sem ser descuidada;
- carioca sem caricatura;
- cervejeira sem tecnicismo desnecessário;
- divertida sem virar “piada em tudo”.

Operações críticas permanecem claras e objetivas.

---

# 7. MICROCOPY DE MARCA

Exemplos de território verbal:

- “Tá com fome ou veio só beber? A gente não julga.”
- “O que está saindo das torneiras hoje.”
- “Esse chope pediu companhia.”
- “Acabou de espetar.”
- “Últimos copos desse barril. Depois, só saudade.”
- “Esse barril já contou tudo que tinha pra contar.”
- “Junta a turma. A mesa a gente resolve.”
- “Raoni recomenda.”

Usar como referência de tom, não como texto obrigatório em todas as telas.

---

# 8. CARDÁPIO COMO PATRIMÔNIO VERBAL

Os nomes criativos dos pratos e bebidas devem ser tratados como parte da marca, não como ruído.

O cadastro deve separar:

- `nome_criativo`;
- `nome_tecnico/categoria`;
- descrição objetiva;
- ingredientes;
- alergênicos;
- foto;
- preço;
- estoque/disponibilidade;
- ficha técnica;
- harmonização;
- história/microcopy.

---

# 9. REFERÊNCIAS FACTUAIS ATUAIS A AUDITAR

Fontes públicas recentes indicam:

- operação no Grajaú;
- endereço atual associado a Rua Uberaba, 91;
- telefone público (21) 3570-6162;
- cervejas artesanais e especiais;
- petiscos e pratos com nomes cômicos;
- capacidade relevante para grupos;
- jogos de tabuleiro;
- fliperama;
- karaokê;
- eventos/entretenimento;
- aproximadamente 12 torneiras de chope artesanal em referências recentes;
- delivery/cardápio em plataformas externas.

Há fontes históricas com endereço antigo na Barão de Mesquita. O programador deve tratar **higienização de NAP** como requisito antes de publicar qualquer dado local.

---

# 10. HISTÓRIA DA MARCA

A narrativa pública deve preservar, quando confirmada:

**canal/conteúdo cervejeiro → comunidade → boteco físico → referência de cerveja + gastronomia + humor no Grajaú.**

Criar bloco editorial “A história do Raoni” sem inventar fatos.

---

# 11. FRONT PÚBLICO — OBJETIVO

Em poucos segundos o visitante deve saber:

- o que é o Boteco do Raoni;
- o que tem hoje;
- quais chopes estão disponíveis;
- o que comer;
- qual a programação;
- como reservar;
- como chegar;
- como falar com a casa.

---

# 12. HERO

Direção de copy:

**Cerveja boa. Comida com personalidade. E nenhuma vontade de ser um boteco sem graça.**

CTAs:

- Ver o que tem hoje;
- Torneiras agora;
- Bora comer;
- Reservar mesa;
- Programação;
- Chamar no WhatsApp.

---

# 13. BLOCO “HOJE NO RAONI”

Home deve ter bloco dinâmico com:

- taps ativos;
- rótulos novos;
- prato/petisco em destaque;
- programação;
- karaokê/comédia/jogo/música quando houver;
- promoção/happy hour quando houver;
- disponibilidade de reserva.

Tudo ligado a dados reais.

---

# 14. MENU PÚBLICO SUGERIDO

- Hoje no Raoni
- Cervejas & Taps
- Comidas
- Drinks
- Programação
- Reservas & Eventos
- A História
- Raoni Recomenda
- Área do Cliente
- Como Chegar

---

# 15. TAP LIST EM TEMPO REAL

Cada torneira deve possuir:

- número;
- cervejaria;
- rótulo;
- estilo;
- ABV;
- IBU quando disponível;
- origem;
- descrição curta;
- tamanhos disponíveis;
- preço;
- status;
- saldo estimado;
- barril associado;
- data/hora de atualização.

---

# 16. ESTOQUE DE CHOPE POR ML

Suportar barris cadastrados em 30L, 40L, 50L ou qualquer volume parametrizado.

Controle:

- volume inicial;
- volume vendido;
- degustação;
- cortesia;
- perda;
- limpeza/sangria;
- saldo;
- troca de barril;
- lote;
- validade;
- fornecedor.

Cada venda no PDV baixa ml reais conforme tamanho do copo.

---

# 17. ALERTAS DE BARRIL

Criar:

- 25% restante;
- 10% restante;
- últimos copos;
- esgotado;
- próximo barril disponível;
- sem reposição;
- perda acima do esperado.

---

# 18. CERVEJAS FORA DA TORNEIRA

Gerenciar:

- garrafas;
- latas;
- growlers quando aplicável;
- importadas;
- nacionais;
- sem álcool;
- sazonais;
- autorais.

---

# 19. CARDÁPIO GASTRONÔMICO

Categorias parametrizáveis:

- petiscos;
- pratos;
- PF/almoço;
- sanduíches;
- burgers;
- carnes;
- veganos/vegetarianos;
- sobremesas;
- especiais da semana.

---

# 20. NOMES CRIATIVOS — ESTRUTURA

Preservar nomes como elemento de marca.

Exemplos públicos atuais/históricos mostram linguagem criativa em itens como “Kibexinha”, “Dá Pra 20 Comer”, “O Ex-Hortista”, “Fala, Fia”, entre outros.

Não copiar dados externos sem validar o cardápio atual da casa.

---

# 21. FICHA TÉCNICA

Cada item gastronômico deve possuir:

- receita;
- ingredientes;
- rendimento;
- unidade;
- custo;
- perda;
- CMV;
- margem;
- tempo médio;
- alergênicos;
- substituições permitidas;
- foto;
- disponibilidade.

---

# 22. HARMONIZAÇÃO

Recurso central da experiência cervejeira:

- cerveja ↔ prato;
- intensidade;
- contraste/complementação;
- explicação curta;
- recomendação aprovada pela equipe.

O sistema pode sugerir somente combinações cadastradas/validadas.

---

# 23. RAONI RECOMENDA

Criar selo/editorial para:

- cerveja;
- prato;
- harmonização;
- evento;
- novidade.

Não transformar toda a página em merchandising do personagem; usar com curadoria.

---

# 24. DRINKS

Cadastro:

- nome criativo;
- base alcoólica;
- ingredientes;
- teor aproximado quando calculado/validado;
- foto;
- preço;
- disponibilidade;
- ficha técnica;
- alergênicos quando aplicável.

---

# 25. PDV IMPULSIONANDO

Implementar PDV próprio do Core:

- abertura/fechamento;
- mesas;
- comandas;
- clientes;
- itens;
- taps;
- cozinha;
- drinks;
- descontos;
- vouchers;
- pagamentos;
- taxa de serviço;
- cancelamentos;
- sangria;
- fiscal;
- CRM;
- estoque.

---

# 26. COMANDA

Registrar:

- mesa;
- cliente identificado;
- atendente;
- itens;
- observações;
- horário;
- status;
- descontos;
- vouchers;
- cancelamentos;
- total;
- pagamento;
- fiscal;
- NPS.

---

# 27. KDS / COZINHA

Painel:

- pedidos;
- mesa;
- horário;
- prioridade;
- observações;
- alergia destacada;
- tempo em fila;
- preparando;
- pronto;
- cancelado.

---

# 28. GARÇOM MOBILE

Mobile-first/PWA:

- mesas;
- comandas;
- adicionar item;
- buscar item;
- taps disponíveis;
- item esgotado;
- observações;
- dividir conta;
- solicitar fechamento.

---

# 29. ESTOQUE GERAL

Categorias:

- chope;
- cerveja;
- bebidas;
- cozinha;
- embalagens;
- limpeza;
- brindes;
- materiais de evento.

---

# 30. INVENTÁRIO

Permitir:

- contagem;
- diferença;
- ajuste;
- motivo;
- usuário;
- data;
- evidência;
- auditoria.

---

# 31. COMPRAS E FORNECEDORES

Fluxo:

**estoque mínimo → sugestão → cotação → pedido → aprovação → recebimento → conferência → estoque → contas a pagar.**

---

# 32. ERP/RP FULL

Boteco do Raoni deve usar:

- produtos;
- fornecedores;
- compras;
- estoque;
- vendas;
- financeiro;
- contas a pagar;
- contas a receber;
- centros de custo;
- fiscal;
- RH;
- relatórios;
- auditoria;
- contratos;
- documentos.

---

# 33. FINANCEIRO

Dashboard:

- vendas hoje;
- vendas mês;
- ticket médio;
- receita por categoria;
- margem;
- CMV;
- caixa;
- contas a pagar;
- taxas;
- conciliação;
- reservas/eventos pagos;
- vouchers utilizados;
- forecast.

---

# 34. FISCAL

Integração com provider homologado para emissão/consulta de documento fiscal.

Cliente identificado deve conseguir consultar o documento correspondente à sua visita/compra quando aplicável.

---

# 35. ÁREA DO CONTADOR

Perfil segregado:

- faturamento;
- documentos fiscais;
- extratos;
- conciliação;
- DRE gerencial;
- despesas;
- fechamento;
- exportações.

---

# 36. CRM 360º

Cadastro único de cliente com:

- dados básicos;
- consentimentos;
- visitas;
- consumo;
- ticket médio;
- cervejas preferidas;
- pratos preferidos;
- reservas;
- eventos;
- vouchers;
- campanhas;
- avaliações;
- NPS;
- suporte;
- origem/UTM.

---

# 37. IDENTIFICAÇÃO DO CLIENTE

Permitir identificação por:

- QR da mesa;
- login;
- telefone;
- e-mail;
- clube;
- reserva;
- voucher.

Evitar cadastro repetitivo.

---

# 38. ÁREA DO CLIENTE

Mostrar:

- histórico de visitas;
- comandas;
- itens consumidos;
- documentos fiscais;
- reservas;
- ingressos/eventos;
- vouchers;
- benefícios;
- favoritos;
- avaliações;
- NPS;
- preferências.

---

# 39. RESERVAS — TIPOS

Permitir:

- mesa;
- aniversário;
- grupo;
- confraternização;
- evento corporativo;
- karaokê;
- comédia;
- transmissão esportiva;
- evento especial.

---

# 40. MOTOR DE RESERVAS

Campos:

- data;
- horário;
- número de pessoas;
- área;
- tipo;
- nome;
- contato;
- observações;
- acessibilidade;
- crianças quando relevante;
- restrições/alergias;
- consumo mínimo;
- caução/sinal;
- status.

---

# 41. CAPACIDADE

Configurar:

- salão;
- mesas;
- áreas;
- capacidade por evento;
- horários;
- bloqueios;
- buffer;
- manutenção.

Impedir overbooking.

---

# 42. JORNADA DE RESERVA

**descoberta → disponibilidade → seleção → pagamento/sinal se aplicável → confirmação → lembrete → check-in → consumo → fechamento → NPS.**

---

# 43. MÓDULO DE EVENTOS

Usar módulo Full de eventos para:

- criação;
- capacidade;
- ingresso/reserva;
- lote;
- pagamento online;
- cupom;
- lista;
- QR;
- check-in;
- controle de acesso;
- pesquisa;
- NPS;
- relatório.

---

# 44. EVENTOS — TIPOS

- karaokê;
- stand-up/comédia;
- música;
- degustação;
- tap takeover;
- lançamento de cerveja;
- harmonização;
- campeonato/jogos;
- aniversário da casa;
- ações especiais.

---

# 45. EVENTO PAGO

Fluxo:

**evento → lote → checkout → pagamento → ingresso/QR → comunicação → check-in → consumo adicional → pós-evento.**

---

# 46. CHECK-IN

Suportar:

- QR;
- busca nominal;
- telefone;
- documento quando necessário;
- lista offline/contingência;
- registro de horário;
- reentrada quando permitida.

---

# 47. VOUCHERS

Motor universal de voucher:

- código;
- QR;
- valor fixo;
- percentual;
- produto;
- categoria;
- evento;
- consumo mínimo;
- data;
- horário;
- limite por CPF/telefone/conta;
- quantidade total;
- campanha;
- origem;
- status.

---

# 48. VOUCHERS — REGRAS

Suportar:

- primeira visita;
- aniversário;
- reativação;
- evento;
- parceria;
- influencer;
- indicação;
- campanha de mídia;
- clube;
- happy hour.

---

# 49. ANTIABUSO DE VOUCHER

Validar:

- uso único;
- limite;
- expiração;
- identidade;
- combinação permitida;
- tentativa duplicada;
- cancelamento.

---

# 50. CAMPANHAS

Criar campanhas por:

- e-mail;
- WhatsApp;
- push interno;
- social;
- QR físico;
- Google/Meta quando integrado.

---

# 51. SEGMENTAÇÃO DE CAMPANHA

Exemplos:

- fã de IPA;
- fã de Weiss;
- alto ticket;
- frequentador de almoço;
- noite;
- karaokê;
- comédia;
- aniversário;
- inativo 30/60/90 dias;
- promotor NPS;
- detrator recuperado;
- primeira visita;
- recorrente.

---

# 52. CAMPANHA DE REATIVAÇÃO

**inatividade → segmento → oferta/voucher → mensagem → visita → resgate → medir ROI.**

---

# 53. CAMPANHA DE ANIVERSÁRIO

Se consentido:

- detectar aniversário;
- convite;
- voucher;
- reserva;
- benefício;
- acompanhamento;
- medir conversão.

---

# 54. PROGRAMA DE INDICAÇÃO

Opcional:

- código/link;
- indicado;
- condição de conversão;
- benefício para indicador;
- benefício para indicado;
- anti-fraude;
- histórico.

---

# 55. CLUBE IMPULSIONANDO

Quando habilitado:

- reconhecer membro;
- benefício;
- desconto;
- acesso a evento;
- voucher;
- experiências especiais;
- tracking de uso.

---

# 56. NPS PÓS-VISITA

Pesquisa vinculada à comanda:

- recepção;
- atendimento;
- ambiente;
- diversão;
- música;
- comida;
- cerveja;
- drinks;
- tempo;
- preço percebido;
- NPS 0–10;
- sugestão aberta.

---

# 57. DETRATOR

NPS baixo:

- gerar ticket;
- alertar gestor;
- causa;
- contato;
- resolução;
- voucher de recuperação se política permitir;
- medir retorno.

---

# 58. PROMOTOR

NPS alto:

- agradecimento;
- convite para avaliação pública sem coerção;
- indicação;
- próxima programação;
- benefício opcional.

---

# 59. GOOGLE BUSINESS PROFILE / MAPS

Auditar e padronizar:

- nome;
- endereço;
- telefone;
- horário;
- fotos;
- cardápio;
- reservas;
- site;
- categorias;
- respostas a avaliações.

Resolver inconsistências de endereço antigo x atual.

---

# 60. SEO LOCAL

Otimizar para intenção real:

- boteco Grajaú;
- cerveja artesanal Grajaú;
- bar Grajaú;
- karaokê Grajaú;
- comida de boteco Grajaú;
- chope artesanal Grajaú;
- aniversário bar Grajaú;
- eventos Grajaú.

---

# 61. INSTAGRAM

Canal oficial conhecido: `@botecodoraoni`.

Integrar quando API permitir:

- direct;
- comentários;
- conteúdo;
- link para reservas/cardápio;
- campanhas;
- UTM;
- inbox unificado.

---

# 62. FACEBOOK

Presença histórica associada a `botecodoraoni`.

Auditar:

- página atual;
- endereço;
- horário;
- eventos;
- Messenger;
- avaliações;
- links.

---

# 63. YOUTUBE

Preservar valor histórico do canal Boteco do Raoni.

Possíveis usos:

- origem da marca;
- educação cervejeira;
- harmonização;
- bastidores;
- Shorts;
- eventos;
- playlists incorporadas no front.

---

# 64. TIKTOK

Auditar se existe perfil oficial.

Se não existir e a marca desejar:

- criar estratégia de conteúdo;
- humor;
- pratos;
- cerveja;
- bastidores;
- eventos;
- trends compatíveis com a personalidade.

Não inventar arroba.

---

# 65. UNTAPPD

Auditar perfil histórico `botecodoraoni` e possibilidades atuais de integração/link.

Usar como canal especializado de descoberta cervejeira quando fizer sentido.

---

# 66. DELIVERY

Auditar links atuais de:

- Rappi;
- Goomer;
- outros providers.

Mapear:

- cardápio;
- preço;
- disponibilidade;
- estoque;
- pedidos;
- conciliação.

---

# 67. OMNICHANNEL

Centralizar:

- site;
- chat;
- WhatsApp;
- Instagram;
- Facebook/Messenger;
- TikTok quando permitido;
- YouTube como conteúdo;
- Google Business;
- delivery;
- e-mail.

---

# 68. CHAT / IMPULSIONITO

Impulsionito contextualizado deve conseguir:

- informar taps;
- cardápio;
- programação;
- reserva;
- evento;
- voucher;
- horário;
- endereço;
- documento fiscal;
- histórico do cliente autenticado.

Nunca inventar dados objetivos.

---

# 69. TOM DO AGENTE

Pode responder com humor leve e natural.

Mas:

- alergênicos → precisão;
- pagamento → precisão;
- reserva → precisão;
- preço → precisão;
- disponibilidade → precisão;
- fiscal → precisão.

---

# 70. WHATSAPP

Fluxos:

- reserva;
- evento;
- confirmação;
- voucher;
- tap novidade;
- aniversário;
- pós-visita;
- NPS;
- reativação;
- suporte.

---

# 71. E-MAIL

Templates com identidade Raoni:

- boas-vindas;
- reserva;
- evento;
- ingresso;
- voucher;
- aniversário;
- novidades;
- pós-visita;
- NPS;
- documento fiscal;
- reativação.

---

# 72. TEMPLATE VISUAL

Usar logo oficial, azul acinzentado, branco, âmbar e ilustração editorial.

Não transformar e-mail transacional em peça carnavalesca; manter hierarquia e legibilidade.

---

# 73. N8N — PRINCÍPIO

Todo workflow só é ACTIVE após:

- publicação;
- ID real;
- credencial;
- trigger;
- logs;
- idempotência;
- retry;
- E2E.

---

# 74. N8N — NOVO CLIENTE

**primeira identificação → CRM → boas-vindas → segmentação → relacionamento.**

---

# 75. N8N — RESERVA

**solicitação → disponibilidade → sinal/pagamento → confirmação → lembrete → check-in → pós-visita.**

---

# 76. N8N — EVENTO

**evento → campanha → ingresso/reserva → pagamento → QR → check-in → NPS.**

---

# 77. N8N — VOUCHER

**campanha → voucher → envio → resgate → PDV → CRM → relatório.**

---

# 78. N8N — PÓS-CONSUMO

**fechamento → fiscal → pesquisa → NPS → ação.**

---

# 79. N8N — BARRIL

**saldo crítico → alerta → gerente/estoque → troca/reposição → atualização tap list.**

---

# 80. N8N — ESTOQUE

- mínimo;
- ruptura;
- perda;
- divergência;
- validade;
- reposição.

---

# 81. N8N — CLIENTE INATIVO

Segmentar por frequência e enviar ação relevante com limite de contato.

---

# 82. N8N — ANIVERSÁRIO

Consentimento → antecedência → convite → voucher → reserva → visita → ROI.

---

# 83. N8N — DETRATOR

NPS baixo → ticket → responsável → contato → resolução → acompanhamento.

---

# 84. N8N — PROMOTOR

NPS alto → agradecimento → avaliação/indicação → próxima experiência.

---

# 85. RH

Módulo:

- funcionários;
- função;
- escala;
- permissões;
- treinamento;
- documentos;
- metas;
- desempenho;
- acesso.

---

# 86. PAPÉIS

- direção;
- gerente;
- caixa;
- garçom;
- cozinha;
- bar/taps;
- estoque;
- financeiro;
- marketing;
- eventos;
- RH;
- contador;
- Master Impulsionando.

---

# 87. TREINAMENTO

Criar base de conhecimento para equipe:

- PDV;
- alergênicos;
- cervejas;
- harmonização;
- reservas;
- eventos;
- vouchers;
- atendimento;
- cancelamentos;
- segurança.

---

# 88. BI EXECUTIVO

Primeira tela:

- receita hoje;
- ticket médio;
- mesas;
- reservas;
- eventos;
- taps ativos;
- barris críticos;
- CMV;
- margem;
- perdas;
- NPS;
- recorrência;
- vouchers;
- campanhas;
- clientes novos.

---

# 89. BI DE TAPS

Por rótulo:

- ml vendidos;
- faturamento;
- margem;
- giro;
- duração do barril;
- perdas;
- horário de pico;
- perfil de consumidor.

---

# 90. BI DE GASTRONOMIA

Por item:

- quantidade;
- receita;
- CMV;
- margem;
- tempo;
- cancelamento;
- harmonização;
- avaliação.

---

# 91. BI DE CLIENTES

- frequência;
- ticket;
- LTV;
- recência;
- preferências;
- NPS;
- churn/inatividade;
- campanhas;
- vouchers;
- origem.

---

# 92. BI DE EVENTOS

- capacidade;
- inscritos;
- check-ins;
- no-show;
- receita ingresso;
- consumo médio;
- NPS;
- origem;
- ROI.

---

# 93. GROWTH

Medir:

- aquisição;
- ativação;
- primeira visita;
- frequência;
- retenção;
- reativação;
- indicação;
- LTV;
- CAC;
- ROAS;
- reserva;
- evento;
- voucher;
- NPS.

---

# 94. UTM

Persistir:

- source;
- medium;
- campaign;
- content;
- term;
- primeira origem;
- última origem;
- receita atribuída quando tecnicamente possível.

---

# 95. QR CODES FÍSICOS

Usos:

- cardápio;
- taps;
- identificar mesa;
- cadastro;
- clube;
- NPS;
- evento;
- voucher;
- Wi-Fi/landing quando apropriado.

---

# 96. SEGURANÇA

Obrigatório:

- RLS;
- RBAC;
- tenant isolation;
- MFA para gestão;
- Vault;
- logs;
- auditoria;
- backup;
- restore test;
- rate limiting;
- proteção de API;
- sessão segura;
- LGPD.

---

# 97. PRIVACIDADE

Minimizar dados.

Separar:

- consentimento transacional;
- marketing;
- preferências;
- aniversário;
- profiling.

Permitir opt-out.

---

# 98. ACESSIBILIDADE

- WCAG AA;
- contraste;
- teclado;
- labels;
- cardápio legível;
- alternativas textuais;
- alergênicos visíveis;
- mobile.

---

# 99. TESTE E2E — TAP

Cadastrar barril 30/40/50L → conectar tap → vender 300ml/500ml → baixa → perda → alerta → troca → histórico.

---

# 100. TESTE E2E — COMANDA

**mesa → cliente → cerveja → prato → KDS → fechamento → voucher/desconto → pagamento → fiscal → CRM → NPS.**

---

# 101. TESTE E2E — RESERVA

**site/WhatsApp → disponibilidade → reserva → sinal → confirmação → check-in → consumo → fechamento → NPS.**

---

# 102. TESTE E2E — EVENTO

**evento pago → lote → checkout → pagamento → QR → check-in → consumo → pós-evento → NPS → relatório.**

---

# 103. TESTE E2E — VOUCHER

Criar voucher → segmentar → enviar → abrir → validar → resgatar no PDV → bloquear segundo uso → atribuir receita.

---

# 104. TESTE E2E — CLIENTE RECORRENTE

Primeira visita → cadastro → preferência → segunda visita → reconhecimento → oferta relevante → histórico consolidado.

---

# 105. TESTE E2E — FISCAL

Fechamento → documento fiscal → área do cliente → ERP → contador → conciliação.

---

# 106. TESTE E2E — DETRATOR

NPS 4 → ticket → gestor → contato → solução → voucher opcional → nova visita → medir recuperação.

---

# 107. TESTE E2E — ANIVERSÁRIO

Data consentida → mensagem → voucher → reserva → uso → evento/visita → ROI.

---

# 108. TESTE — OMNICHANNEL

Mensagem Instagram/WhatsApp/chat → identificação → CRM → resposta → handoff → histórico único quando identidade puder ser reconciliada legitimamente.

---

# 109. TESTE — PERMISSÕES

Garçom tenta financeiro → NEGADO.  
Cozinha tenta editar voucher → NEGADO.  
Marketing tenta editar caixa → NEGADO.  
Eventos tenta estoque crítico sem permissão → NEGADO.  
Cliente A tenta comanda B → NEGADO.  
Contador tenta CRM detalhado → NEGADO.  
Master autorizado → PERMITIDO/AUDITADO.

---

# 110. TESTE — PUBLICAÇÃO

Validar:

- branch correta;
- commit;
- build;
- deploy;
- SHA servido;
- `raoni.impulsionando.com.br`;
- cache;
- logo;
- home;
- cardápio;
- taps;
- reservas;
- eventos;
- login;
- área do cliente;
- PDV;
- dashboards;
- mobile.

---

# 111. ZERO MOCK

Produção não pode usar:

- tap fictício;
- prato fake;
- preço fictício;
- evento mock;
- voucher falso;
- estoque estático;
- dashboard inventado;
- reviews falsos.

---

# 112. NAP / LOCAL SEO — P0 DE CONTEÚDO

Como existem referências públicas divergentes de endereço histórico e atual, o programador/gestão deve confirmar antes da publicação:

- nome oficial;
- endereço atual;
- telefone;
- horários;
- links de delivery;
- canais oficiais.

Depois padronizar front + Google + schema.org + redes.

---

# 113. COMITÊ MULTIESPECIALISTA

Revisar com perspectivas de:

- arquitetura;
- backend;
- frontend;
- DevOps;
- banco;
- segurança;
- UX/UI;
- design instrucional;
- branding;
- copywriting;
- gestão de bares;
- gastronomia;
- cerveja artesanal;
- PDV;
- estoque;
- eventos;
- CRM;
- CX;
- growth;
- financeiro;
- fiscal;
- RH;
- automação;
- SEO local;
- social media;
- LGPD.

---

# 114. ANÁLISE CRÍTICA OBRIGATÓRIA

Para cada módulo responder:

1. existe?;
2. funciona?;
3. usa dado real?;
4. tem UX coerente com a marca?;
5. está duplicado?;
6. pertence ao Core?;
7. falta integração?;
8. falta automação?;
9. falta teste?;
10. risco?;
11. prioridade?;
12. prova de funcionamento?

---

# 115. PRIORIDADES

- P0: segurança, fiscal incorreto, estoque/barril errado, pagamento duplicado, tenant isolation;
- P1: PDV, reserva, evento, taps, estoque, publicação, fiscal, CRM crítico;
- P2: campanhas/vouchers/BI incompletos;
- P3: UX/growth/SEO;
- P4: otimização.

---

# 116. CRITÉRIO DE GO-LIVE

Somente considerar pronto quando:

- logo/branding PASS;
- front PASS;
- NAP PASS;
- taps PASS;
- estoque por ml PASS;
- cardápio PASS;
- PDV PASS;
- KDS PASS;
- comandas PASS;
- reservas PASS;
- eventos PASS;
- pagamento online PASS;
- QR/check-in PASS;
- vouchers PASS;
- CRM PASS;
- ERP PASS;
- financeiro PASS;
- fiscal PASS;
- área do cliente PASS;
- NPS PASS;
- campanhas PASS;
- N8N crítico PASS;
- BI PASS;
- omnichannel PASS;
- RBAC/RLS PASS;
- publicação PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 117. ACEITE POR PERSONA

**Cliente novo:** entendo rapidamente o espírito da casa e consigo decidir ir?  
**Cliente recorrente:** vejo histórico, benefícios, reservas e programação?  
**Cliente de evento:** compro/reservo e entro por QR sem atrito?  
**Garçom:** opero uma comanda em poucos toques?  
**Cozinha:** recebo pedido correto e alergênicos destacados?  
**Bar:** sei quais taps/barris estão ativos e quanto resta?  
**Gerente:** sei o que exige atenção agora?  
**Marketing:** segmento clientes, crio voucher e meço resultado?  
**Eventos:** controlo capacidade, pagamento e check-in?  
**Financeiro:** concilio caixa, reservas, eventos e pagamentos?  
**Raoni/direção:** enxergo operação, margem, público e experiência em minutos?  
**Master Impulsionando:** audito tudo sem romper isolamento?

---

# 118. RESULTADO FINAL ESPERADO

O Boteco do Raoni deve operar como um ecossistema único:

**GOOGLE/REDES/CONTEÚDO → FRONT → TAPS/CARDÁPIO/PROGRAMAÇÃO → RESERVA/EVENTO → CRM → PDV → COMANDA → KDS/BAR → ESTOQUE → PAGAMENTO → FISCAL → ERP → ÁREA DO CLIENTE → NPS → CAMPANHAS/VOUCHERS → RETENÇÃO → BI.**

A experiência deve ser reconhecível como Raoni em cada detalhe, sem sacrificar usabilidade.

---

# 119. PRINCÍPIO DE CORE

Universalizar no Core:

- PDV;
- comandas;
- KDS;
- taps;
- estoque por ml;
- ficha técnica;
- reservas;
- eventos;
- ingresso;
- QR/check-in;
- vouchers;
- CRM;
- ERP;
- fiscal;
- NPS;
- campanhas;
- mensageria;
- N8N;
- BI;
- segurança.

Manter no tenant:

- logo;
- branding;
- linguagem;
- cardápio;
- taps/rótulos;
- preços;
- eventos;
- dados;
- regras da casa;
- conteúdo.

---

# 120. REGRA FINAL AO PROGRAMADOR

Não transformar o Boteco do Raoni em um “template de bar”.

O Core deve ser universal; a experiência deve ser profundamente específica.

Cada tela deve equilibrar:

**humor + clareza + velocidade + dados reais + personalidade.**

Se o sistema estiver tecnicamente correto, mas parecer um bar genérico, está incompleto.

Se estiver divertido, mas dificultar operação, está incompleto.

O objetivo é entregar um **Boteco do Raoni digital tão reconhecível quanto o físico, e uma operação muito mais inteligente por trás.**

---

**STATUS:** PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** CAUÃ / K1 / PROGRAMADOR  
**SUBDOMÍNIO:** `raoni.impulsionando.com.br`  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**