# SUPERPROMPT MESTRE FINAL — ENJOY IMÓVEIS / LOPITO — PRODUCT INTAKE V2 CONSOLIDADO

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**TENANT:** Enjoy Imóveis / Lopes Enjoy Imóveis  
**SUBDOMÍNIO CANÔNICO:** `https://enjoyimoveis.impulsionando.com.br`  
**PLANO:** FULL IMPULSIONANDO  
**AGENTE ESPECIALIZADO OFICIAL:** **Lopito**  
**CORE INTERNO:** Impulsionito invisível / orquestrador  

> **NÃO EXECUTAR AGORA.** Este documento recompila e substitui funcionalmente as especificações anteriores da Enjoy para futura execução pelo programador. Nenhuma alteração de código, banco, deploy, N8N, credenciais ou produção deve ser feita automaticamente por este registro.

---

# 1. VISÃO DO PRODUTO

Construir a primeira vertical imobiliária completa do Ecossistema Impulsionando usando a Enjoy Imóveis como tenant real, preservando integralmente o que já existe de válido e autorizado no ecossistema atual da imobiliária e elevando a operação para uma experiência PropTech Full.

A plataforma não deve ser apenas um portal de imóveis.

Ela deve operar como um **sistema operacional imobiliário inteligente**, integrando:

**INVENTÁRIO → BUSCA → BRIEFING → MATCHING → LOPITO → LEAD → CRM → CORRETOR → VISITA → PROPOSTA → DOCUMENTAÇÃO → FINANCIAMENTO → CONTRATO → PÓS-VENDA → BI → AUTOMAÇÕES → RELACIONAMENTO.**

---

# 2. REGRA DE PRESERVAÇÃO / REPLICAÇÃO DO CONTEÚDO ATUAL

O novo front deve preservar e reproduzir integralmente os anúncios atuais da Enjoy, com todos os dados autorizados existentes em sua fonte oficial.

Nenhum imóvel atual deve ser perdido por falta de migração.

Para cada anúncio existente, migrar/sincronizar quando disponível:

- código do imóvel;
- título;
- tipo;
- operação;
- preço;
- condomínio;
- IPTU;
- área útil;
- área total;
- quartos;
- suítes;
- banheiros;
- vagas;
- endereço/região;
- bairro;
- condomínio/empreendimento;
- descrição;
- características;
- diferenciais;
- infraestrutura;
- fotos;
- vídeos;
- tour 360;
- planta;
- corretor responsável;
- unidade;
- status;
- exclusividade;
- data de atualização;
- metadados SEO;
- demais campos reais existentes.

## REGRA CRÍTICA

Não usar scraping como integração permanente se existir API, feed, banco, CRM ou fonte oficial autorizada.

O Cauã deve identificar a **source of truth** atual da Enjoy.

Fluxo preferencial:

`SOURCE OF TRUTH → API/FEED/DB AUTORIZADO → STAGING → VALIDAÇÃO → NORMALIZAÇÃO → DEDUPE → SYNC → FRONT/BACKEND`.

Se o sistema atual continuar ativo durante a transição, implementar sincronização para impedir divergência de preço, disponibilidade ou status.

---

# 3. ZERO REGRESSÃO DO INVENTÁRIO

Antes do go-live, comparar:

- quantidade total de anúncios atuais;
- imóveis ativos;
- imóveis por bairro;
- fotos por imóvel;
- campos preenchidos;
- preço;
- status;
- URLs;
- corretores;
- lançamentos;
- Luxury.

Nenhum imóvel deve desaparecer silenciosamente.

Gerar relatório:

`Fonte atual | Migrado | Divergente | Pendente | Erro | Resolvido`.

---

# 4. HOME CANÔNICA

A home é exclusivamente:

`https://enjoyimoveis.impulsionando.com.br`

Nunca:

`https://enjoyimoveis.impulsionando.com.br/enjoyimoveis`

O hostname identifica o tenant. `/` é a home.

---

# 5. IDENTIDADE VISUAL

Auditar e reutilizar a identidade oficial Enjoy/Lopes Enjoy:

- logo;
- cores;
- tipografia;
- linguagem;
- fotografia;
- unidade Luxury;
- tom institucional;
- elementos de confiança.

