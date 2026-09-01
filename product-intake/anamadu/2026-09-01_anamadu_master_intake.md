# SUPERPROMPT MESTRE — PRODUCT INTAKE ANA MADÚ

## ANA MADÚ + ANNITA + IMPULSIONITO — Plano Full, identidade visual, CRM, ERP, estoque, vendas, Ourives, mensageria, N8N, e-mail, WhatsApp, NF, BI, segurança e Go-Live

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / programador  
**TENANT:** Ana Madú  
**SUBDOMÍNIO CANÔNICO:** `anamadu.impulsionando.com.br`  
**PLANO:** Impulsionando Full  
**AGENTE CENTRAL:** Impulsionito  
**AGENTE ESPECIALIZADO:** ANNITA  

> **NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, FRONTEND, BACKEND, N8N, CREDENCIAIS, INFRAESTRUTURA OU PRODUÇÃO A PARTIR DESTE REGISTRO.** Este documento é Product Intake / Livro de Anotações para execução posterior pelo programador.

---

# 1. REGRA DE CONTINUIDADE

Executar futuramente a partir do estado real existente.

Fluxo:

**AUDITAR → PRESERVAR → CORRIGIR → CONSOLIDAR → COMPLETAR → INTEGRAR → TESTAR → PUBLICAR → VALIDAR.**

Nunca recriar cegamente o que já estiver correto.

---

# 2. ESTADO REAL JÁ IDENTIFICADO

Há componentes dedicados da Ana Madú no repositório, incluindo:

- home específica;
- storefront específico;
- experiência Ourives;
- dock da Annita;
- API própria de chat da Annita;
- conteúdo de gemologia;
- links para loja atual, Instagram e WhatsApp;
- integração da jornada Ourives com a Annita.

Tudo deve ser auditado antes de alterar.

---

# 3. IDENTIDADE OFICIAL

A marca deve ser **ANA MADÚ**.

O agente oficial deve ser **ANNITA**, sempre com dois “n”.

Annita é uma CLIENT_INSTANCE do Impulsionito e deve atuar como:

- concierge;
- vendedora digital;
- especialista em pedras;
- assistente de criação;
- assistente de relacionamento;
- suporte;
- assistente de pós-venda;
- agente de recuperação;
- assistente de campanhas.

---

# 4. IDENTIDADE VISUAL

Auditar e consolidar:

- logo oficial;
- favicon;
- paleta;
- tipografia;
- contraste;
- componentes;
- fotografia;
- estilo editorial;
- tom de voz;
- assinatura visual da Annita.

Nenhum template deve usar identidade genérica da Impulsionando quando a comunicação for Ana Madú.

---

# 5. LOGO

Se o logo correto ainda não estiver cadastrado como asset oficial:

- registrar asset canônico;
- usar em front;
- e-mails;
- PDFs;
- documentos;
- NF/recibos quando aplicável;
- dashboards;
- templates;
- social previews.

Evitar duplicação de nome da marca quando o próprio logo já contém o nome.

---

# 6. FRONT PÚBLICO

Revisar totalmente o front com foco em:

- luxo acessível;
- pedras naturais;
- peças autorais;
- storytelling;
- confiança;
- desejo;
- conversão;
- mobile-first.

---

# 7. MENU PÚBLICO

Organizar por intenção, sem poluição:

- Coleções;
- Pedras;
- Peças;
- Ourives;
- Presentes;
- Sobre Ana Madú;
- Annita;
- Atendimento;
- Área do cliente.

Validar nomes finais com catálogo real.

---

# 8. STOREFRONT

Conectar catálogo real e impedir dados mock em produção.

Por produto:

- SKU;
- nome;
- coleção;
- pedra;
- metal/material;
- medidas;
- descrição;
- fotos;
- estoque;
- preço;
- variações;
- prazo;
- embalagem;
- disponibilidade;
- garantia/cuidados;
- SEO;
- produtos relacionados.

---

# 9. ESTOQUE

Fonte de verdade única.

Estados:

- disponível;
- reservado;
- em carrinho;
- vendido;
- em produção;
- em ajuste;
- aguardando reposição;
- indisponível;
- devolução;
- avariado.

---

# 10. PEDRAS E GEMOLOGIA

