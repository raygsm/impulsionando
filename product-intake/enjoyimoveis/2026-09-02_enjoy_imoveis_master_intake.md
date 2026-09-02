# SUPERPROMPT MESTRE — PRODUCT INTAKE — ENJOY IMÓVEIS

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / programador  
**TENANT:** Enjoy Imóveis / Lopes Enjoy Imóveis  
**SUBDOMÍNIO CANÔNICO:** `https://enjoyimoveis.impulsionando.com.br`  
**PLANO:** FULL  
**VERTICAL:** IMOBILIÁRIA / PROPTECH / CRM IMOBILIÁRIO / ERP / PORTAL DE IMÓVEIS  

> NÃO EXECUTAR CÓDIGO, DEPLOY, BANCO, N8N, CREDENCIAIS OU PRODUÇÃO A PARTIR DESTE DOCUMENTO. Este arquivo é especificação de produto para implementação e testes posteriores pelo programador.

---

# 1. OBJETIVO

Criar a primeira vertical imobiliária completa do Ecossistema Impulsionando usando a Lopes Enjoy Imóveis como tenant real e referência funcional/visual, preservando sua identidade e conteúdo público autorizado e construindo uma experiência significativamente mais completa do que um portal imobiliário tradicional.

A plataforma deve combinar:

**PORTAL → BUSCA → IA → CRM → CORRETORES → PROPRIETÁRIOS → CAPTAÇÃO → VISITAS → PROPOSTAS → DOCUMENTOS → CONTRATOS → FINANCIAMENTO → PÓS-VENDA → BI → AUTOMAÇÕES → RELACIONAMENTO.**

---

# 2. REGRA DE REFERÊNCIA AO SITE ATUAL

Usar `enjoyimoveis.com.br` como fonte primária para identidade, estrutura pública, posicionamento, portfólio, conteúdo institucional, unidades, canais, produtos e recursos existentes.

Não copiar conteúdo protegido de terceiros além do que a própria Enjoy tenha direito de reutilizar. Na implementação, importar/reutilizar dados e ativos somente por API, feed, banco, integração ou autorização válida.

Não criar uma base paralela desatualizada de imóveis.

---

# 3. ESTADO PÚBLICO OBSERVADO EM 02/09/2026

A pesquisa pública identificou:

- marca pública: **Lopes Enjoy Imóveis**;
- atuação em venda e locação residencial;
- mais de 8 anos de mercado informados no site;
- portfólio público atual com milhares de imóveis;
- presença forte em Barra da Tijuca, Recreio, Grande Tijuca e Zona Sul;
- divisão de alto padrão `Lopes Enjoy Luxury`;
- busca com inteligência artificial;
- filtros avançados;
- mapa interativo;
- favoritos/comparador divulgados publicamente;
- avaliação de imóvel divulgada publicamente;
- calculadora de ITBI divulgada publicamente;
- atendimento com corretor dedicado;
- segurança jurídica comunicada publicamente;
- CRECI público: CJ7780;
- LinkedIn público da Lopes Enjoy;
- site/blog com conteúdo editorial imobiliário.

Validar novamente antes do go-live.

---

# 4. CANAIS PÚBLICOS OBSERVADOS

Validar antes da publicação:

- Vendas/WhatsApp: `(21) 3434-9022`;
- Administrativo: `(21) 3434-9000`;
- e-mail: `contato@enjoyimoveis.com.br`;
- LinkedIn: Lopes Enjoy Imóveis;
- site oficial: `enjoyimoveis.com.br`.

Pesquisar e confirmar URLs oficiais de Instagram, Facebook, YouTube, TikTok e demais canais antes de conectar ou publicar. Não inferir handle sem confirmação.

---

# 5. UNIDADES PÚBLICAS OBSERVADAS

O site atual informa quatro filiais e atendimento online 24h. Entre os endereços públicos observados:

- Recreio (Matriz): Av. Glaucio Gil, 958 — Loja;
- Barra da Tijuca: Av. das Américas, 3434 — Bloco 2, Sala 204 — CEMHS;
- Zona Sul: Rua Visconde de Pirajá, 351 — Sala 1209;
- Grajaú: Rua Borda do Mato, 4.

Validar endereço, telefone e status de cada unidade antes do go-live, pois fontes sociais históricas podem divergir.

---