Não descaracterizar a marca com template genérico de imobiliária ou SaaS.

---

# 6. HOME — ARQUITETURA DE CONVERSÃO

A home deve ser orientada à intenção.

Hero com busca principal + CTAs:

- Comprar;
- Alugar;
- Lançamentos;
- Luxury;
- Avaliar meu imóvel;
- Quero vender/alugar meu imóvel;
- Falar com Lopito;
- Falar com corretor.

Blocos seguintes:

- imóveis em destaque;
- bairros/regiões;
- lançamentos;
- Luxury;
- oportunidades;
- avaliação de imóvel;
- benefícios da Enjoy;
- prova social;
- unidades;
- conteúdo editorial;
- CTA final.

---

# 7. O GRANDE DIFERENCIAL: LOPITO + BRIEFING INTELIGENTE

O principal diferencial da vertical Enjoy deve ser a capacidade do **Lopito compreender profundamente a intenção do lead antes de exibir imóveis**.

Não mostrar dezenas de imóveis apenas porque atendem a 2 ou 3 filtros superficiais.

Lopito deve conduzir um briefing adaptativo em tempo real.

## EXEMPLO

Usuário:

“Quero morar na Barra, 3 quartos, perto da praia.”

Lopito deve aprofundar somente o necessário:

- compra ou locação?;
- orçamento máximo?;
- precisa de quantas vagas?;
- metragem mínima?;
- preferência Barra/Jardim Oceânico/Recreio?;
- distância máxima da praia?;
- precisa de metrô/BRT?;
- filhos/escola?;
- pet?;
- condomínio-clube ou prédio menor?;
- varanda?;
- vista?;
- andar?;
- aceita reformar?;
- urgência da mudança?;
- financiamento?;
- entrada disponível quando quiser informar?;
- itens obrigatórios;
- itens desejáveis;
- itens proibitivos.

Não fazer interrogatório rígido. Perguntas devem ser progressivas e inteligentes.

---

# 8. HARD FILTERS X SOFT PREFERENCES

Lopito deve classificar requisitos em:

### HARD FILTERS

Imóvel não deve ser exibido se violar requisito obrigatório.

Exemplos:

- preço máximo absoluto;
- mínimo 3 quartos;
- 2 vagas obrigatórias;
- pet obrigatório;
- bairro obrigatório;
- acessibilidade obrigatória.

### SOFT PREFERENCES

Usadas para ranking, não exclusão.

Exemplos:

- perto da praia;
- andar alto;
- vista livre;
- varanda grande;
- condomínio-clube;
- silêncio;
- proximidade de escola.

---

# 9. MATCHING EXPLICÁVEL

Cada imóvel recomendado deve mostrar por que entrou no shortlist.

Exemplo:

**92% aderente ao seu briefing**

- dentro do orçamento;
- 3 quartos;
- 2 vagas;
- 450m da praia;
- varanda;
- condomínio com piscina;
- 8% acima da metragem mínima.

Também mostrar gaps:

- “não possui vista mar”; ou
- “fica 1,2 km do metrô”.

Nunca inventar scoring sem base nos campos reais.

---

# 10. SHORTLIST DE ALTA PRECISÃO

Após briefing suficiente, Lopito deve priorizar poucos imóveis realmente aderentes.

Objetivo:

**qualidade > quantidade**.

Pode apresentar inicialmente 3–7 imóveis fortes e permitir ampliar depois.

---

# 11. REFINAMENTO CONVERSACIONAL

Usuário pode dizer:

- “esses estão pequenos”;
- “não gostei desse condomínio”;
- “quero algo mais moderno”;
- “pode subir para 2,3 milhões”;
- “abro mão da segunda vaga”.

Lopito atualiza o briefing em tempo real e recalcula resultados.

---

# 12. BRIEFING PERSISTENTE

Com consentimento/autenticação, salvar:

- orçamento;
- regiões;
- perfil;
- hard filters;
- soft preferences;
- rejeições;
- favoritos;
- imóveis vistos;
- etapa da compra;
- urgência;
- financiamento;
- corretor responsável.

O lead não deve repetir tudo ao trocar de canal ou falar com corretor.

---

# 13. HANDOFF LOPITO → CORRETOR

Quando o lead estiver qualificado ou quiser atendimento humano, o corretor recebe contexto completo.

