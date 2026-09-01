# SUPERPROMPT MESTRE — PRODUCT INTAKE RIOMED

## RIO MED + MEDICITO + IMPULSIONITO — Plano Full, CRM, ERP, RH, vendedores, comissões, estoque, locação, venda, manutenção, catálogo, e-commerce, omnichannel, IA visual, SEO, N8N, BI, segurança e Go-Live

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / programador  
**TENANT:** RioMed Equipos Médicos S.R.L.  
**PAÍS/OPERAÇÃO PRINCIPAL:** Bolívia  
**IDIOMA PRINCIPAL:** es-BO, com suporte contextual a es e pt-BR  
**MOEDA PRINCIPAL:** BOB, mantendo arquitetura multimoeda  
**SUBDOMÍNIO CANÔNICO:** `riomed.impulsionando.com.br`  
**PLANO DE REFERÊNCIA:** Impulsionando Full  
**AGENTE CENTRAL:** Impulsionito  
**AGENTE ESPECIALIZADO:** MEDICITO

> **NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, FRONTEND, BACKEND, N8N, CREDENCIAIS, INFRAESTRUTURA OU PRODUÇÃO A PARTIR DESTE REGISTRO.** Este documento existe exclusivamente como Product Intake / Livro de Anotações para execução posterior pelo programador.

---

# 1. PRINCÍPIO DE EXECUÇÃO FUTURA

O programador deve executar sempre sobre o estado real atual da RioMed, sem reiniciar o projeto.

Fluxo obrigatório:

**AUDITAR → MAPEAR → PRESERVAR → CONSOLIDAR → CORRIGIR → COMPLETAR → INTEGRAR → TESTAR → PUBLICAR → VALIDAR.**

Regras:

- correto → preservar;
- incompleto → completar;
- duplicado → consolidar;
- errado → corrigir;
- mock em produção → remover ou isolar em ambiente demo;
- integração apenas desenhada → não considerar pronta;
- frontend sem backend real → incompleto;
- backend sem UX utilizável → incompleto;
- código versionado sem deploy → não entregue;
- deploy sem domínio correto e smoke test → não validado.

---

# 2. AUDITORIA P0 — IDENTIDADE `rio-med` X `riomed`

Há evidência histórica de duas representações internas da mesma RioMed: `rio-med` e `riomed`.

Antes de qualquer nova implementação, auditar e consolidar:

- `companies`;
- `communication_tenants`;
- `core_tenant_identity`;
- `company_modules`;
- CRM;
- agentes;
- automações;
- N8N registry;
- rotas;
- APIs;
- migrations;
- domínio/subdomínio;
- dados financeiros;
- estoque;
- usuários;
- relatórios;
- integrações.

Definir um identificador interno canônico e manter aliases apenas quando necessários para compatibilidade.

**Domínio externo canônico obrigatório:** `riomed.impulsionando.com.br`.

Nunca perder, duplicar ou fragmentar dados durante a consolidação.

---

# 3. ESTADO EXISTENTE A PRESERVAR

Há evidência de recursos já existentes e que devem ser auditados antes de qualquer reescrita:

- frontend dedicado RioMed;
- APIs específicas;
- busca;
- financeiro;
- fiscal;
- importação;
- garantias;
- portal;
- relatórios;
- POS/comercial;
- jornadas;
- Medicito;
- chat do Medicito;
- upload privado de imagens;
- auditoria;
- hardening de privacidade;
- catálogo N8N.

Não recriar cegamente. Preservar tudo que estiver funcional e arquiteturalmente correto.

---

# 4. OBJETIVO CENTRAL DO NEGÓCIO

A RioMed deve operar em um único ecossistema para:

- venda de equipamentos médicos;
- locação de equipamentos médicos;
- periféricos;
- acessórios;
- peças;
- insumos relacionados;
- manutenção e suporte;
- pós-venda.

Fluxo macro esperado:

**TRÁFEGO/REDES → MEDICITO → CRM → VENDEDOR → COTAÇÃO → ESTOQUE → VENDA/LOCAÇÃO → PAGAMENTO → LOGÍSTICA → COMISSÃO → ERP → PÓS-VENDA → RETENÇÃO.**

---

# 5. BENCHMARK FUNCIONAL DE MERCADO