# 6. BENCHMARK COMPETITIVO

Comparar continuamente com players de referência do Rio e portais/proptechs nacionais.

Benchmark público analisado inclui Judice & Araujo e Recreio Imóveis, além dos próprios recursos atuais da Lopes Enjoy.

Incorporar as melhores práticas observadas sem copiar identidade/conteúdo de concorrentes:

- curadoria de imóveis especiais;
- lançamentos;
- busca rápida;
- filtros ricos;
- mapa;
- conteúdo de bairro;
- avaliação de imóvel;
- captação de proprietário;
- gestão de ativos;
- prova social;
- conteúdo editorial;
- newsletter;
- atendimento especializado;
- experiência premium para alto padrão.

O objetivo não é imitar concorrente: é superar a experiência usando o Core Full Impulsionando.

---

# 7. HOME — PRINCÍPIO

A home canônica é:

`https://enjoyimoveis.impulsionando.com.br`

Nunca:

`enjoyimoveis.impulsionando.com.br/enjoyimoveis`

O hostname resolve o tenant e `/` é a home.

---

# 8. FRONT — DIREÇÃO DE UX/UI

Preservar a identidade visual oficial da Enjoy/Lopes Enjoy observada em ativos autorizados do cliente.

O front deve transmitir:

- credibilidade;
- grande inventário;
- inteligência;
- segurança jurídica;
- velocidade;
- atendimento humano;
- conhecimento regional;
- alto padrão quando pertinente;
- facilidade de decisão.

Não substituir a marca por visual genérico de SaaS ou template imobiliário.

---

# 9. HERO

Hero orientado à intenção, não apenas institucional.

CTAs prioritários:

- `Comprar imóvel`;
- `Alugar imóvel`;
- `Lançamentos`;
- `Avaliar meu imóvel`;
- `Quero vender meu imóvel`;
- `Falar com especialista`.

Busca principal deve aceitar linguagem natural e filtros tradicionais.

Exemplo de intenção:

“Quero apartamento de 3 quartos no Jardim Oceânico até R$ 2 milhões, perto do metrô.”

---

# 10. BUSCA IMOBILIÁRIA

Filtros mínimos:

- operação;
- tipo;
- bairro;
- condomínio;
- endereço/região;
- código;
- faixa de preço;
- quartos;
- suítes;
- banheiros;
- vagas;
- área útil;
- área total;
- condomínio;
- IPTU;
- mobiliado;
- pet;
- piscina;
- varanda;
- vista;
- andar;
- elevador;
- acessibilidade;
- lançamento/pronto;
- exclusividade;
- oportunidade;
- alto padrão;
- financiamento;
- características específicas cadastradas.

---

# 11. BUSCA POR IA

Busca semântica deve transformar linguagem natural em filtros verificáveis.

A IA nunca deve inventar imóvel.

Fluxo:

`intenção → extração de critérios → consulta inventário real → ranking → explicação → refinamento → lead/visita`.

---

# 12. MAPA INTERATIVO

Exibir imóveis por mapa com:

- clusters;
- preço;
- região;
- raio;
- desenho de área quando suportado;
- sincronização mapa/lista;
- privacidade para endereços que não podem ser públicos.

---

# 13. PÁGINA DO IMÓVEL

Deve incluir:

- galeria premium;
- vídeo;
- tour 360 quando disponível;
- planta;
- preço;
- condomínio/IPTU;
- preço/m²;
- código;
- características;
- descrição;
- localização aproximada/exata conforme política;
- condomínio;
- infraestrutura;
- corretor responsável;
- similares;
- favoritos;
- comparar;
- compartilhar;
- agendar visita;
- WhatsApp;
- proposta;
- financiamento;
- custos estimados;
- CTA persistente mobile.

---

# 14. FAVORITOS

Usuário pode favoritar anonimamente com storage temporário e consolidar após login, respeitando consentimento.

CRM deve interpretar favoritos como sinal de intenção, sem assumir compra.

---

# 15. COMPARADOR

Comparar imóveis lado a lado:

- preço;
- preço/m²;
- área;
- quartos;
- suítes;
- vagas;
- condomínio;
- IPTU;
- diferenciais;
- localização;
- distância de pontos relevantes;
- custos estimados.

---

# 16. SIMILARES / RECOMENDAÇÃO