Resumo automático:

- quem é;
- origem;
- intenção;
- orçamento;
- regiões;
- hard filters;
- preferências;
- imóveis vistos;
- favoritos;
- rejeitados e motivos;
- shortlist;
- urgência;
- financiamento;
- próxima ação sugerida.

O corretor não deve perguntar tudo novamente.

---

# 14. CRM IMOBILIÁRIO 360º

Pipeline padrão:

`NOVO → CONTATO INICIADO → QUALIFICANDO → BRIEFING COMPLETO → MATCHING → IMÓVEIS ENVIADOS → VISITA AGENDADA → VISITA REALIZADA → PROPOSTA → NEGOCIAÇÃO → DOCUMENTAÇÃO → FINANCIAMENTO → CONTRATO → FECHADO → PÓS-VENDA`.

Permitir personalização por operação.

---

# 15. EVENTOS COMPORTAMENTAIS DO LEAD

Registrar:

- primeira visita;
- busca;
- busca salva;
- imóvel visto;
- tempo/engajamento quando permitido;
- favorito;
- comparação;
- compartilhamento;
- clique WhatsApp;
- briefing iniciado;
- briefing concluído;
- shortlist gerado;
- pedido de corretor;
- visita agendada;
- visita realizada;
- proposta;
- documento;
- fechamento.

Eventos alimentam CRM e N8N.

---

# 16. LEAD SCORING

Score multifatorial:

- completude do briefing;
- frequência;
- favoritos;
- comparações;
- retorno;
- visita;
- faixa de preço;
- urgência;
- financiamento;
- resposta;
- proposta.

Score não substitui julgamento comercial.

---

# 17. ROTEAMENTO INTELIGENTE PARA CORRETORES

Distribuir por:

- bairro;
- condomínio;
- operação;
- faixa de valor;
- Luxury;
- lançamento;
- unidade;
- corretor especialista;
- escala;
- disponibilidade;
- round-robin;
- carga de leads;
- performance com regras justas.

---

# 18. JORNADA DO CORRETOR — ULTRASSIMPLES

Ao receber lead, o corretor deve enxergar em uma tela:

- nome;
- WhatsApp;
- origem;
- briefing;
- shortlist;
- score;
- última interação;
- próxima ação;
- prazo/SLA;
- histórico.

Botões rápidos:

- ligar;
- WhatsApp;
- e-mail;
- enviar imóveis;
- agendar visita;
- registrar contato;
- criar tarefa;
- marcar perdido;
- gerar proposta.

---

# 19. SLA DE ATENDIMENTO

Medir e alertar:

- lead novo sem contato;
- tempo de primeira resposta;
- lead sem follow-up;
- visita sem retorno;
- proposta sem ação;
- documento pendente.

Escalonamento para gestor configurável.

---

# 20. FOLLOW-UP INTELIGENTE

N8N deve gerar lembretes baseados no estado real.

Nunca mandar:

“Viu os imóveis?”

se o lead já agendou visita.

Sempre consultar estado antes de comunicar.

---

# 21. TEMPLATE DE WHATSAPP PARA CORRETOR

Gerar sugestões contextuais editáveis.

Exemplo:

“Oi, {{nome}}. Separei 4 imóveis que realmente atendem ao que você comentou com o Lopito: 3 quartos, 2 vagas, até R$ X e próximos da praia. Quer que eu te ajude a comparar ou já reservamos uma visita nos dois melhores?”

---

# 22. AGENDA DE VISITAS

Fluxo:

`cliente → imóvel → corretor → disponibilidade → confirmação → lembrete → check-in → feedback → próxima ação`.

Suportar múltiplos imóveis numa mesma rota de visita.

---

# 23. ROTEIRO INTELIGENTE DE VISITAS

Quando houver 2+ imóveis no mesmo dia, sugerir sequência baseada em localização e horários.

Não prometer otimização de trânsito sem fonte em tempo real.

---

# 24. CHECK-IN

Check-in pelo corretor/cliente/QR conforme regra.

Atualizar CRM automaticamente.

---

# 25. FEEDBACK PÓS-VISITA

Registrar:

- nota;
- interesse;
- preço;
- tamanho;
- condomínio;
- localização;
- objeções;
- pontos positivos;
- decisão;
- próximo passo.