O programador e o comitê de produto devem comparar a experiência RioMed com referências atuais de venda e locação de equipamentos médico-hospitalares e home care.

Avaliar especialmente:

- profundidade de catálogo;
- venda + locação no mesmo ecossistema;
- filtros;
- disponibilidade;
- orçamento rápido;
- pronta-entrega quando real;
- suporte técnico;
- manutenção preventiva/corretiva;
- higienização de locados;
- logística;
- pós-venda;
- busca;
- mobile;
- e-commerce;
- SEO;
- confiança e informação técnica.

A RioMed deve superar concorrentes em:

**visibilidade de estoque + velocidade de resposta + inteligência comercial + integração dos vendedores + omnichannel + Medicito.**

---

# 6. GRANDE GARGALO — ESTOQUE INVISÍVEL

Existe estoque relevante de periféricos e itens de menor valor que o mercado boliviano não sabe que a RioMed possui.

Esse estoque precisa se tornar:

- pesquisável;
- indexável;
- anunciável;
- comunicável;
- vendável;
- rastreável por UTM;
- acessível aos vendedores;
- sugerível pelo Medicito;
- disponível para cross-sell e upsell.

---

# 7. ESTOQUE COMO FONTE DA VERDADE

Estados mínimos:

- disponível;
- reservado;
- em proposta;
- em pedido;
- em separação;
- em trânsito;
- locado;
- em manutenção;
- devolução;
- higienização/quarentena quando aplicável;
- avariado;
- indisponível.

Medicito e vendedores nunca podem inventar disponibilidade.

---

# 8. CADASTRO DE PRODUTO / SKU

Cada item deve suportar:

- SKU;
- nome;
- marca;
- fabricante;
- modelo;
- categoria;
- subcategoria;
- descrição;
- especificações;
- imagem;
- galeria;
- código de barras;
- QR interno;
- serial quando unitário;
- lote quando aplicável;
- condição;
- venda;
- locação;
- ambos;
- preço;
- custo;
- margem;
- estoque;
- garantia;
- documentação;
- localização física;
- compatibilidades validadas.

---

# 9. CATÁLOGO DE PERIFÉRICOS

Criar experiência específica para periféricos:

- categorias muito claras;
- pesquisa por termo técnico e popular;
- sinônimos em espanhol;
- marca/modelo;
- acessórios relacionados;
- compatibilidade somente quando cadastrada e comprovada;
- estoque visível conforme política;
- preço ou solicitação de orçamento;
- CTA Medicito;
- CTA vendedor.

---

# 10. BUSCA INTELIGENTE

A busca deve tolerar:

- erro de digitação;
- nome incompleto;
- modelo parcial;
- marca;
- SKU;
- código de barras;
- termo técnico;
- termo popular;
- espanhol/português;
- equivalentes semânticos controlados.

Nunca inferir compatibilidade não comprovada.

---

# 11. MEDICITO — PAPEL CENTRAL

MEDICITO é a instância especializada do Impulsionito para a RioMed.

Deve atuar como:

- concierge;
- qualificador de lead;
- assistente de vendas;
- pesquisador de catálogo;
- assistente de estoque;
- assistente de locação;
- assistente de suporte;
- roteador para vendedor;
- assistente de pós-venda;
- assistente visual para identificação preliminar de equipamento.

---

# 12. MEDICITO — REGRA DE VERDADE

Medicito nunca deve inventar:

- estoque;
- preço;
- prazo;
- SKU;
- fabricante;
- modelo;
- garantia;
- compatibilidade;
- vendedor;
- agenda;
- condição do equipamento;
- informação médica.

Toda afirmação objetiva deve consultar o Core ou informar claramente que o dado não está disponível.

---

# 13. MEDICITO — IMAGENS

A capacidade multimodal já existente deve ser validada e ampliada com segurança.

Fluxo:

**cliente envia foto → Medicito observa características visíveis → informa confiança alta/média/baixa → procura correspondências no catálogo → pede etiqueta/modelo/código/ângulo adicional quando necessário → sugere possíveis itens sem declarar certeza indevida.**

Medicito pode tentar identificar:

- tipo de equipamento;
- marca visível;
- modelo visível;
- etiqueta;
- código de barras visível;
- número de modelo visível;
- conector;
- periférico.