Motor de recomendação baseado em critérios reais e comportamento consentido.

Explicar por que um imóvel foi recomendado.

---

# 17. CAPTAÇÃO DE LEADS

Captar por:

- imóvel;
- busca;
- bairro;
- empreendimento;
- anúncio;
- landing page;
- WhatsApp;
- redes sociais;
- telefone;
- formulário;
- evento/open house;
- QR;
- indicação;
- proprietário;
- financiamento.

Sempre preservar origem/UTM/campanha.

---

# 18. CRM IMOBILIÁRIO

Pipeline configurável:

`NOVO → QUALIFICANDO → PERFIL DEFINIDO → IMÓVEIS ENVIADOS → VISITA AGENDADA → VISITA REALIZADA → PROPOSTA → NEGOCIAÇÃO → DOCUMENTAÇÃO → FINANCIAMENTO → CONTRATO → FECHADO GANHO/PERDIDO → PÓS-VENDA`.

---

# 19. LEAD SCORING

Pontuar por sinais:

- imóveis visualizados;
- favoritos;
- comparação;
- retorno ao site;
- faixa de preço;
- urgência;
- financiamento;
- visita;
- resposta a corretor;
- abertura/click de campanha;
- proposta.

Score é apoio comercial, não verdade absoluta.

---

# 20. ROTEAMENTO DE LEADS

Distribuição por:

- unidade;
- bairro;
- produto;
- corretor;
- escala;
- disponibilidade;
- origem;
- especialidade;
- alto padrão;
- locação/venda;
- round-robin;
- performance com governança.

Registrar aceite, tempo de primeira resposta e redistribuição.

---

# 21. SLA DE LEAD

Dashboard deve medir:

- tempo até primeiro contato;
- lead sem atendimento;
- follow-up vencido;
- visita pendente;
- proposta sem retorno.

Alertar gestor antes da perda.

---

# 22. ÁREA DO CORRETOR

Cada corretor autorizado deve ter:

- leads;
- agenda;
- tarefas;
- imóveis;
- favoritos do cliente quando permitido;
- visitas;
- propostas;
- documentos;
- funil;
- metas;
- comissões;
- ranking/indicadores com política justa;
- materiais de divulgação;
- agente virtual especializado.

---

# 23. AGENDA / VISITAS

Fluxo:

`imóvel → cliente → corretor → disponibilidade → visita → confirmação → lembretes → check-in → feedback → próximo passo`.

Suportar reagendamento, cancelamento, no-show e visitas múltiplas.

---

# 24. CHECK-IN DE VISITA

Check-in por QR/dashboard/corretor conforme política.

Registrar presença sem rastreamento excessivo.

---

# 25. FEEDBACK PÓS-VISITA

Perguntar:

- interesse;
- aderência;
- preço percebido;
- localização;
- pontos positivos;
- objeções;
- próxima ação.

Gerar tarefas e recomendações.

---

# 26. PROPOSTAS

Criar fluxo de proposta com:

- valor;
- condições;
- entrada;
- financiamento;
- prazo;
- observações;
- anexos;
- contraproposta;
- histórico;
- validade;
- aceite eletrônico quando juridicamente aplicável.

---

# 27. DOCUMENTAÇÃO

Checklist configurável por operação e perfil.

Nunca tratar checklist como parecer jurídico automático.

Controle de:

- recebido;
- pendente;
- inválido;
- expirado;
- aprovado;
- observação;
- responsável.

---

# 28. ASSINATURA ELETRÔNICA

Integrar provedor homologado para contratos/termos quando aplicável.

Audit trail obrigatório.

---

# 29. SEGURANÇA JURÍDICA

A Lopes Enjoy comunica publicamente validação jurídica das negociações. O sistema deve suportar workflow jurídico real:

`documentos → revisão → pendências → aprovação → contrato → assinatura → registro de evidências`.

IA pode resumir/checklistar; decisão jurídica continua humana.

---

# 30. FINANCIAMENTO

Módulo para:

- intenção de financiamento;
- simulação indicativa;
- parceiros;
- documentação;
- status;
- propostas;
- aprovação;
- pendências;
- integração por API quando disponível.

Não apresentar taxa estimada como oferta garantida.

---

# 31. CALCULADORA DE ITBI E CUSTOS

Preservar/superar o recurso público divulgado pela Enjoy.