Lopito deve atualizar preferências com esse feedback.

---

# 26. RECOMENDAÇÃO PÓS-VISITA

Se imóvel rejeitado por motivo específico, novos resultados devem considerar esse aprendizado.

Exemplo:

“achou condomínio muito grande” → reduzir ranking de condomínio-clube.

---

# 27. BUSCA TRADICIONAL AVANÇADA

Além do Lopito, manter filtros completos:

- compra/locação;
- tipo;
- bairro;
- condomínio;
- empreendimento;
- preço;
- quartos;
- suítes;
- banheiros;
- vagas;
- área;
- condomínio;
- IPTU;
- mobiliado;
- pet;
- piscina;
- academia;
- lazer;
- varanda;
- vista;
- andar;
- elevador;
- acessibilidade;
- lançamento;
- pronto;
- Luxury;
- exclusividade;
- oportunidade;
- financiamento;
- palavra-chave.

---

# 28. MAPA INTERATIVO

- clusters;
- cards sincronizados;
- faixa de preço;
- área desenhada;
- raio;
- bairro;
- pontos de interesse;
- privacidade do endereço quando necessária.

---

# 29. BUSCAS SALVAS

Usuário pode salvar briefing/busca.

Gatilhos opcionais:

- novo imóvel compatível;
- redução de preço;
- retorno ao mercado;
- lançamento.

---

# 30. FAVORITOS

Favoritos devem alimentar matching e CRM com consentimento.

---

# 31. COMPARADOR

Comparar lado a lado:

- preço;
- preço/m²;
- área;
- quartos;
- suítes;
- vagas;
- condomínio;
- IPTU;
- localização;
- diferenciais;
- distância de pontos;
- custos estimados;
- aderência ao briefing.

---

# 32. PÁGINA DO IMÓVEL

Experiência premium:

- galeria;
- vídeo;
- 360;
- planta;
- dados completos;
- preço/m²;
- custos;
- mapa;
- bairro;
- condomínio;
- diferenciais;
- corretor;
- Lopito contextual;
- similares;
- comparar;
- favorito;
- compartilhar;
- visita;
- proposta;
- financiamento;
- CTA mobile sticky.

---

# 33. LOPITO CONTEXTUAL NO IMÓVEL

Perguntas como:

- “esse imóvel atende meu briefing?”;
- “qual diferença para o outro que favoritei?”;
- “quanto pago de condomínio + IPTU?”;
- “tem outro parecido mais barato?”;
- “quero visitar sábado”.

Responder apenas com dados disponíveis.

---

# 34. CAPTAÇÃO DE PROPRIETÁRIO

Jornada:

`quero vender/alugar → dados → fotos → avaliação → corretor → visita técnica → documentos → autorização → publicação`.

---

# 35. AVALIAÇÃO / AVM

Estimativa assistida por dados com:

- comparáveis;
- preço/m²;
- bairro;
- condomínio;
- tipologia;
- histórico;
- faixa de confiança.

Não substituir avaliação profissional quando exigida.

---

# 36. PORTAL DO PROPRIETÁRIO

- imóvel;
- status;
- publicação;
- visualizações agregadas;
- visitas;
- propostas;
- feedbacks apropriados;
- documentos;
- contratos;
- financeiro de locação quando aplicável;
- manutenção;
- relatórios.

---

# 37. CAPTAÇÃO INTERNA

Pipeline completo para captadores/corretores.

Medir:

- captações;
- exclusividades;
- tempo até publicar;
- qualidade de cadastro;
- performance do imóvel.

---

# 38. CADASTRO MASTER DO IMÓVEL

Campos canônicos + histórico de mudanças.

Toda alteração de preço/status deve ser auditada.

---

# 39. SCORE DE QUALIDADE DO ANÚNCIO

Pontuar:

- quantidade/qualidade de fotos;
- vídeo;
- planta;
- descrição;
- preço;
- endereço;
- condomínio/IPTU;
- características;
- documentação;
- completude.

---

# 40. IA PARA DESCRIÇÃO

Pode sugerir texto somente a partir de dados reais.

Proibido inventar:

- vista;
- reforma;
- proximidade;
- metragem;
- acabamento;
- infraestrutura.

---

# 41. MÍDIA