Criar cadastro estruturado de pedras:

- nome;
- variedade;
- origem quando conhecida;
- cor;
- lapidação;
- tratamentos conhecidos;
- cuidados;
- simbologia editorial sem alegações médicas;
- fotos;
- peças relacionadas.

Annita pode explicar gemologia e características reais, nunca inventar procedência ou certificação.

---

# 11. ANNITA — REGRA DE VERDADE

Annita nunca deve inventar:

- estoque;
- preço;
- prazo;
- composição;
- pedra;
- material;
- garantia;
- disponibilidade;
- desconto;
- pedido;
- status de entrega.

Para dados objetivos, consultar Core.

---

# 12. ANNITA — JORNADA DE VENDA

**descoberta → interesse → recomendação → produto → dúvida → carrinho → checkout → pagamento → pedido → entrega → pós-venda.**

Annita deve poder acompanhar a jornada sem bloquear handoff humano.

---

# 13. ANNITA — OURIVES

Preservar e evoluir a experiência de criação personalizada já existente.

Fluxo:

**ideia → tipo de peça → referências → pedra → metal → medidas → orçamento preliminar/brief → aprovação para análise → contato humano → proposta → produção → acompanhamento → entrega.**

---

# 14. OURIVES — BRIEF ESTRUTURADO

Campos:

- tipo de peça;
- finalidade;
- referência;
- pedra desejada;
- metal/material;
- medida;
- prazo desejado;
- orçamento/faixa quando informado;
- observações;
- anexos/imagens;
- consentimento de contato.

---

# 15. CRM FULL

CRM deve unificar:

- leads;
- clientes;
- compradores;
- pedidos;
- carrinhos;
- contatos;
- campanhas;
- Ourives;
- pós-venda;
- tickets;
- NPS;
- histórico.

---

# 16. PIPELINES

Pipelines sugeridos:

### Varejo
**novo lead → interesse → produto → carrinho → checkout → compra → pós-venda.**

### Ourives
**brief → análise → proposta → aprovação → produção → entrega → pós-venda.**

### Relacionamento
**novo cliente → ativo → recorrente → VIP → inativo → reativação.**

---

# 17. ERP FULL

Ana Madú deve usar o ERP/RP completo do Core:

- clientes;
- fornecedores;
- produtos;
- estoque;
- compras;
- vendas;
- pedidos;
- financeiro;
- contas a pagar;
- contas a receber;
- NF;
- centros de custo;
- relatórios;
- auditoria.

---

# 18. CADASTRO ÚNICO

Um cadastro deve alimentar:

CRM + ERP + comunicação + pedidos + financeiro + BI.

Evitar duplicação entre cliente, lead e comprador.

---

# 19. PEDIDOS

Fluxo:

**carrinho → checkout → pagamento → pedido → reserva/baixa de estoque → separação → embalagem → NF → expedição → tracking → entrega → pós-venda.**

---

# 20. CHECKOUT

Suportar, conforme provider homologado:

- Pix;
- cartão;
- cupom;
- parcelamento;
- endereço;
- frete;
- tracking;
- abandono;
- recuperação.

---

# 21. NF AUTOMÁTICA

Após evento fiscal/financeiro correto:

- emitir NF;
- impedir duplicidade;
- guardar número/status;
- disponibilizar ao cliente;
- enviar por e-mail quando configurado;
- conciliar com pedido.

Regras fiscais devem ser validadas pelo contador.

---

# 22. FINANCEIRO

Dashboard:

- vendas do dia/mês;
- ticket médio;
- margem;
- contas a receber;
- contas a pagar;
- pedidos pagos;
- pedidos pendentes;
- devoluções;
- fluxo de caixa;
- forecast.

---

# 23. ÁREA DO CONTADOR

Perfil segregado com acesso apenas ao necessário:

- NF;
- faturamento;
- despesas;
- extratos;
- conciliação;
- relatórios;
- fechamento;
- documentos.

---

# 24. MENSAGERIA CENTRAL

Ana Madú deve usar a Central de Comunicação do Core.

Canais:

- e-mail;
- WhatsApp;
- notificações internas;
- social directs quando homologados.

---

# 25. DISPARO EM MASSA

Permitir campanhas segmentadas por:

- e-mail;
- WhatsApp oficial quando permitido;
- listas importadas;
- segmentos do CRM.

Com:

- preview;
- opt-out;
- consentimento;
- limite;
- fila;
- retry;
- logs;
- relatório de entrega;
- conversão.

---

# 26. IMPORTAÇÃO POR PLANILHA

CSV/XLSX para:

- clientes;
- leads;
- produtos;
- estoque;
- fornecedores;
- listas de campanha.

Obrigatório:

- preview;
- mapeamento de campos;
- deduplicação;
- validação;
- relatório de erros;
- LGPD.

---

# 27. TEMPLATES DE E-MAIL — IDENTIDADE ANA MADÚ

Criar biblioteca visual completa usando:

- logo Ana Madú;
- cores oficiais;
- tipografia segura para e-mail;
- fotos elegantes;
- CTA claro;
- assinatura Ana Madú;
- responsividade.

---

# 28. TEMPLATES TRANSACIONAIS

No mínimo:

- boas-vindas;
- cadastro;
- carrinho abandonado;
- pedido recebido;
- pagamento aprovado;
- pagamento pendente;
- pagamento recusado;
- NF disponível;
- pedido em separação;
- pedido enviado;
- tracking;
- entregue;
- devolução;
- reembolso;
- Ourives recebido;
- Ourives em análise;
- proposta;
- produção;
- peça pronta;
- NPS;
- reativação.

---

# 29. TEMPLATES DE WHATSAPP

Criar versões curtas para:

- boas-vindas;
- confirmação;
- pagamento;
- entrega;
- tracking;
- carrinho;
- Ourives;
- pós-venda;
- recuperação;
- campanhas autorizadas.

---

# 30. N8N — PRINCÍPIO

Todas as jornadas devem existir no registry e só serem marcadas ACTIVE após publicação e E2E real.

---

# 31. N8N — CAPTAÇÃO

Workflows:

- lead criado;
- origem/UTM;
- qualificação;
- deduplicação;
- segmentação;
- atribuição;
- follow-up.

---

# 32. N8N — CARRINHO ABANDONADO

**carrinho → espera configurável → checar compra → e-mail/WhatsApp → Annita → segunda tentativa → encerramento.**

Sem spam.

---

# 33. N8N — PEDIDO

**pedido criado → pagamento → estoque → NF → expedição → tracking → entrega.**

---

# 34. N8N — PÓS-VENDA

Após entrega:

- confirmação;
- cuidado com peça;
- NPS;
- sugestão relacionada;
- aniversário/data especial quando consentido;
- recompra.

---

# 35. N8N — OURIVES

**brief → análise → contato → proposta → aceite → produção → atualização → peça pronta → entrega → pós-venda.**

---

# 36. N8N — REATIVAÇÃO

Clientes inativos:

- segmentar;
- analisar histórico;
- sugerir coleção/pedra relevante;
- mensagem;
- Annita;
- medir retorno.

---

# 37. N8N — ESTOQUE

Alertas:

- baixo estoque;
- ruptura;
- item parado;
- reposição;
- produto muito visualizado e indisponível.

---

# 38. N8N — ERROS

Todo workflow:

- idempotência;
- correlation id;
- retry;
- dead-letter;
- alerta;
- logs.

---

# 39. WHATSAPP

Integrar canal oficial homologado ao CRM.

Fluxos:

- inbound;
- Annita;
- handoff humano;
- histórico;
- pedido;
- carrinho;
- tracking;
- suporte.

---

# 40. INSTAGRAM / SOCIAL

Quando APIs oficiais permitirem:

- direct;
- comentário convertido em lead;
- resposta Annita;
- handoff;
- histórico;
- UTM/campanha.

---

# 41. SEO

Cada produto/coleção/pedra deve possuir:

- title;
- description;
- canonical;
- Open Graph;
- schema.org quando válido;
- sitemap;
- imagem;
- URL estável.

---

# 42. UTM E ATRIBUIÇÃO

Persistir:

- source;
- medium;
- campaign;
- content;
- term;
- primeira origem;
- última origem;
- receita atribuída.

---

# 43. BI EXECUTIVO

Dashboard direção:

- receita;
- pedidos;
- ticket médio;
- margem;
- conversão;
- carrinho abandonado;
- recuperação;
- produtos mais vendidos;
- pedras mais procuradas;
- estoque;
- clientes novos;
- clientes recorrentes;
- Ourives;
- NPS;
- CAC quando houver mídia integrada.

---

# 44. BI DE PRODUTOS

Mostrar:

- visualizações;
- conversão;
- estoque;
- giro;
- margem;
- devolução;
- campanha;
- receita.

---

# 45. SEGMENTAÇÃO CRM

Segmentos:

- lead;
- primeiro comprador;
- recorrente;
- VIP;
- Ourives;
- pedra de interesse;
- coleção;
- carrinho abandonado;
- inativo;
- alto ticket;
- presenteador.

---

# 46. GROWTH

Medir:

- aquisição;
- ativação;
- conversão;
- retenção;
- recompra;
- indicação;
- LTV;
- CAC;
- ROAS;
- recuperação de carrinho.

---

# 47. CUPONS E PROMOÇÕES

Parametrizáveis por:

- campanha;
- produto;
- coleção;
- cliente;
- validade;
- uso máximo;
- canal;
- origem.

---

# 48. PRESENTES

Estruturar jornada de presente:

- ocasião;
- faixa de valor;
- estilo;
- pedra;
- embalagem;
- mensagem;
- entrega.

Annita pode ajudar a escolher.

---

# 49. PÓS-VENDA / CUIDADOS

Associar automaticamente cuidados à composição real da peça.

Nunca enviar orientação incompatível com material/pedra.

---

# 50. TROCAS, DEVOLUÇÕES E REEMBOLSOS

Fluxo:

**pedido → solicitação → motivo → elegibilidade → logística reversa quando necessária → análise → troca/reembolso → estoque → financeiro → comunicação.**

---

# 51. SUPORTE

Tickets:

- pedido;
- entrega;
- produto;
- troca;
- pagamento;
- Ourives;
- manutenção/ajuste;
- acesso.

---

# 52. ÁREA DO CLIENTE

Cliente vê:

- pedidos;
- tracking;
- NF;
- dados;
- favoritos;
- Ourives;
- tickets;
- trocas;
- histórico;
- recomendações permitidas.

---

# 53. SEGURANÇA

Obrigatório:

- RLS;
- RBAC;
- tenant isolation;
- MFA para perfis sensíveis;
- Vault;
- secrets fora do frontend;
- rate limiting;
- logs;
- backups;
- auditoria;
- sessões seguras.

---

# 54. ANNITA — OPENAI

Verificar runtime, modelo, chave própria, Vault e E2E.

Não criar chave duplicada se já houver credencial válida.

Annita deve ser subordinada ao Impulsionito e usar ferramentas reais do Core.

---

# 55. TESTE E2E — VENDA

**Instagram/Google/site → produto → Annita → carrinho → checkout → pagamento → estoque → NF → expedição → tracking → entrega → pós-venda.**

---

# 56. TESTE E2E — OURIVES

**Annita → brief → aprovação para análise → CRM → proposta → aceite → produção → atualização → peça pronta → entrega → pós-venda.**

---

# 57. TESTE E2E — CARRINHO

Criar carrinho → abandonar → N8N → mensagem → voltar → converter → interromper régua automaticamente.

---

# 58. TESTE E2E — DISPARO EM MASSA

Importar planilha → deduplicar → segmentar → preview → disparar → registrar entrega → opt-out → atribuir conversão.

---

# 59. TESTE E2E — NF

Pagamento aprovado → evento fiscal → NF única → dashboard do cliente → e-mail → ERP → conciliação.

---

# 60. TESTE — ANNITA

Perguntas:

- “Essa pedra é qual?”
- “Tem essa peça em estoque?”
- “Quero um presente até R$ X.”
- “Quero criar uma peça personalizada.”
- “Onde está meu pedido?”

Zero invenção; consultar Core.

---

# 61. TESTE — PERMISSÕES

Marketing tenta financeiro sensível → NEGADO.  
Atendimento tenta alterar NF → NEGADO.  
Cliente A tenta pedido de B → NEGADO.  
Usuário comum tenta exportação massiva → NEGADO quando não autorizado.  
Master autorizado → PERMITIDO/AUDITADO.

---

# 62. TESTE — N8N