Calcular de forma parametrizada e com aviso de caráter estimativo quando necessário:

- ITBI;
- escritura;
- registro;
- financiamento;
- outros custos configurados.

Regras devem ser versionadas e atualizáveis.

---

# 32. AVALIAÇÃO DE IMÓVEL

Fluxo proprietário:

`endereço → tipo → área → quartos → estado → diferenciais → fotos → contato → estimativa/triagem → corretor/avaliador → laudo/proposta de captação`.

Nunca apresentar AVM automático como avaliação profissional definitiva.

---

# 33. AVM / INTELIGÊNCIA DE PREÇO

Quando houver dados suficientes:

- comparáveis;
- preço/m²;
- faixa estimada;
- liquidez;
- histórico;
- confiança da estimativa.

Mostrar metodologia/limitação.

---

# 34. PORTAL DO PROPRIETÁRIO

Proprietário autenticado pode acompanhar:

- imóvel;
- publicação;
- visualizações;
- leads agregados;
- visitas;
- propostas;
- feedbacks apropriados;
- documentos;
- contratos;
- financeiro de locação quando aplicável;
- manutenção quando aplicável.

Não revelar dados pessoais de interessados indevidamente.

---

# 35. CAPTAÇÃO DE IMÓVEL

Pipeline:

`lead proprietário → avaliação → documentação → visita técnica → autorização → fotos/mídia → cadastro → revisão → publicação → portais → leads → negociação`.

---

# 36. CADASTRO ÚNICO DO IMÓVEL

Master record com:

- identificador;
- proprietário;
- endereço;
- geolocalização;
- características;
- preço;
- despesas;
- mídia;
- documentos;
- status;
- exclusividade;
- corretor;
- unidade;
- origem;
- publicação;
- histórico de alterações.

---

# 37. QUALIDADE DE CADASTRO

Score de completude:

- fotos;
- descrição;
- preço;
- área;
- quartos;
- condomínio/IPTU;
- localização;
- documentos;
- vídeo;
- planta.

Alertar cadastros fracos.

---

# 38. MÍDIA DO IMÓVEL

Gerenciar:

- fotos;
- vídeos;
- drone quando autorizado;
- 360;
- plantas;
- capa;
- ordem;
- watermark quando aplicável;
- direitos de uso.

---

# 39. DESCRIÇÃO ASSISTIDA POR IA

Agente pode sugerir descrição a partir de dados reais, mas:

- não inventar vista;
- não inventar metragem;
- não inventar benfeitoria;
- não inventar proximidade;
- revisão humana antes de publicar quando política exigir.

---

# 40. DISTRIBUIÇÃO PARA PORTAIS

Preparar arquitetura para feeds/APIs de portais autorizados.

Controle por imóvel/canal:

- publicado;
- rejeitado;
- erro;
- atualizado;
- removido;
- leads recebidos.

---

# 41. DEDUPLICAÇÃO

Detectar possível imóvel duplicado por endereço, unidade, características, proprietário e mídia sem fundir automaticamente casos ambíguos.

---

# 42. LOCAÇÃO

Módulo completo para:

- lead;
- visita;
- proposta;
- análise cadastral por parceiro autorizado;
- garantia;
- contrato;
- vistoria;
- entrega de chaves;
- cobrança;
- reajuste;
- renovação;
- manutenção;
- encerramento.

---

# 43. ADMINISTRAÇÃO DE LOCAÇÃO

Quando contratado:

- carteira;
- repasses;
- cobranças;
- inadimplência;
- proprietários;
- inquilinos;
- contratos;
- reajustes;
- chamados/manutenção;
- demonstrativos.

---

# 44. GESTÃO DE ATIVOS

Inspirar-se nas melhores práticas do mercado premium:

- rentabilidade;
- vacância;
- valorização;
- despesas;
- manutenção;
- estratégia de locação/venda;
- relatórios ao proprietário.

---

# 45. VISTORIA

Checklist mobile com:

- cômodos;
- itens;
- fotos;
- vídeos;
- observações;
- assinatura;
- data/hora;
- comparação entrada/saída.

---

# 46. MANUTENÇÃO

Ticket por imóvel:

- categoria;
- urgência;
- fotos;
- orçamento;
- autorização;
- fornecedor;
- execução;
- comprovante;
- avaliação.