- fotos;
- vídeos;
- drone autorizado;
- 360;
- planta;
- ordem;
- capa;
- direitos de uso;
- otimização.

---

# 42. LANÇAMENTOS

Módulo dedicado:

- incorporadora;
- empreendimento;
- estágio;
- unidades;
- plantas;
- materiais;
- tabela autorizada;
- localização;
- cadastro de interesse;
- corretor;
- eventos.

---

# 43. LOPES ENJOY LUXURY

Experiência diferenciada:

- curadoria;
- mídia premium;
- atendimento especializado;
- privacidade;
- imóveis exclusivos;
- off-market quando autorizado;
- qualificação de lead;
- concierge Lopito.

---

# 44. PÁGINAS DE BAIRRO

Criar páginas robustas e úteis, não SEO vazio.

Conteúdo:

- imóveis disponíveis;
- perfil da região;
- mobilidade;
- comércio;
- praia/parques;
- escolas quando fontes confiáveis;
- preço/m² baseado em dados;
- tipos mais comuns;
- CTA;
- Lopito contextual.

---

# 45. PÁGINAS DE CONDOMÍNIO

- descrição;
- localização;
- infraestrutura;
- imóveis ativos;
- faixa de preço real;
- histórico interno quando permitido;
- CTA.

---

# 46. SEO PROGRAMÁTICO GOVERNADO

URLs limpas, canonical, sitemap, structured data, breadcrumbs, Open Graph, metadados e conteúdo de qualidade.

Nenhuma geração massiva de páginas vazias.

---

# 47. PORTAIS IMOBILIÁRIOS

Preparar feeds/APIs para canais autorizados.

Status por portal:

- publicado;
- atualizado;
- erro;
- rejeitado;
- removido;
- lead recebido.

---

# 48. LEADS DE PORTAIS

Todos entram no mesmo CRM com origem correta.

Deduplicar por identidade/contacto, sem perder origem.

---

# 49. REDES SOCIAIS

Integrações oficiais quando disponíveis:

- Instagram;
- Facebook;
- LinkedIn;
- YouTube;
- TikTok.

Usos:

- conteúdo;
- anúncios;
- leads;
- inbox;
- imóveis;
- atribuição.

---

# 50. WHATSAPP

Canal crítico:

- entrada de lead;
- Lopito;
- handoff corretor;
- imóvel;
- shortlist;
- visita;
- lembrete;
- proposta;
- documentos;
- pós-venda;
- suporte.

---

# 51. E-MAIL

Templates completos para:

- boas-vindas;
- shortlist;
- busca salva;
- redução de preço;
- visita;
- proposta;
- documentação;
- financiamento;
- fechamento;
- pós-venda;
- proprietário;
- newsletters segmentadas.

---

# 52. N8N — ARQUITETURA

Event-driven:

`EVENTO → ESTADO REAL → CONTEXTO → CONSENTIMENTO → TEMPLATE/AÇÃO → EXECUÇÃO → CRM → PRÓXIMA AÇÃO`.

Idempotência obrigatória.

---

# 53. JORNADA NOVO LEAD

`captura → dedupe → origem → Lopito/CRM → qualificação → roteamento → SLA → corretor`.

---

# 54. JORNADA BRIEFING

`início → perguntas adaptativas → filtros → score de completude → shortlist → handoff`.

---

# 55. JORNADA IMÓVEL NOVO COMPATÍVEL

Somente se o lead optou por alertas.

---

# 56. JORNADA REDUÇÃO DE PREÇO

Usuários interessados e consentidos podem ser avisados.

---

# 57. JORNADA VISITA

`agendada → confirmada → lembrete → check-in → feedback → próxima ação`.

---

# 58. JORNADA PROPOSTA

`proposta → proprietário → contraproposta → negociação → aceite/rejeição → documentação`.

---

# 59. JORNADA PROPRIETÁRIO

`lead → avaliação → captação → publicação → relatórios → visitas → propostas → fechamento`.

---

# 60. JORNADA PÓS-VENDA

`contrato → documentação → registro/financiamento → chaves → satisfação → indicação → relacionamento`.

---

# 61. PROPOSTA DIGITAL

Campos, contraproposta, histórico, validade, anexos e auditoria.

---

# 62. DOCUMENTAÇÃO