Nenhuma automação ACTIVE sem:

- workflow externo;
- ID real;
- credencial;
- evento;
- logs;
- retry;
- idempotência;
- E2E.

---

# 63. TESTE — PUBLICAÇÃO

Após implementação futura:

- branch correta;
- commit;
- build;
- deploy;
- SHA em produção;
- domínio `anamadu.impulsionando.com.br`;
- cache;
- home;
- loja;
- Annita;
- checkout;
- login;
- dashboard;
- mobile.

---

# 64. ZERO MOCK EM PRODUÇÃO

Não permitir:

- estoque fake;
- preços fictícios;
- produtos mock;
- pedidos mock;
- dashboard estático;
- Annita inventando produto.

---

# 65. DASHBOARD MASTER ANA MADÚ

Organizar:

1. Visão Geral
2. CRM
3. Clientes
4. Produtos
5. Pedras
6. Estoque
7. Pedidos
8. Ourives
9. Financeiro
10. Marketing
11. Comunicação
12. Annita
13. Automações
14. Relatórios
15. Suporte
16. Configurações

---

# 66. COMITÊ MULTIESPECIALISTA

Revisar com perspectivas de:

- arquitetura;
- backend;
- frontend;
- UX/UI;
- design instrucional;
- e-commerce;
- joias/acessórios;
- gemologia editorial;
- CRM;
- growth;
- logística;
- estoque;
- financeiro;
- fiscal;
- atendimento;
- automação;
- IA.

---

# 67. ANÁLISE CRÍTICA OBRIGATÓRIA

Para cada módulo:

1. existe?;
2. funciona?;
3. usa dados reais?;
4. tem UX adequada?;
5. está duplicado?;
6. pertence ao Core?;
7. falta integração?;
8. falta teste?;
9. risco?;
10. prioridade?;
11. prova de funcionamento?

---

# 68. CRITÉRIO DE GO-LIVE

Somente considerar Ana Madú pronta quando:

- branding/logo PASS;
- catálogo PASS;
- CRM PASS;
- ERP PASS;
- estoque PASS;
- checkout PASS;
- NF PASS;
- Annita PASS;
- Ourives PASS;
- e-mail PASS;
- WhatsApp PASS;
- planilha/importação PASS;
- campanhas PASS;
- N8N crítico PASS;
- BI PASS;
- RBAC/RLS PASS;
- publicação PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 69. ACEITE POR PERSONA

**Gestão:** consigo entender vendas, estoque, clientes e campanhas em minutos?  
**Marketing:** consigo segmentar e disparar campanhas sem planilhas paralelas?  
**Atendimento:** consigo ver todo o histórico do cliente?  
**Cliente:** consigo comprar ou iniciar Ourives com facilidade?  
**Annita:** consigo vender e atender usando dados reais?  
**Financeiro:** consigo conciliar pedido, pagamento e NF?  
**Master Impulsionando:** consigo auditar sem romper tenant isolation?

---

# 70. RESULTADO FINAL ESPERADO

A Ana Madú deve operar como um único ecossistema:

**TRÁFEGO/REDES → ANNITA → CRM → CATÁLOGO/OURIVES → CARRINHO → CHECKOUT → ERP → ESTOQUE → NF → LOGÍSTICA → PÓS-VENDA → RETENÇÃO → BI.**

Toda mensageria deve usar identidade Ana Madú.

Toda automação deve ser rastreável.

Toda informação objetiva deve partir do Core.

---

# 71. REGRA FINAL AO PROGRAMADOR

Universalizar no Core tudo que for reutilizável:

- CRM;
- ERP;
- estoque;
- campanhas;
- mensageria;
- templates;
- NF;
- importação;
- BI;
- suporte;
- segurança.

Manter no tenant Ana Madú:

- branding;
- logo;
- catálogo;
- pedras;
- coleções;
- dados;
- regras específicas;
- jornada Ourives;
- conteúdo da Annita.

**Implementar com simplicidade extrema para o usuário e profundidade operacional por baixo.**

---

**STATUS:** PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** CAUÃ / PROGRAMADOR  
**AGENTE:** ANNITA  
**NÃO EXECUTAR AUTOMATICAMENTE A PARTIR DESTE DOCUMENTO.**