---

# 47. FINANCEIRO / ERP

Plano Full deve incluir ERP integrado:

- contas a pagar;
- contas a receber;
- comissões;
- repasses;
- centros de custo;
- unidades;
- conciliação;
- fluxo de caixa;
- DRE gerencial;
- orçamento;
- inadimplência;
- documentos;
- exportação contábil.

---

# 48. COMISSÕES

Motor parametrizável:

- corretor;
- captador;
- gerente;
- unidade;
- parceria;
- indicação;
- split;
- condição de pagamento;
- estorno;
- aprovação.

Nunca hard-code percentual universal.

---

# 49. FISCAL

Integrar emissão/documentação fiscal apenas conforme regime e provider homologado.

Registrar status e conciliar com financeiro.

---

# 50. DASHBOARD EXECUTIVO

KPIs:

- leads;
- leads por origem;
- SLA;
- visitas;
- propostas;
- conversão;
- VGV;
- receita;
- comissão;
- captações;
- imóveis ativos;
- exclusividades;
- tempo de estoque;
- redução de preço;
- vendas por bairro;
- vendas por unidade;
- vendas por corretor;
- CAC quando disponível;
- ROI de mídia;
- locações;
- vacância;
- churn de administração.

---

# 51. FUNIL POR UNIDADE

Comparar unidades sem misturar permissões indevidas.

Gestão master pode consolidar conforme RBAC.

---

# 52. INTELIGÊNCIA DE ESTOQUE

Classificar:

- novo;
- aquecido;
- parado;
- preço competitivo;
- possível sobrepreço;
- alta procura;
- baixa procura;
- precisa de mídia;
- precisa de revisão.

Sempre explicar evidência.

---

# 53. INTELIGÊNCIA DE MERCADO

Por bairro/condomínio:

- preço/m²;
- oferta;
- velocidade;
- ticket;
- tipos;
- histórico interno;
- tendências.

Separar dado interno de fonte externa.

---

# 54. PÁGINAS DE BAIRRO

SEO programático editorialmente governado para bairros reais, com:

- imóveis;
- perfil;
- infraestrutura;
- mobilidade;
- estilo de vida;
- preço/m² quando fundamentado;
- conteúdo;
- CTA.

Não gerar texto genérico em massa sem revisão/qualidade.

---

# 55. PÁGINAS DE CONDOMÍNIO

Inventário, características, localização, faixa de preço baseada em dados, imóveis disponíveis e alertas.

---

# 56. LANÇAMENTOS

Página dedicada:

- incorporadora;
- estágio;
- previsão;
- plantas;
- unidades/faixas quando autorizadas;
- materiais;
- localização;
- condições;
- corretor;
- cadastro de interesse.

---

# 57. ALTO PADRÃO / LUXURY

Preservar a estratégia pública Lopes Enjoy Luxury e criar experiência editorial premium quando aplicável:

- curadoria;
- mídia de alta qualidade;
- privacidade;
- atendimento especializado;
- imóveis off-market sob autorização;
- lead qualification apropriada.

---

# 58. OPEN HOUSE / EVENTOS

Módulo de eventos:

- imóvel;
- slots;
- convite;
- RSVP;
- QR/check-in;
- corretor;
- follow-up;
- feedback;
- conversão.

---

# 59. CONTEÚDO / BLOG

Importar/integrar conteúdo autorizado existente e manter CMS para:

- bairros;
- compra;
- venda;
- aluguel;
- investimento;
- documentação;
- financiamento;
- tendências;
- decoração;
- mercado.

---

# 60. NEWSLETTER

Segmentada por intenção e consentimento.

Não enviar o mesmo conteúdo para toda a base cegamente.

---

# 61. CRM 360º

Pessoa pode assumir papéis múltiplos:

- comprador;
- vendedor;
- proprietário;
- locador;
- locatário;
- investidor;
- corretor/parceiro;
- indicado.

Evitar cadastros duplicados.

---

# 62. N8N

Orquestrar jornadas event-driven:

`evento → tenant/contact/property → estado da jornada → consentimento → ação → CRM → próxima ação`.

Idempotência obrigatória.

---

# 63. JORNADA NOVO LEAD

`lead → confirmação → roteamento → SLA → corretor → qualificação → imóveis → interação → visita → follow-up`.