Checklist configurável por operação.

Estados:

- pendente;
- recebido;
- inválido;
- expirado;
- aprovado;
- rejeitado.

---

# 63. JURÍDICO

Workflow:

`documentos → análise → pendências → aprovação → contrato → assinatura → evidências`.

IA pode resumir; decisão jurídica humana.

---

# 64. ASSINATURA ELETRÔNICA

Provedor homologado + audit trail.

---

# 65. FINANCIAMENTO

- simulador indicativo;
- parceiros;
- documentação;
- status;
- pendências;
- integração API quando existir;
- alertas.

---

# 66. ITBI / CUSTOS

Calculadora parametrizada e versionada.

---

# 67. LOCAÇÃO

Fluxo completo:

`lead → visita → proposta → análise → garantia → contrato → vistoria → chaves → cobrança → manutenção → renovação/encerramento`.

---

# 68. ADMINISTRAÇÃO DE LOCAÇÃO

- carteira;
- cobranças;
- repasses;
- reajustes;
- inadimplência;
- proprietários;
- inquilinos;
- contratos;
- manutenção;
- demonstrativos.

---

# 69. VISTORIA

Mobile, fotos, vídeos, checklist, assinatura, comparação entrada/saída.

---

# 70. MANUTENÇÃO

Tickets vinculados ao imóvel com orçamento, aprovação e fornecedor.

---

# 71. ERP FULL

- contas a pagar;
- contas a receber;
- receitas;
- despesas;
- centros de custo;
- unidades;
- comissões;
- repasses;
- conciliação;
- fluxo de caixa;
- DRE gerencial;
- orçamento;
- exportação contábil.

---

# 72. COMISSÕES

Motor parametrizável por:

- corretor;
- captador;
- gerente;
- unidade;
- parceria;
- indicação;
- split;
- pagamento;
- estorno.

---

# 73. RH / CORRETORES

Cadastro:

- nome;
- CRECI;
- unidade;
- regiões;
- especialidades;
- canais;
- escala;
- metas;
- comissões;
- documentos;
- status.

---

# 74. RECRUTAMENTO DE CORRETORES

- candidatura;
- currículo;
- CRECI;
- entrevista;
- onboarding;
- treinamento;
- documentos;
- aprovação.

---

# 75. TREINAMENTO

Conteúdo sobre:

- sistema;
- bairros;
- atendimento;
- vendas;
- produto;
- compliance;
- LGPD;
- segurança.

---

# 76. BI EXECUTIVO

KPIs:

- leads;
- origem;
- SLA;
- briefing completo;
- shortlist;
- visitas;
- propostas;
- conversão;
- VGV;
- receita;
- comissões;
- captações;
- imóveis ativos;
- imóveis parados;
- exclusividades;
- tempo de estoque;
- redução de preço;
- unidades;
- corretores;
- bairros;
- CAC/ROI quando disponível.

---

# 77. BI DO LOPITO

Medir:

- conversas;
- briefings iniciados;
- concluídos;
- taxa de matching;
- shortlist → visita;
- visita → proposta;
- resolução sem humano;
- handoffs;
- perguntas sem resposta;
- satisfação;
- custo OpenAI;
- latência.

---

# 78. BI DO CORRETOR

- leads;
- SLA;
- contatos;
- visitas;
- propostas;
- conversão;
- VGV;
- comissão;
- tarefas vencidas;
- NPS.

---

# 79. BI DE ESTOQUE

- imóveis ativos;
- por bairro;
- faixa de preço;
- tempo no mercado;
- redução de preço;
- visualizações;
- leads;
- visitas;
- propostas;
- liquidez.

---

# 80. ALERTAS INTELIGENTES

- lead sem contato;
- imóvel sem lead;
- imóvel com muitos views e zero visita;
- imóvel com visitas e zero proposta;
- proposta expirando;
- documento pendente;
- proprietário sem atualização;
- corretor sobrecarregado;
- integração quebrada;
- imóvel divergente do source of truth.

---

# 81. LOPITO — IDENTIDADE

Lopito é o único agente visível do tenant.

Impulsionito permanece interno/invisível.

---

# 82. LOPITO — OPENAI

Secret oficial já criado no Vault:

`OPENAI_API_KEY_ENJOYIMOVEIS_LOPITO`