Nunca diagnosticar condição clínica por imagem.

---

# 14. ASSOCIAÇÃO DA IMAGEM AO ESTOQUE

Quando houver identificação confiável de código/SKU/modelo:

- procurar item no Core;
- mostrar correspondências;
- não associar automaticamente em definitivo sem confiança suficiente;
- permitir confirmação humana;
- registrar evidência da associação;
- impedir duplicidade.

---

# 15. UPLOAD PRIVADO

Preservar e testar:

- bucket privado;
- tamanho máximo;
- tipo MIME;
- expiração;
- hash de sessão;
- tenant isolation;
- consumo único quando aplicável;
- política de retenção/deleção;
- auditoria.

---

# 16. MEDICITO — OPENAI

Medicito deve usar OpenAI conforme a política atual da instância.

Na execução futura, verificar:

- runtime `riomed-medicito` ativo;
- root `impulsionito-core` correto;
- modelo configurado;
- chave própria no Supabase Vault;
- segredo não exposto no frontend;
- chamada E2E real;
- logs;
- fallback proibido quando policy for strict OpenAI.

Se a convenção atual do gateway exigir chave exclusiva por agente e ainda não houver uma válida, provisionar de forma segura e salvar no Vault sem expor o valor.

Nome recomendado, sujeito à convenção real do gateway:

`OPENAI_API_KEY_RIOMED_MEDICITO`

Não criar chave duplicada se já houver uma válida.

---

# 17. VENDEDORES — BASE ATUAL E ESCALA

A operação possui hoje **7 vendedores** como baseline.

O sistema não pode limitar a sete.

Deve suportar N vendedores.

O vendedor deve ser papel de funcionário no módulo RH e usuário do CRM.

---

# 18. RH — CADASTRO DE FUNCIONÁRIOS

Dashboard RioMed deve permitir adicionar, editar, inativar e reativar funcionários.

Dados:

- nome;
- documento;
- contato;
- e-mail;
- cargo;
- setor;
- gestor;
- data de entrada;
- status;
- região;
- idioma;
- metas;
- comissão;
- permissões;
- vínculo contratual conforme operação;
- documentos;
- histórico.

---

# 19. PAPÉIS INTERNOS / PERMISSÕES

Perfis mínimos:

- Master RioMed;
- direção;
- gestor comercial;
- vendedor;
- estoque;
- logística;
- locação;
- manutenção;
- financeiro;
- RH;
- contador;
- suporte;
- marketing;
- Master Impulsionando.

Aplicar RBAC + RLS reais.

---

# 20. DASHBOARD DO VENDEDOR

Mobile-first e extremamente simples.

Primeira tela:

- clientes que precisam de contato hoje;
- novos leads;
- leads sem resposta;
- propostas abertas;
- cotações vistas e não respondidas;
- metas;
- vendas do mês;
- comissão acumulada;
- comissão a receber;
- próxima data de pagamento;
- clientes recentes;
- oportunidades em risco;
- lembretes.

---

# 21. WHATSAPP COMO PORTA, APP COMO TRABALHO

Considerando resistência dos vendedores ao uso do WhatsApp como sistema operacional completo:

WhatsApp deve servir como **gatilho**, não como CRM.

Exemplo:

**“Nuevo cliente asignado. Haz clic aquí para atender.”**

Ao clicar:

- abrir app/PWA RioMed autenticado;
- abrir diretamente o lead;
- mostrar contexto;
- necessidade;
- histórico;
- estágio;
- próxima ação;
- CTA simples.

Eliminar menus desnecessários.

---

# 22. APP / PWA DO VENDEDOR

Se não houver app nativo homologado, entregar PWA instalável/mobile-first.

Experiência ideal:

**alerta → cliente → ação.**

Ações rápidas:

- ligar;
- WhatsApp;
- registrar contato;
- enviar catálogo;
- gerar cotação;
- agendar retorno;
- mudar estágio;
- consultar estoque;
- pedir apoio;
- concluir venda.

---

# 23. CRM — MACROJORNADAS

Organizar por:

- captação;
- conversão;
- relacionamento;
- retenção.

Stages configuráveis:

- novo lead;
- tentativa de contato;
- contato realizado;
- necessidade identificada;
- cotação;
- negociação;
- aprovado;
- venda;
- locação;
- perdido;
- pós-venda;
- reativação.