---

# 64. JORNADA IMÓVEL FAVORITADO

Favorito é sinal, não autorização para spam.

Pode gerar tarefa/recomendação conforme consentimento e cooldown.

---

# 65. JORNADA IMÓVEL COM PREÇO ALTERADO

Usuários interessados podem receber alerta se optaram por esse tipo de comunicação.

---

# 66. JORNADA NOVO IMÓVEL COMPATÍVEL

Matching com preferências salvas e consentimento.

---

# 67. JORNADA PROPRIETÁRIO

`avaliação → contato → visita técnica → proposta de captação → autorização → cadastro → publicação → relatórios → propostas`.

---

# 68. JORNADA PÓS-VENDA

`contrato → documentação → financiamento/registro → entrega de chaves → satisfação → indicação → relacionamento`.

---

# 69. NPS / CSAT

Medir por etapas:

- atendimento;
- visita;
- fechamento;
- pós-venda;
- locação/manutenção.

Detrator gera alerta/ticket.

---

# 70. INDICAÇÕES

Programa rastreável de indicação quando juridicamente/comercialmente aprovado.

---

# 71. WHATSAPP

Integração oficial/autorizada:

- lead;
- imóvel;
- visita;
- lembrete;
- proposta;
- documentos;
- pós-venda;
- suporte.

Templates e consentimento conforme regras do canal.

---

# 72. E-MAIL

Templates versionados para todas as etapas relevantes, com opt-out quando aplicável.

---

# 73. TELEFONIA

Registrar chamadas/metadados apenas com provider e base legal adequados.

Click-to-call no CRM.

---

# 74. REDES SOCIAIS

Conectar somente APIs oficiais/autorizadas.

Recursos desejáveis:

- publicar imóvel/conteúdo;
- captar leads;
- atribuição;
- inbox quando permitido;
- campanhas;
- métricas.

---

# 75. GOOGLE / META ADS

Integração para:

- pixels/tags consentidos;
- conversões;
- UTMs;
- campanhas;
- lead source;
- ROI;
- catálogo/feed quando homologado.

---

# 76. SEO TÉCNICO

- canonical;
- sitemap;
- robots;
- schema.org pertinente;
- breadcrumbs;
- URLs limpas;
- performance;
- Core Web Vitals;
- imagens otimizadas;
- SSR/prerender quando arquitetura permitir.

---

# 77. LGPD

Dados imobiliários e pessoais exigem:

- finalidade;
- consentimento quando aplicável;
- direitos do titular;
- retenção;
- minimização;
- acesso por perfil;
- auditoria;
- opt-out;
- política de privacidade;
- gestão de cookies.

---

# 78. RBAC

Perfis mínimos:

- master Impulsionando;
- admin Enjoy;
- diretoria;
- gerente de unidade;
- corretor;
- captador;
- jurídico;
- financeiro;
- marketing;
- atendimento;
- proprietário;
- cliente.

---

# 79. RLS / TENANT ISOLATION

Nenhum dado Enjoy pode vazar para outro tenant Impulsionando e vice-versa.

---

# 80. AUDITORIA

Auditar:

- lead;
- propriedade;
- preço;
- proposta;
- contrato;
- comissão;
- permissão;
- exportação;
- documento;
- login;
- ações críticas do agente.

---

# 81. AGENTE VIRTUAL ESPECIALIZADO

Enjoy deve possuir agente próprio, instância especializada do Impulsionito.

**O nome oficial ainda não foi definido neste Intake. Não inventar nome em produção.**

O Impulsionito permanece orquestrador interno e não deve aparecer como identidade visível do tenant.

Quando o nome for definido, substituir a identidade visível em todos os canais.

---

# 82. AGENTE COMO CÉREBRO VIVO

O agente Enjoy deve entender:

- inventário;
- bairros;
- perfil do cliente;
- favoritos;
- visitas;
- corretores;
- documentação;
- financiamento;
- proprietário;
- CRM;
- BI;
- suporte.

Não ser apenas chatbot.

---

# 83. AGENTE PARA COMPRADOR

Exemplo:

“Quero morar no Recreio, 3 quartos, até R$ 1,2 milhão, 2 vagas e perto da praia.”

Agente → critérios → inventário real → opções → comparação → visita.

---

# 84. AGENTE PARA INVESTIDOR