Cauã deve mapear explicitamente o agente Enjoy/Lopito para essa secret no gateway, sem expor valor.

---

# 83. LOPITO — PRIMEIRO ACESSO

Abre, apresenta-se, oferece ajuda, minimiza e permanece disponível.

---

# 84. LOPITO — PERSONAS

Deve adaptar comportamento para:

- comprador;
- locatário;
- investidor;
- proprietário;
- corretor;
- gestor;
- financeiro;
- jurídico.

Sempre conforme RBAC.

---

# 85. LOPITO — LIMITES

Nunca:

- inventar imóvel;
- inventar preço;
- garantir financiamento;
- emitir parecer jurídico;
- prometer valorização;
- expor dados pessoais;
- acessar outro tenant;
- executar ação crítica sem autorização.

---

# 86. CUSTOMER 360

Pessoa única pode ser:

- lead;
- comprador;
- proprietário;
- locatário;
- investidor;
- indicado.

Deduplicação cuidadosa.

---

# 87. ÁREA DO CLIENTE

- perfil;
- briefing;
- buscas;
- favoritos;
- comparações;
- visitas;
- propostas;
- documentos;
- financiamento;
- contratos;
- tickets;
- preferências de comunicação.

---

# 88. ÁREA DO PROPRIETÁRIO

Conforme seção própria.

---

# 89. ÁREA DO CORRETOR

Mobile-first e orientada a ação.

---

# 90. ÁREA DA GESTÃO

Módulos Full:

- CRM;
- imóveis;
- proprietários;
- corretores;
- captação;
- agenda;
- propostas;
- jurídico;
- documentos;
- financeiro;
- marketing;
- campanhas;
- N8N;
- BI;
- tickets;
- usuários/permissões;
- integrações;
- Lopito.

---

# 91. MULTIUNIDADE

Consolidar e filtrar por unidade.

---

# 92. TICKETS / SUPORTE

Ticket universal com número, prioridade, SLA, responsável, histórico e anexos.

---

# 93. NPS / CSAT

Após atendimento, visita, fechamento e manutenção.

---

# 94. INDICAÇÕES

Programa rastreável quando aprovado.

---

# 95. GOOGLE / META

- tags;
- pixels;
- UTMs;
- conversões;
- campanhas;
- ROI;
- remarketing consentido;
- lead attribution.

---

# 96. PERFORMANCE

- lazy load;
- CDN;
- imagens responsivas;
- WebP/AVIF quando aplicável;
- cache;
- paginação;
- Core Web Vitals;
- observabilidade.

---

# 97. ACESSIBILIDADE

WCAG como referência.

---

# 98. LGPD

- consentimento;
- finalidade;
- minimização;
- retenção;
- direitos do titular;
- opt-out;
- cookies;
- auditoria;
- privacy by design.

---

# 99. RBAC

Perfis:

- master Impulsionando;
- admin Enjoy;
- diretoria;
- gerente;
- corretor;
- captador;
- jurídico;
- financeiro;
- marketing;
- atendimento;
- proprietário;
- cliente.

---

# 100. RLS / TENANT ISOLATION

Zero acesso cruzado.

---

# 101. SEGURANÇA

- Vault;
- MFA;
- audit logs;
- secrets fora do frontend;
- rate limit;
- WAF quando aplicável;
- backups;
- restore testado;
- proteção de uploads;
- antivírus/scan quando arquitetura permitir.

---

# 102. OBSERVABILIDADE

Monitorar:

- front;
- APIs;
- DB;
- busca;
- feeds;
- OpenAI;
- WhatsApp;
- e-mail;
- N8N;
- erros de sync;
- latência.

---

# 103. ZERO MOCK

Nenhum dado fictício deve aparecer como real em produção.

---

# 104. E2E — MIGRAÇÃO

`fonte atual → staging → validação → sync → front → conferir 100% da amostra e reconciliar totais`.

---

# 105. E2E — BRIEFING

`lead → Lopito → filtros adaptativos → hard/soft → shortlist → explicação → CRM`.

---

# 106. E2E — HANDOFF

`Lopito → corretor → contexto completo → contato → CRM atualizado`.

---

# 107. E2E — VISITA

`shortlist → agendamento → confirmação → check-in → feedback → atualização de briefing`.