---

# 24. SLA DE LEADS

Parametrizar:

- lead novo → primeira ação em X minutos;
- sem resposta → nova tentativa;
- cotação enviada → follow-up;
- orçamento visto → follow-up prioritário;
- oportunidade parada → alerta;
- cliente inativo → reativação.

Alertar vendedor e gestor.

---

# 25. DISTRIBUIÇÃO DE LEADS

Critérios configuráveis:

- round-robin;
- região;
- produto/especialidade;
- disponibilidade;
- carga de leads;
- desempenho;
- idioma;
- carteira existente;
- relacionamento anterior.

Toda atribuição auditável.

---

# 26. REATRIBUIÇÃO

Se o vendedor não agir no SLA:

- lembrete;
- escalonamento;
- aviso ao gestor;
- reatribuição opcional;
- registro do motivo.

Evitar lead abandonado.

---

# 27. METAS

Metas por:

- vendedor;
- equipe;
- produto;
- categoria;
- faturamento;
- margem;
- locação;
- unidades;
- novos clientes;
- reativação;
- periféricos;
- período.

---

# 28. DASHBOARD DE METAS

Cada vendedor vê:

- meta;
- realizado;
- percentual atingido;
- faltante;
- dias restantes;
- ritmo necessário;
- ranking quando política permitir.

Gestor vê consolidado.

---

# 29. MOTOR DE COMISSÃO

Parametrizável por:

- venda;
- locação;
- produto;
- categoria;
- margem;
- vendedor;
- campanha;
- meta atingida;
- faixa progressiva;
- valor fixo;
- percentual.

Nunca hard-code comissão.

---

# 30. COMISSÃO — STATUS

Estados:

- estimada;
- confirmada;
- a vencer;
- disponível;
- paga;
- estornada;
- em disputa.

---

# 31. “RELOGINHOS” / CONTAGEM REGRESSIVA

No dashboard do vendedor, mostrar cards de recebimento:

- valor acumulado;
- competência;
- data prevista;
- dias/horas restantes;
- status;
- vendas que compõem o valor.

---

# 32. ESTORNO DE COMISSÃO

Cancelamento/refund/chargeback deve:

- localizar comissão original;
- reverter proporcionalmente;
- gerar débito futuro se já paga;
- preservar histórico.

---

# 33. DASHBOARD DO GESTOR COMERCIAL

Mostrar:

- vendedores ativos;
- vendas por vendedor;
- conversão;
- velocidade de resposta;
- pipeline;
- propostas;
- metas;
- comissão;
- leads sem ação;
- produtos mais vendidos;
- periféricos parados;
- oportunidades perdidas;
- motivos de perda.

---

# 34. CRM 360º DO CLIENTE

Uma tela deve reunir:

- cadastro;
- contatos;
- empresa;
- vendedor;
- histórico;
- produtos comprados;
- locações;
- propostas;
- pagamentos;
- tickets;
- manutenção;
- documentos;
- mensagens;
- campanhas;
- NPS;
- próxima ação.

---

# 35. FLUXO DE VENDA

**lead → necessidade → estoque → cotação → negociação → pedido → pagamento → separação → expedição → entrega → documento fiscal → pós-venda.**

---

# 36. FLUXO DE LOCAÇÃO

**solicitação → equipamento → disponibilidade → proposta → contrato → garantia/caução quando aplicável → entrega → instalação/orientação → locação ativa → renovação → manutenção → devolução → inspeção → higienização → retorno ao estoque.**

---

# 37. CALENDÁRIO DE LOCAÇÕES

Visualizar:

- equipamento;
- cliente;
- período;
- data de saída;
- retorno previsto;
- renovação;
- atraso;
- manutenção futura;
- indisponibilidade.

---

# 38. EQUIPAMENTOS SERIALIZADOS

Equipamentos unitários de locação devem possuir:

- asset_id;
- número de série;
- patrimônio;
- estado;
- localização;
- cliente atual;
- uso/horas quando disponível;
- manutenção;
- histórico de locações;
- fotos;
- garantia.

---

# 39. MANUTENÇÃO

Validar E2E:

**solicitação → triagem → diagnóstico técnico → orçamento → aprovação → reparo → testes → liberação → entrega.**