Pode comparar imóveis com métricas disponíveis, mas não prometer rentabilidade futura.

---

# 85. AGENTE PARA PROPRIETÁRIO

Explicar captação, avaliação, documentação, divulgação e acompanhar status autenticado.

---

# 86. AGENTE PARA CORRETOR

Conforme RBAC:

- agenda;
- leads;
- follow-ups;
- imóvel;
- documentação;
- metas;
- BI;
- tarefas.

---

# 87. AGENTE PARA GESTÃO

Perguntas em linguagem natural:

- “quantos leads sem contato?”;
- “qual unidade converte mais?”;
- “quais imóveis estão parados?”;
- “quanto VGV temos em negociação?”;
- “quais visitas de hoje?”

Responder com dados reais/período/fonte.

---

# 88. OPENAI

Após definição do nome oficial, criar chave própria do agente Enjoy dentro do projeto/conta OpenAI Impulsionando conforme padrão global.

Secret no Vault; nunca frontend/GitHub/log.

---

# 89. SUPORTE / TICKETS

Core de tickets para:

- cliente;
- proprietário;
- corretor;
- operação;
- tecnologia;
- manutenção.

SLA conforme política configurada.

---

# 90. ÁREA DO CLIENTE

- perfil;
- buscas salvas;
- favoritos;
- comparações;
- visitas;
- propostas;
- documentos;
- financiamento;
- contratos;
- tickets;
- comunicações/preferences.

---

# 91. ÁREA DO PROPRIETÁRIO

Separada e segura, conforme seção específica.

---

# 92. ÁREA DE GESTÃO

Dashboard modular Full com CRM, ERP, imóveis, captação, corretores, agenda, propostas, documentos, jurídico, financeiro, marketing, N8N, canais, BI, tickets, permissões e configurações.

---

# 93. MULTIUNIDADE

Unidades devem possuir:

- metas;
- equipes;
- leads;
- imóveis;
- agenda;
- custos;
- receitas;
- indicadores;
- permissões.

Consolidação master controlada.

---

# 94. RECRUTAMENTO DE CORRETORES

A presença pública da empresa divulga recrutamento e grande força de corretores. Criar módulo opcional:

- candidatura;
- currículo;
- CRECI;
- região;
- experiência;
- entrevista;
- onboarding;
- treinamento;
- documentação;
- status.

---

# 95. TREINAMENTO

LMS leve/Core para:

- produto;
- bairros;
- compliance;
- atendimento;
- sistema;
- vendas;
- segurança;
- certificações internas.

---

# 96. METAS E PERFORMANCE

Metas por corretor/unidade/equipe com contexto e governança, sem gamificação tóxica.

---

# 97. ALERTAS

Alertas inteligentes:

- lead sem contato;
- visita hoje;
- documento vencendo;
- proposta expirando;
- imóvel sem atualização;
- imóvel parado;
- proprietário aguardando;
- comissão pendente;
- campanha com erro;
- integração quebrada.

---

# 98. IMPORTAÇÃO / INTEGRAÇÃO COM BASE ATUAL

Antes de qualquer migração, identificar o sistema atual/source of truth da Enjoy.

Preferência:

`API/feed/banco autorizado → staging → validação → dedupe → importação → reconciliação`.

Não fazer scraping como integração operacional permanente.

---

# 99. SINCRONIZAÇÃO

Se o sistema atual continuar ativo durante transição, definir source of truth e sincronização para impedir divergência de preço/status.

---

# 100. STATUS DE IMÓVEL

Estados configuráveis, no mínimo:

- rascunho;
- em revisão;
- ativo;
- reservado;
- proposta;
- vendido;
- alugado;
- suspenso;
- retirado;
- expirado.

---

# 101. GOVERNANÇA DE PREÇO

Toda alteração relevante registra autor, data, valor anterior, valor novo e motivo quando exigido.

---

# 102. DISPONIBILIDADE

Agente/front nunca oferecer imóvel vendido/retirado como disponível se source of truth já tiver atualizado o status.

---

# 103. PROVA SOCIAL

Exibir somente avaliações/depoimentos autorizados e verificáveis.

---

# 104. CREDIBILIDADE

Blocos de confiança podem usar, após validação:

- CRECI;
- anos de atuação;
- equipe;
- unidades;
- segurança jurídica;
- tecnologia;
- volume de inventário;
- atendimento humano;
- associação/rede Lopes quando autorizado pela marca.

---

# 105. CTA E CONVERSÃO

Cada página deve possuir próxima ação clara:

- buscar;
- favoritar;
- comparar;
- agendar;
- falar;
- avaliar;
- anunciar;
- propor;
- financiar.

Evitar páginas sem saída.

---

# 106. MOBILE FIRST

Busca, filtros, cards, mapa, WhatsApp, visita e agente precisam ser excelentes no celular.

---

# 107. ACESSIBILIDADE

WCAG como referência: teclado, contraste, labels, foco, alt text, formulários, feedback de erro.

---

# 108. PERFORMANCE

Lazy-load de mídia, CDN, thumbnails, cache, paginação/infinite loading responsável e observabilidade.

---

# 109. DISPONIBILIDADE / RESILIÊNCIA

Monitorar:

- front;
- API;
- banco;
- busca;
- integrações;
- WhatsApp;
- e-mail;
- OpenAI;
- feeds de imóveis.

---

# 110. BACKUP / RECOVERY

Backups e restore testado para dados críticos.

---

# 111. E2E — COMPRADOR

`home → busca IA/filtros → imóvel → favorito/comparador → lead → corretor → visita → check-in → feedback → proposta → documentos → contrato → pós-venda`.

---

# 112. E2E — PROPRIETÁRIO

`avaliar imóvel → lead → corretor → visita técnica → captação → cadastro → publicação → leads → visitas → proposta → fechamento → relatório`.

---

# 113. E2E — CORRETOR

`login → agente próprio → leads → aceitar → qualificar → enviar imóveis → visita → follow-up → proposta → documentação → fechamento → comissão`.

---

# 114. E2E — GESTOR

`login → dashboard → funil → unidade → corretor → estoque → campanha → financeiro → BI → alertas`.

---

# 115. E2E — LOCAÇÃO

`busca → lead → visita → proposta → análise → garantia → contrato → vistoria → chaves → cobrança → manutenção → encerramento`.

---

# 116. E2E — SEGURANÇA

- cliente A tenta documento de B → NEGADO;
- proprietário tenta lead pessoal de outro imóvel → NEGADO;
- corretor sem escopo tenta financeiro master → NEGADO;
- tenant externo tenta Enjoy → NEGADO;
- usuário tenta acessar secret OpenAI → NEGADO.

---

# 117. E2E — VERDADE DOS DADOS

Testar imóvel vendido, preço alterado, endereço privado, foto ausente, duplicidade e feed atrasado.

Sistema deve degradar com segurança, não inventar.

---

# 118. CRITÉRIO DE ACEITE DO FRONT

PASS quando:

- identidade oficial preservada;
- home no subdomínio raiz;
- busca real;
- mapa;
- cards;
- imóvel detalhado;
- CTAs reais;
- mobile;
- acessibilidade;
- SEO;
- canais oficiais;
- zero placeholder apresentado como real.

---

# 119. CRITÉRIO DE ACEITE FULL

PASS somente quando módulos contratados estiverem realmente integrados e testados, não apenas desenhados.

---

# 120. REGRA DE UNIVERSALIZAÇÃO

Tudo que for construído de forma genérica para a vertical imobiliária deve voltar ao Core como módulo parametrizável para futuras imobiliárias, sem vazar dados, marca ou regras específicas da Enjoy.

---

# 121. PRINCÍPIO FINAL

A primeira imobiliária da Impulsionando não deve ser apenas um novo site da Enjoy.

Deve ser um **sistema operacional imobiliário completo**, no qual o front é a porta de entrada de um organismo conectado a CRM, ERP, corretores, proprietários, imóveis, documentos, financeiro, marketing, canais, automações, BI e inteligência artificial.

**Se apenas listar imóveis, está incompleto.**  
**Se o CRM não souber o que o visitante fez, está incompleto.**  
**Se o corretor precisar reconstruir manualmente o contexto do lead, está incompleto.**  
**Se o proprietário não tiver transparência do processo, está incompleto.**  
**Se a IA recomendar imóvel inexistente, está errado.**  
**Se o agente não conseguir agir como cérebro vivo do negócio dentro das permissões, está incompleto.**

**STATUS: PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA PELO CAUÃ.**