---

# 108. E2E — PROPOSTA

`visita → proposta → contraproposta → aceite → documentos`.

---

# 109. E2E — PROPRIETÁRIO

`avaliar → captar → publicar → leads → visitas → propostas → relatório`.

---

# 110. E2E — LOCAÇÃO

Fluxo completo até manutenção/encerramento.

---

# 111. E2E — OPENAI

`tenant Enjoy → Lopito → secret OPENAI_API_KEY_ENJOYIMOVEIS_LOPITO → OpenAI → resposta → tools → dados Enjoy`.

Testar falha de chave e cross-tenant.

---

# 112. E2E — PERMISSÕES

- cliente tenta financeiro → NEGADO;
- proprietário tenta dados de outro proprietário → NEGADO;
- corretor tenta outro tenant → NEGADO;
- Lopito tenta secret de outro agente → NEGADO;
- gestor autorizado → PERMITIDO/AUDITADO.

---

# 113. E2E — URL

`https://enjoyimoveis.impulsionando.com.br` deve abrir a home diretamente, sem `/enjoyimoveis`.

---

# 114. MIGRAÇÃO DE LINKS

Todos os links gerados por CRM, WhatsApp, e-mail, anúncios, QR e campanhas devem usar a URL canônica do subdomínio.

---

# 115. COMITÊ DE REVISÃO

Revisar com perspectiva de:

- produto;
- UX/UI;
- imobiliário;
- corretagem;
- captação;
- jurídico;
- financiamento;
- growth;
- CRM;
- ERP;
- BI;
- IA;
- segurança;
- LGPD;
- SEO;
- automação.

---

# 116. CRITÉRIO DE GO-LIVE

Só considerar pronto quando:

- inventário reconciliado;
- front PASS;
- search PASS;
- filtros PASS;
- Lopito PASS;
- briefing PASS;
- matching PASS;
- CRM PASS;
- corretores PASS;
- visitas PASS;
- propostas PASS;
- proprietário PASS;
- ERP PASS;
- N8N PASS;
- WhatsApp/e-mail PASS;
- segurança PASS;
- URL canônica PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 117. REGRA DE UNIVERSALIZAÇÃO

Tudo que for genérico deve ser parametrizado e voltar ao Core como vertical imobiliária reutilizável para futuros tenants.

Não levar marca/dados Enjoy para outro cliente.

---

# 118. EXPERIÊNCIA SURPREENDENTE

O diferencial da plataforma deve ser percebido imediatamente:

**“Eu não preciso aprender a pesquisar imóveis. Eu explico como quero viver, e o Lopito entende, refina e me mostra somente o que realmente faz sentido.”**

---

# 119. EXPERIÊNCIA DO CORRETOR

O corretor deve sentir:

**“O lead chega para mim já entendido, contextualizado e com os imóveis certos na mesa.”**

---

# 120. EXPERIÊNCIA DA GESTÃO

A gestão deve saber em tempo real:

- de onde veio cada lead;
- quem está atendendo;
- estágio;
- próxima ação;
- imóveis envolvidos;
- SLA;
- conversão;
- receita/VGV;
- gargalos.

---

# 121. REGRA FINAL AO CAUÃ

Não construir um portal melhorado apenas visualmente.

Construir um **organismo imobiliário inteligente**.

Se o inventário atual não estiver integralmente sincronizado, está incompleto.

Se o Lopito só responder perguntas, está incompleto.

Se o Lopito exibir dezenas de imóveis sem compreender o briefing, está errado.

Se o corretor receber lead sem contexto, está incompleto.

Se o CRM não acompanhar a jornada inteira, está incompleto.

Se o proprietário não enxergar seu processo, está incompleto.

Se a IA inventar imóvel, preço ou característica, está errado.

O objetivo é transformar a Enjoy em uma experiência onde **Lopito + dados + CRM + corretores + automação** trabalhem como um único cérebro operacional para aumentar relevância, velocidade, confiança e conversão.

---

**STATUS:** PRODUCT INTAKE V2 CONSOLIDADO SALVO PARA EXECUÇÃO FUTURA PELO CAUÃ.  
**BRANCH:** `reengineering/program`  
**NÃO EXECUTAR AUTOMATICAMENTE.**