---

# 40. GARANTIAS

Módulo deve permitir:

- produto;
- venda;
- serial;
- início;
- fim;
- fabricante;
- garantia RioMed;
- chamado;
- evidências;
- status.

---

# 41. LOGÍSTICA

Fluxos:

- separação;
- conferência;
- embalagem;
- expedição;
- transportador;
- tracking;
- entrega;
- comprovante;
- devolução.

---

# 42. E-COMMERCE / CATÁLOGO DIGITAL

O catálogo deve servir compra direta ou solicitação de orçamento.

Por item:

- foto;
- descrição;
- categoria;
- disponibilidade;
- preço quando permitido;
- venda/locação;
- CTA;
- produtos relacionados;
- SEO.

---

# 43. SEO — CADA EQUIPAMENTO COMO PÁGINA ENCONTRÁVEL

Gerar dinamicamente:

- title;
- meta description;
- canonical;
- Open Graph;
- schema.org Product/Offer quando válido;
- categoria;
- imagem;
- slug estável;
- sitemap.

Evitar páginas vazias ou spam.

---

# 44. GOOGLE / TAGUEAMENTO

Implementar e validar:

- GA4;
- Google Tag Manager quando adotado;
- Search Console;
- eventos de e-commerce;
- conversões;
- UTM;
- source/medium/campaign/content/term;
- origem do lead.

---

# 45. UTM PERSISTENTE

Persistir até CRM e venda:

- primeira origem;
- última origem;
- campanha;
- anúncio;
- landing;
- produto;
- vendedor;
- receita atribuída.

---

# 46. MEDICITO — OMNICHANNEL

Medicito deve ser o mesmo cérebro em:

- chat do front;
- WhatsApp;
- Instagram Direct;
- Facebook/Messenger quando API permitir;
- TikTok quando API oficial aplicável permitir;
- outros canais homologados.

Unificar histórico por pessoa quando a correlação de identidade for legítima e segura.

---

# 47. SOCIAL DIRECTS

Por canal:

- webhook;
- autenticação;
- inbox;
- resposta Medicito;
- handoff humano;
- consentimento;
- logs;
- rate limits;
- políticas da plataforma.

Não declarar integração ativa quando a API oficial não permitir ou não estiver homologada.

---

# 48. WHATSAPP — FLUXO DO VENDEDOR

**lead inbound → Medicito qualifica → CRM cria lead → distribui vendedor → vendedor recebe aviso curto → botão abre app RioMed no lead → vendedor atua → histórico volta ao CRM.**

---

# 49. TEMPLATES WHATSAPP

Criar templates para:

- novo lead;
- follow-up;
- cotação;
- reunião;
- estoque disponível;
- produto alternativo;
- locação vencendo;
- manutenção;
- pós-venda;
- reativação.

---

# 50. E-MAIL

Biblioteca RioMed:

- boas-vindas;
- cotação;
- pedido;
- pagamento;
- documento fiscal;
- entrega;
- locação;
- renovação;
- devolução;
- manutenção;
- garantia;
- NPS;
- reativação.

Branding RioMed, responsivo e em idioma adequado.

---

# 51. N8N — CATÁLOGO JÁ PREVISTO

Há registros previstos para:

- lead intake;
- lead assignment;
- quote lifecycle;
- meeting lifecycle;
- suporte;
- pedido;
- pagamento;
- entrega;
- carrinho abandonado;
- pós-venda;
- locação;
- manutenção;
- reativação;
- SLA;
- erro de integração;
- alertas de estoque.

Não considerar ACTIVE apenas porque existe no registry.

---

# 52. N8N — GATE DE HOMOLOGAÇÃO

Para cada workflow:

- publicado externamente?;
- ID real?;
- credenciais?;
- trigger?;
- webhook?;
- idempotência?;
- correlation id?;
- retry?;
- dead-letter?;
- logs?;
- E2E?

Somente depois marcar ACTIVE.

---

# 53. ALERTAS DE ESTOQUE

Criar:

- ruptura;
- estoque crítico;
- item parado;
- excesso;
- demanda sem estoque;
- periférico com baixa rotação;
- produto procurado sem cadastro.

---

# 54. INTELIGÊNCIA PARA ESTOQUE PARADO

Dashboard deve mostrar:

- SKUs sem venda 30/60/90/180 dias;
- capital imobilizado;
- quantidade;
- categoria;
- margem;
- última venda;
- visitas/interesse;
- recomendação de campanha.

---

# 55. CAMPANHAS PARA PERIFÉRICOS

Marketing pode selecionar estoque parado e gerar:

- audiência;
- landing;
- catálogo;
- campanha;
- cupom quando autorizado;
- lista para vendedores;
- e-mail/WhatsApp;
- tracking.

---

# 56. CROSS-SELL / UPSELL

Venda/locação de equipamento → sugerir periféricos compatíveis **somente quando a compatibilidade estiver cadastrada e validada**.

Nunca deixar IA inventar compatibilidade.

---

# 57. IMPORTAÇÃO EM MASSA

Permitir importação de:

- produtos;
- estoque;
- clientes;
- vendedores;
- fornecedores;
- preços;
- serializados;
- comissões;
- metas.

Com preview, validação, deduplicação e relatório de erros.

---

# 58. ERP FULL

RioMed deve possuir ERP integrado com:

- produtos;
- clientes;
- fornecedores;
- estoque;
- compras;
- vendas;
- locações;
- financeiro;
- contas a pagar;
- contas a receber;
- documentos fiscais conforme jurisdição/provider;
- centros de custo;
- comissão;
- relatórios;
- RH;
- auditoria.

---

# 59. FINANCEIRO

Dashboard:

- vendas;
- locações;
- contas a receber;
- recebidos;
- atrasados;
- contas a pagar;
- comissão de vendedores;
- margem;
- caixa;
- previsão;
- inadimplência.

---

# 60. ÁREA DO CONTADOR

Perfil contábil segregado:

- extratos;
- conciliação;
- documentos;
- faturamento;
- despesas;
- relatórios;
- fechamento.

Sem acesso a dados comerciais ou PII desnecessários.

---

# 61. BI DA DIREÇÃO

Primeira tela deve responder:

- quanto vendeu hoje/mês?;
- quanto locou?;
- margem?;
- estoque total?;
- estoque parado?;
- quais periféricos precisam de campanha?;
- vendedores performando?;
- metas?;
- leads sem resposta?;
- taxa de conversão?;
- propostas abertas?;
- faturamento por categoria?;
- manutenção pendente?;
- locações vencendo?

---

# 62. RELATÓRIOS

Exportáveis por permissão:

- vendas;
- locações;
- estoque;
- giro;
- margem;
- comissão;
- vendedores;
- metas;
- CRM;
- campanhas;
- UTM;
- manutenção;
- garantias;
- financeiro.

---

# 63. FRONT-END

Revisão completa:

- logo correto;
- identidade RioMed;
- contraste;
- navegação;
- categorias;
- catálogo;
- busca;
- CTA;
- Medicito;
- mobile;
- espanhol boliviano;
- performance;
- SEO.

---

# 64. MENU PÚBLICO SUGERIDO

- Equipos;
- Alquiler;
- Accesorios y periféricos;
- Soporte técnico;
- Marcas;
- Ofertas;
- Medicito;
- Contacto;
- Área del cliente.

Validar com conteúdo real.

---

# 65. DASHBOARD MASTER RIOMED

Organizar por domínios:

1. Visão Geral
2. CRM
3. Vendedores
4. Metas e Comissões
5. Produtos
6. Estoque
7. Vendas
8. Locações
9. Manutenção
10. Logística
11. Financeiro
12. RH
13. Marketing
14. Comunicação
15. Medicito
16. Automação
17. Relatórios
18. Configurações

Não despejar tudo na home.

---

# 66. SEGURANÇA

Obrigatório:

- RLS;
- RBAC;
- tenant isolation;
- MFA para perfis sensíveis;
- Vault;
- secrets fora do frontend;
- upload privado;
- rate limiting;
- logs;
- backups;
- auditoria;
- sessão segura;
- proteção de endpoints;
- brute-force protection.

---

# 67. PRIVACIDADE MEDICITO

Preservar:

- minimização de PII;
- isolamento por tenant;
- sem diagnóstico médico;
- sem exposição de dados privados;
- handoff humano quando necessário.

---

# 68. TESTE E2E — NOVO LEAD

**Instagram/Google/WhatsApp/site → Medicito → lead criado → vendedor atribuído → aviso → vendedor abre app → registra contato → cotação → venda/locação → pós-venda.**

---

# 69. TESTE E2E — IMAGEM

1. cliente envia imagem;
2. upload privado;
3. Medicito analisa;
4. informa confiança;
5. consulta catálogo;
6. encontra possíveis SKUs;
7. pede confirmação quando necessário;
8. consulta estoque;
9. cria lead se houver intenção comercial;
10. atribui vendedor.

---

# 70. TESTE E2E — VENDA

**produto → estoque → cotação → aprovação → pedido → pagamento → baixa/reserva → separação → entrega → financeiro → comissão → pós-venda.**

---

# 71. TESTE E2E — LOCAÇÃO

**pedido → disponibilidade → proposta → contrato → entrega → ativo → renovação → devolução → inspeção → higienização/manutenção → estoque.**

---

# 72. TESTE E2E — COMISSÃO

- comissão calculada;
- status estimada;
- venda confirmada;
- comissão confirmada;
- relógio até pagamento;
- pagamento;
- estorno testado.

---

# 73. TESTE E2E — META

Criar meta mensal → acumular vendas → atualizar percentual → mostrar faltante → bater meta → aplicar regra de comissão/faixa quando configurada.

---

# 74. TESTE — ESTOQUE PARADO

Selecionar periférico sem venda → dashboard identifica → marketing cria campanha → produto recebe landing/UTM → lead → vendedor → venda → atribuição de origem.

---

# 75. TESTE — OMNICHANNEL

Validar canais homologados:

- web chat;
- WhatsApp;
- Instagram;
- Facebook;
- TikTok quando API permitir.

Histórico deve consolidar sem duplicar lead quando identidade puder ser correlacionada legitimamente.

---

# 76. TESTE — VENDEDOR RESISTENTE

1. vendedor recebe “Nuevo cliente — abrir”;
2. toca uma vez;
3. app abre autenticado no lead;
4. vê necessidade/histórico;
5. toca em “Contactar”;
6. registra resultado em segundos.

Se isso for burocrático, reprovar UX.

---

# 77. TESTE — PERMISSÕES

Vendedor A tenta cliente exclusivo de B sem permissão → NEGADO.  
Estoque tenta alterar comissão → NEGADO.  
Marketing tenta ver financeiro sensível → NEGADO.  
Vendedor tenta alterar regra de comissão → NEGADO.  
Usuário externo tenta upload de outro tenant → NEGADO.  
Master autorizado → PERMITIDO/AUDITADO.

---

# 78. TESTE — N8N

Nenhum workflow pode ser marcado ACTIVE sem:

- publicação externa;
- credencial;
- evento real;
- logs;
- idempotência;
- E2E.

---

# 79. TESTE — MEDICITO / OPENAI

Perguntas:

- “¿Tienen este equipo?”
- “¿Cuánto cuesta?”
- “¿Se alquila?”
- “Te mando una foto, ¿qué es?”
- “¿Tienen el accesorio para este modelo?”
- “Quiero que me llame un vendedor.”

Critérios:

- consultar Core;
- zero invenção;
- imagem com confidence;
- lead apenas com dados mínimos necessários;
- logs;
- E2E real com OpenAI.

---

# 80. TESTE — SEO / UTM

Produto publicado:

- página indexável válida;
- canonical;
- metadata;
- sitemap;
- evento GA4;
- UTM persistida;
- lead atribuído à origem;
- venda atribuída.

---

# 81. TESTE — PUBLICAÇÃO

Após futura alteração:

- branch correta;
- commit correto;
- build;
- deploy;
- SHA servido;
- domínio `riomed.impulsionando.com.br`;
- cache;
- home;
- catálogo;
- Medicito;
- login;
- dashboard;
- CRM;
- ERP;
- mobile.

---

# 82. ZERO MOCK

Produção não pode usar:

- vendedores fictícios;
- estoque fictício;
- preços inventados;
- comissão fake;
- produtos mock;
- dashboards com números estáticos;
- Medicito inventando SKU.

Demo deve ser claramente marcada.

---

# 83. COMITÊ MULTIESPECIALISTA

Toda futura revisão deve considerar:

- arquitetura;
- backend;
- frontend;
- banco;
- segurança;
- DevOps;
- UX;
- UI;
- design instrucional;
- growth;
- CRM;
- vendas B2B/B2C;
- equipamentos médico-hospitalares;
- logística;
- estoque;
- locação;
- manutenção;
- financeiro;
- RH;
- contábil;
- SEO;
- mídia paga;
- automação;
- IA multimodal.

---

# 84. ANÁLISE CRÍTICA OBRIGATÓRIA

Para cada módulo, Cauã deve responder:

1. existe?;
2. funciona?;
3. usa dado real?;
4. tem UX adequada?;
5. está duplicado?;
6. pertence ao Core?;
7. está específico demais para RioMed?;
8. falta integração?;
9. falta teste?;
10. qual risco?;
11. qual prioridade?;
12. qual prova de funcionamento?

---

# 85. PRIORIDADES

- **P0:** segurança, tenant duplicado com risco de dados, perda de estoque, faturamento errado, acesso indevido;
- **P1:** lead, venda, locação, estoque, comissão, Medicito, publicação ou integração crítica quebrada;
- **P2:** funcionalidade importante incompleta;
- **P3:** UX/growth/eficiência;
- **P4:** otimização futura.

---

# 86. CRITÉRIO DE GO-LIVE

Somente considerar RioMed pronta quando:

- tenant canônico PASS;
- domínio PASS;
- branding PASS;
- CRM PASS;
- 7 vendedores atuais + escala N PASS;
- RH PASS;
- metas PASS;
- comissão PASS;
- relógios de recebimento PASS;
- estoque PASS;
- periféricos PASS;
- busca PASS;
- venda PASS;
- locação PASS;
- manutenção PASS;
- financeiro PASS;
- Medicito PASS;
- imagem PASS;
- OpenAI E2E PASS;
- omnichannel PASS;
- N8N crítico PASS;
- SEO/UTM PASS;
- RBAC/RLS PASS;
- publicação PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 87. ACEITE POR PERSONA

**Direção:** consigo enxergar vendas, locação, margem, estoque e equipe em minutos?  
**Gestor comercial:** sei quem precisa agir agora?  
**Vendedor:** consigo abrir um lead e trabalhar em segundos pelo celular?  
**Estoque:** sei exatamente o que existe e onde?  
**Marketing:** consigo transformar estoque parado em campanha rastreável?  
**Financeiro:** consigo enxergar vendas, locações e comissões?  
**Cliente:** consigo achar equipamento/periférico facilmente?  
**Medicito:** consigo responder usando dados reais e imagens com prudência?  
**Master Impulsionando:** consigo auditar o tenant sem romper isolamento?

Se alguma resposta crítica for “não”, permanece aberto.

---

# 88. RESULTADO FINAL ESPERADO

A RioMed deve funcionar como um ecossistema único:

**TRÁFEGO/REDES → MEDICITO → CRM → VENDEDOR → COTAÇÃO → ESTOQUE → VENDA/LOCAÇÃO → PAGAMENTO → LOGÍSTICA → COMISSÃO → ERP → PÓS-VENDA → RETENÇÃO.**

O grande estoque de periféricos deve deixar de ser invisível e passar a ser **pesquisável, indexável, comunicável e vendável**.

O vendedor deve deixar de depender de memória e WhatsApp desorganizado e passar a receber **ações objetivas, com prazo, contexto, meta e recompensa**.

Medicito deve conectar cliente + imagem + catálogo + estoque + vendedor + suporte, sempre subordinado ao Impulsionito e ao Core.

---

# 89. REGRA FINAL AO PROGRAMADOR

Não criar sistemas paralelos específicos desnecessários para RioMed.

Universalizar no Core tudo que for reutilizável:

- RH;
- vendedores;
- comissão;
- metas;
- agenda;
- CRM;
- ERP;
- estoque;
- locação;
- manutenção;
- comunicação;
- BI.

Manter no tenant apenas:

- configuração;
- branding;
- catálogo;
- dados;
- regras específicas;
- idioma;
- operação.

**Implementar com profundidade por baixo e simplicidade extrema para quem usa.**

---

**STATUS:** PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** CAUÃ / PROGRAMADOR  
**AGENTE:** MEDICITO  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**