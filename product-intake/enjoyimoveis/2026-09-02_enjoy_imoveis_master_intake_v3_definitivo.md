# SUPERPROMPT MESTRE DEFINITIVO — ENJOY IMÓVEIS / LOPITO — PRODUCT INTAKE V3

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**TENANT:** Enjoy Imóveis / Lopes Enjoy Imóveis  
**SUBDOMÍNIO CANÔNICO:** `https://enjoyimoveis.impulsionando.com.br`  
**PLANO:** FULL IMPULSIONANDO  
**AGENTE ESPECIALIZADO OFICIAL:** **Lopito**  
**CORE INTERNO:** Impulsionito invisível / orquestrador  
**OBJETIVO:** construir a imobiliária mais integrada, automatizada, inteligente e orientada à conversão possível dentro do Ecossistema Impulsionando.

> **NÃO EXECUTAR AGORA.** Este documento é exclusivamente Product Intake. Ele consolida e substitui funcionalmente o V2 e os addenda anteriores da Enjoy. Nenhuma alteração de código, banco, deploy, N8N, credenciais, produção ou infraestrutura deve ser feita automaticamente por este registro.

---

# 1. MISSÃO

Criar uma plataforma imobiliária que surpreenda imediatamente o proprietário da Enjoy e qualquer gestor imobiliário experiente pela capacidade de compreender leads, organizar inventário, automatizar relacionamento, cobrar execução dos corretores, administrar exceções, medir conversão e conduzir jornadas completas sem depender de secretárias ou recepcionistas para tarefas rotineiras.

A plataforma deve funcionar como um **organismo imobiliário vivo**, e não como um portal com CRM acoplado.

Arquitetura central:

**INVENTÁRIO → PORTAL → LOPITO → BRIEFING → MATCHING → CRM → CORRETOR → N8N → VISITA → PROPOSTA → DOCUMENTAÇÃO → FINANCIAMENTO → CONTRATO → PÓS-VENDA → RETENÇÃO → INDICAÇÃO → BI → MELHORIA CONTÍNUA.**

---

# 2. PROPOSTA ÚNICA DE VALOR

O cliente final deve perceber:

**“Eu não preciso aprender a pesquisar imóveis. Eu explico como quero viver e o Lopito entende, refina e me mostra só o que realmente faz sentido.”**

O corretor deve perceber:

**“O lead chega para mim já entendido, contextualizado e com os imóveis certos na mesa.”**

A gestão deve perceber:

**“Eu configuro as regras uma vez e o sistema cobra, lembra, comunica, acompanha e me chama apenas quando algo realmente exige decisão.”**

---

# 3. OPERAÇÃO AUTÔNOMA POR PADRÃO

A plataforma deve reduzir drasticamente a necessidade de trabalho humano administrativo repetitivo.

Não digitalizar tarefas de secretaria para depois exigir que alguém continue executando essas tarefas manualmente.

Automatizar:

- recepção de leads;
- deduplicação;
- qualificação;
- briefing;
- matching;
- distribuição de lead;
- SLA;
- cobrança de contato;
- follow-up;
- confirmação de visita;
- lembrete de visita;
- pesquisa pós-visita;
- atualização de CRM;
- cobrança de proposta;
- documentação pendente;
- comunicação com proprietário;
- campanhas comportamentais;
- NPS/CSAT;
- reativação;
- alertas de imóvel compatível;
- redução de preço;
- resumos gerenciais;
- alertas de integração/configuração.

O humano permanece onde agrega valor ou é obrigatório: relacionamento, visita, negociação, decisão, jurídico, aprovação sensível e responsabilidade profissional.

---

# 4. CONFIGURAR UMA VEZ

A gestão deve configurar poucas regras essenciais uma única vez.

Parâmetros:

- SLA de primeiro contato;
- follow-up de lead sem evolução;
- número de tentativas;
- prazo de inatividade;
- lembretes de visita;
- follow-up pós-visita;
- prazo de proposta sem resposta;
- prazo de documentos;
- frequência de atualização ao proprietário;
- prazo de NPS;
- canais habilitados;
- horários de comunicação;
- regras de opt-out;
- escalonamento;
- redistribuição;
- regras por unidade;
- regras por corretor;
- regras por operação;
- regras específicas Luxury.

A UI não deve exigir conhecimento de N8N.

Exemplo de configuração:

`Se o lead ficar sem evolução por [3] dias → lembrar [corretor] por [WhatsApp + dashboard]. Se continuar sem atualização por [1] dia → avisar [gerente].`

---

# 5. LOPITO COMO ADMINISTRADOR DIGITAL

Lopito não deve apenas conversar.

Ele deve monitorar a própria implantação e operação.

Perguntas que precisa responder:

- O que falta configurar?
- Qual automação está desligada?
- Quais corretores estão com follow-up vencido?
- Quais visitas estão sem confirmação?
- Qual integração falhou?
- Quais leads estão parados?
- O que precisa da minha aprovação hoje?
- Qual recurso Full ainda não está ativo?

---

# 6. LOPITO DETECTA PENDÊNCIAS SEM SER CHAMADO

Detectar proativamente:

- WhatsApp não conectado;
- e-mail remetente não validado;
- templates ausentes;
- SLA não definido;
- calendário não conectado;
- certificado digital ausente;
- provider fiscal incompleto;
- segredo OpenAI incorreto;
- source of truth imobiliária sem sync;
- N8N falhando;
- recurso contratado mas inativo;
- perfil sem permissões suficientes.

---

# 7. ALERTA OBJETIVO À GESTÃO

Exemplos:

`Falta definir o prazo de primeiro contato para eu ativar a jornada automática de novos leads.`

`Falta conectar o WhatsApp oficial para ativar os lembretes de visita.`

`Falta configurar o certificado/provider fiscal para automatizar a emissão fiscal das comissões recebidas.`

`Falta definir após quantos dias do fechamento o comprador deve receber a pesquisa de experiência.`

Cada alerta deve possuir CTA direto para a configuração correta.

---

# 8. PAINEL “O QUE FALTA PARA FICAR 100% AUTOMÁTICO?”

Exibir:

`Recurso | Status | Dependência | Impacto | Próxima ação | Responsável`.

Status:

- configurado;
- pendente;
- opcional;
- bloqueado;
- ativo;
- com erro.

---

# 9. HEALTH SCORE DA AUTOMAÇÃO

Calcular com checklist real:

- CRM;
- WhatsApp;
- e-mail;
- Lopito;
- fiscal;
- visitas;
- propostas;
- proprietário;
- N8N;
- BI;
- documentos;
- source of truth.

Nunca inventar percentuais.

---

# 10. INVENTÁRIO — REGRA ABSOLUTA

Reproduzir e sincronizar 100% dos anúncios atuais autorizados da Enjoy.

Nenhum imóvel ativo deve desaparecer por falha de migração.

Para cada anúncio:

- código;
- título;
- operação;
- tipo;
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
- 360;
- planta;
- corretor;
- unidade;
- status;
- exclusividade;
- datas;
- SEO;
- demais campos reais.

---

# 11. SOURCE OF TRUTH

Identificar CRM/API/feed/banco atual da Enjoy.

Arquitetura:

**SOURCE OF TRUTH → API/FEED/DB → STAGING → VALIDATION → NORMALIZATION → DEDUPE → SYNC → BACKEND → FRONT.**

Scraping nunca deve ser integração operacional permanente quando existir fonte oficial.

---

# 12. SINCRONIZAÇÃO CONTÍNUA

Enquanto houver sistema legado ativo, manter sincronização de:

- status;
- preço;
- disponibilidade;
- mídia;
- corretor;
- descrição;
- características.

---

# 13. ZERO REGRESSÃO

Comparar pré e pós-migração:

- total de imóveis;
- ativos;
- por bairro;
- por operação;
- por tipo;
- fotos;
- campos;
- preço;
- status;
- URLs;
- corretores;
- lançamentos;
- Luxury.

Relatório:

`Fonte | Migrado | Divergente | Pendente | Erro | Resolvido`.

---

# 14. URL CANÔNICA

Home:

`https://enjoyimoveis.impulsionando.com.br`

Nunca:

`/enjoyimoveis`

O hostname identifica o tenant.

---

# 15. IDENTIDADE VISUAL

Preservar marca oficial Enjoy/Lopes Enjoy:

- logo;
- cores;
- tipografia;
- fotografia;
- linguagem;
- Luxury;
- elementos institucionais.

Nenhum template genérico de imobiliária.

---

# 16. HOME DE ALTA CONVERSÃO

Hero com:

- Comprar;
- Alugar;
- Lançamentos;
- Luxury;
- Avaliar imóvel;
- Quero vender/alugar;
- Falar com Lopito;
- Falar com corretor.

Blocos:

- busca;
- destaques;
- bairros;
- lançamentos;
- Luxury;
- oportunidades;
- avaliação;
- benefícios;
- prova social;
- unidades;
- conteúdo;
- CTA final.

---

# 17. LOPITO É O DIFERENCIAL PRINCIPAL

Lopito deve ser o cérebro vivo da operação.

Ele deve entender:

- inventário;
- intenção;
- perfil;
- bairros;
- condomínios;
- orçamento;
- preferências;
- corretores;
- visitas;
- propostas;
- proprietários;
- financiamento;
- documentação;
- contratos;
- CRM;
- ERP;
- N8N;
- BI;
- suporte.

---

# 18. BRIEFING CONVERSACIONAL INTELIGENTE

Lead:

`Quero morar na Barra, 3 quartos, perto da praia.`

Lopito deve aprofundar apenas o necessário:

- compra/locação;
- orçamento;
- vagas;
- metragem;
- região;
- praia;
- mobilidade;
- escola;
- pet;
- condomínio;
- varanda;
- vista;
- andar;
- reforma;
- urgência;
- financiamento;
- entrada;
- obrigatórios;
- desejáveis;
- impeditivos.

Perguntas progressivas, não questionário engessado.

---

# 19. HARD FILTERS

Nunca exibir imóvel que viole requisito obrigatório conhecido.

Exemplos:

- preço máximo;
- quartos mínimos;
- vagas;
- bairro;
- pet;
- acessibilidade.

---

# 20. SOFT PREFERENCES

Usar para ranking:

- praia;
- silêncio;
- varanda;
- vista;
- andar alto;
- condomínio-clube;
- escola;
- arquitetura;
- idade do prédio.

---

# 21. MATCHING EXPLICÁVEL

Exibir aderência fundamentada.

Exemplo:

**92% aderente ao seu briefing**

- dentro do orçamento;
- 3 quartos;
- 2 vagas;
- 450m da praia;
- varanda;
- piscina;
- metragem acima da mínima.

Mostrar gaps.

---

# 22. SHORTLIST DE PRECISÃO

Priorizar 3–7 imóveis realmente fortes.

Permitir ampliar resultados.

Evitar inundar o lead.

---

# 23. REFINAMENTO CONTÍNUO

Interpretar:

- estão pequenos;
- não gostei do condomínio;
- quero mais moderno;
- posso aumentar orçamento;
- abro mão da vaga;
- quero mais perto da praia.

Atualizar briefing imediatamente.

---

# 24. APRENDIZADO COM REJEIÇÃO

Se cliente rejeitar por:

- preço;
- tamanho;
- condomínio;
- localização;
- conservação;
- barulho;
- vista;

usar isso no ranking futuro.

---

# 25. BRIEFING PERSISTENTE

Salvar com consentimento:

- orçamento;
- regiões;
- hard filters;
- soft preferences;
- rejeições;
- favoritos;
- vistos;
- urgência;
- financiamento;
- etapa;
- corretor.

---

# 26. OMNICHANNEL REAL

Lopito deve preservar contexto entre:

- site;
- dashboard;
- WhatsApp;
- área do cliente;
- redes sociais quando API permitir;
- corretor.

O lead não deve recomeçar a conversa.

---

# 27. HANDOFF LOPITO → CORRETOR

Corretor recebe:

- lead;
- origem;
- intenção;
- orçamento;
- regiões;
- hard filters;
- preferências;
- imóveis vistos;
- favoritos;
- rejeições;
- shortlist;
- urgência;
- financiamento;
- próxima ação.

---

# 28. CRM IMOBILIÁRIO 360º

Pipeline:

**NOVO → CONTATO → QUALIFICAÇÃO → BRIEFING → MATCHING → IMÓVEIS → VISITA → PROPOSTA → NEGOCIAÇÃO → DOCUMENTAÇÃO → FINANCIAMENTO → CONTRATO → FECHADO → PÓS-VENDA → RETENÇÃO/INDICAÇÃO.**

---

# 29. EVENTOS COMPORTAMENTAIS

Registrar:

- acesso;
- busca;
- filtro;
- briefing;
- imóvel visto;
- favorito;
- comparação;
- compartilhamento;
- WhatsApp;
- shortlist;
- visita;
- proposta;
- documento;
- fechamento;
- retorno;
- indicação.

---

# 30. LEAD SCORING

Considerar:

- completude;
- frequência;
- favoritos;
- comparações;
- retorno;
- visita;
- urgência;
- financiamento;
- respostas;
- proposta.

---

# 31. DISTRIBUIÇÃO AUTOMÁTICA

Critérios:

- bairro;
- condomínio;
- operação;
- valor;
- Luxury;
- lançamento;
- unidade;
- especialista;
- disponibilidade;
- round-robin;
- carga;
- performance governada.

---

# 32. CORRETOR NÃO DEVE GERENCIAR O SISTEMA

A interface do corretor deve dizer o que fazer agora.

Exibir:

- lead;
- briefing;
- shortlist;
- score;
- última interação;
- próxima ação;
- SLA;
- histórico.

Ações rápidas:

- ligar;
- WhatsApp;
- e-mail;
- enviar imóveis;
- agendar;
- registrar;
- tarefa;
- proposta;
- perdido.

---

# 33. SLA DE PRIMEIRO CONTATO

Configurável.

N8N deve:

- iniciar relógio;
- lembrar preventivamente;
- detectar vencimento;
- avisar corretor;
- escalar;
- redistribuir se regra permitir.

---

# 34. LEAD SEM EVOLUÇÃO

Regras configuráveis por dias/horas.

Exemplo:

- D+1 lembrete;
- D+3 follow-up;
- D+7 reativação;
- D+X nurturing.

Sem hard-code universal.

---

# 35. STATE-AWARE N8N

Antes de qualquer disparo:

- lead avançou?;
- visita aconteceu?;
- proposta respondeu?;
- corretor atualizou?;
- opt-out?;
- horário permitido?;
- canal permitido?

---

# 36. IDEMPOTÊNCIA

Evento duplicado não pode duplicar:

- mensagem;
- tarefa;
- ticket;
- proposta;
- follow-up.

---

# 37. RETRY CONTROLADO

Falha temporária deve ser reprocessável sem loop.

---

# 38. TEMPLATES CANÔNICOS

Biblioteca versionada:

- novo lead;
- lead qualificado;
- follow-up;
- imóveis recomendados;
- visita;
- pós-visita;
- proposta;
- documentos;
- proprietário;
- redução de preço;
- novo imóvel;
- reativação;
- NPS;
- fechamento;
- pós-venda.

---

# 39. IDENTIDADE VISUAL AUTOMÁTICA NOS TEMPLATES

E-mail:

- logo;
- cores;
- assinatura;
- CTA;
- corretor/unidade;
- Lopito quando pertinente;
- footer legal;
- opt-out.

Gestão não redesenha campanha.

---

# 40. BRAND VOICE ÚNICA

Configurar uma vez e aplicar em:

- site;
- e-mail;
- WhatsApp;
- Lopito;
- campanhas.

Variações:

- Luxury;
- venda;
- locação;
- proprietário;
- pós-venda.

---

# 41. WHATSAPP

Canal crítico para:

- entrada;
- qualificação;
- shortlist;
- visita;
- lembrete;
- proposta;
- documentação;
- proprietário;
- pós-venda;
- suporte.

---

# 42. COMUNICAÇÃO COM CORRETOR

Cada alerta deve dizer:

- o que aconteceu;
- quem é o lead;
- por que agir;
- prazo;
- CTA direto.

---

# 43. MOBILE-FIRST DO CORRETOR

Notificação abre diretamente:

- lead;
- visita;
- proposta;
- tarefa.

Nunca uma home genérica.

---

# 44. RESUMO DIÁRIO DO CORRETOR

Configurável:

- novos leads;
- follow-ups;
- visitas;
- propostas;
- tarefas críticas.

---

# 45. RESUMO EXECUTIVO DA GESTÃO

Configurável:

- SLAs vencidos;
- conversões;
- visitas;
- propostas;
- exceções;
- integrações;
- configurações pendentes;
- health score.

---

# 46. GESTÃO POR EXCEÇÃO

Gestão deve receber apenas problemas reais:

- integração caiu;
- lead ignorado;
- corretor indisponível;
- proposta crítica;
- divergência de inventário;
- documento inválido;
- certificado vencendo;
- erro fiscal;
- N8N falhou;
- template rejeitado;
- OpenAI indisponível.

---

# 47. AGENDA DE VISITAS

Fluxo:

**imóvel → lead → corretor → disponibilidade → confirmação → lembrete → check-in → feedback → próxima ação.**

---

# 48. MÚLTIPLAS VISITAS

Permitir rota com vários imóveis.

---

# 49. CHECK-IN

Cliente/corretor/QR conforme regra.

Atualizar CRM.

---

# 50. PÓS-VISITA AUTOMÁTICO

Se corretor não registrar feedback dentro do prazo:

- lembrar;
- cobrar;
- escalar.

---

# 51. FEEDBACK DO CLIENTE

Capturar:

- interesse;
- preço;
- tamanho;
- condomínio;
- localização;
- objeções;
- pontos positivos;
- decisão.

---

# 52. ATUALIZAÇÃO DO BRIEFING PÓS-VISITA

Lopito deve aprender preferências novas.

---

# 53. PROPOSTA DIGITAL

- valor;
- condições;
- entrada;
- financiamento;
- validade;
- anexos;
- histórico;
- contraproposta;
- auditoria.

---

# 54. MONITORAMENTO DE PROPOSTAS

Estados:

- criada;
- enviada;
- visualizada quando possível;
- sem resposta;
- contraproposta;
- próxima do vencimento;
- expirada.

---

# 55. DOCUMENTAÇÃO

Estados:

- pendente;
- recebido;
- inválido;
- expirado;
- aprovado;
- rejeitado.

---

# 56. JURÍDICO

Fluxo:

**documentos → análise → pendências → aprovação → contrato → assinatura → evidência.**

IA auxilia, humano decide.

---

# 57. ASSINATURA ELETRÔNICA

Provider homologado + audit trail.

---

# 58. FINANCIAMENTO

- intenção;
- simulação;
- parceiros;
- documentação;
- status;
- pendências;
- APIs;
- alertas.

Nunca garantir aprovação.

---

# 59. ITBI E CUSTOS

Calculadora parametrizada/versionada.

---

# 60. BUSCA TRADICIONAL

Filtros completos:

- operação;
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

# 61. MAPA INTERATIVO

- clusters;
- cards;
- preço;
- raio;
- desenho de área;
- bairros;
- pontos de interesse;
- privacidade de endereço.

---

# 62. BUSCAS SALVAS

Alertas opcionais:

- imóvel compatível;
- redução de preço;
- retorno ao mercado;
- lançamento.

---

# 63. FAVORITOS

Alimentam matching e CRM com consentimento.

---

# 64. COMPARADOR

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
- custos;
- aderência ao briefing.

---

# 65. PÁGINA DO IMÓVEL

- galeria;
- vídeo;
- 360;
- planta;
- preço;
- custos;
- preço/m²;
- localização;
- condomínio;
- diferenciais;
- corretor;
- Lopito;
- similares;
- favoritos;
- comparar;
- compartilhar;
- visita;
- proposta;
- financiamento;
- CTA sticky.

---

# 66. LOPITO CONTEXTUAL NO IMÓVEL

Deve responder:

- atende meu briefing?;
- diferença para o favorito?;
- custos mensais?;
- outro mais barato?;
- posso visitar sábado?

---

# 67. CAPTAÇÃO DE PROPRIETÁRIO

**quero vender/alugar → dados → fotos → avaliação → corretor → visita técnica → documentação → autorização → publicação.**

---

# 68. AVALIAÇÃO / AVM

- comparáveis;
- preço/m²;
- bairro;
- condomínio;
- tipologia;
- histórico;
- confiança.

Não substituir avaliação profissional.

---

# 69. PORTAL DO PROPRIETÁRIO

- imóvel;
- status;
- publicação;
- visualizações agregadas;
- leads agregados;
- visitas;
- propostas;
- feedback;
- documentos;
- contratos;
- financeiro;
- manutenção;
- relatórios.

---

# 70. COMUNICAÇÃO AUTOMÁTICA COM PROPRIETÁRIO

Configurar frequência uma vez.

N8N envia consolidação automática.

---

# 71. CAPTAÇÃO INTERNA

Medir:

- captações;
- exclusividades;
- tempo até publicar;
- qualidade;
- performance.

---

# 72. CADASTRO MASTER DO IMÓVEL

Registro único com histórico.

---

# 73. AUDITORIA DE PREÇO E STATUS

Registrar autor/data/antes/depois.

---

# 74. SCORE DE QUALIDADE DO ANÚNCIO

- fotos;
- vídeo;
- planta;
- descrição;
- preço;
- endereço;
- custos;
- características;
- documentação;
- completude.

---

# 75. IA PARA DESCRIÇÃO

Somente a partir de dados reais.

Nunca inventar:

- vista;
- reforma;
- metragem;
- acabamento;
- infraestrutura;
- proximidade.

---

# 76. MÍDIA

- fotos;
- vídeo;
- drone autorizado;
- 360;
- planta;
- ordem;
- capa;
- direitos;
- otimização.

---

# 77. LANÇAMENTOS

- incorporadora;
- empreendimento;
- estágio;
- unidades;
- plantas;
- materiais;
- tabela autorizada;
- localização;
- interesse;
- eventos;
- corretor.

---

# 78. LOPES ENJOY LUXURY

- curadoria;
- mídia premium;
- privacidade;
- imóveis exclusivos;
- off-market autorizado;
- qualificação;
- concierge Lopito.

---

# 79. PÁGINAS DE BAIRRO

Conteúdo útil e dados reais.

---

# 80. PÁGINAS DE CONDOMÍNIO

Características + inventário real + CTA.

---

# 81. SEO PROGRAMÁTICO GOVERNADO

- canonical;
- sitemap;
- structured data;
- breadcrumbs;
- Open Graph;
- metadados;
- páginas de qualidade.

---

# 82. PORTAIS IMOBILIÁRIOS

Feeds/APIs autorizados.

Status:

- publicado;
- atualizado;
- erro;
- rejeitado;
- removido;
- lead recebido.

---

# 83. LEADS DOS PORTAIS

Entram no CRM central com origem preservada.

---

# 84. REDES SOCIAIS

Integrações oficiais quando disponíveis:

- Instagram;
- Facebook;
- LinkedIn;
- YouTube;
- TikTok.

---

# 85. GOOGLE / META ADS

- UTMs;
- pixels/tags;
- conversões;
- campanhas;
- ROI;
- remarketing consentido;
- lead attribution.

---

# 86. NEWSLETTER

Segmentada por comportamento/intenção.

---

# 87. REATIVAÇÃO

Lopito/N8N devem identificar leads antigos com novo fit.

---

# 88. RETENÇÃO

Relacionamento não termina no fechamento.

Criar jornadas para:

- pós-compra;
- pós-locação;
- aniversário da transação;
- indicação;
- nova necessidade;
- investimento;
- proprietário futuro.

---

# 89. INDICAÇÕES

Programa rastreável e parametrizado quando aprovado.

---

# 90. NPS / CSAT

Após:

- atendimento;
- visita;
- fechamento;
- manutenção.

---

# 91. DETRATOR

Nota abaixo do limite → alerta/ticket automático.

---

# 92. LOCAÇÃO

Fluxo:

**lead → visita → proposta → análise → garantia → contrato → vistoria → chaves → cobrança → manutenção → renovação/encerramento.**

---

# 93. ADMINISTRAÇÃO DE LOCAÇÃO

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

# 94. VISTORIA

Mobile + fotos + vídeos + checklist + assinatura.

---

# 95. MANUTENÇÃO

Ticket por imóvel:

- problema;
- prioridade;
- mídia;
- orçamento;
- aprovação;
- fornecedor;
- conclusão.

---

# 96. ERP FULL

- contas a pagar;
- contas a receber;
- receitas;
- despesas;
- centros de custo;
- unidades;
- comissões;
- repasses;
- conciliação;
- caixa;
- DRE;
- orçamento;
- exportação contábil.

---

# 97. COMISSÕES

Motor parametrizado por:

- corretor;
- captador;
- gerente;
- unidade;
- parceria;
- indicação;
- split;
- condição;
- estorno.

---

# 98. FISCAL

Automatizar emissão fiscal conforme provider/regime real.

---

# 99. CHECKLIST FISCAL DO LOPITO

Verificar:

- dados fiscais;
- provider;
- certificado quando necessário;
- série;
- serviço/código;
- município;
- integração.

---

# 100. CERTIFICADOS

Monitorar vencimento e alertar previamente.

---

# 101. RH / CORRETORES

Cadastro completo de corretor:

- nome;
- CRECI;
- unidade;
- região;
- especialidade;
- escala;
- metas;
- comissão;
- documentos;
- status.

---

# 102. RECRUTAMENTO

- candidatura;
- currículo;
- CRECI;
- entrevista;
- onboarding;
- treinamento;
- aprovação.

---

# 103. TREINAMENTO

- sistema;
- bairros;
- atendimento;
- vendas;
- compliance;
- LGPD;
- segurança;
- Luxury;
- Lopito.

---

# 104. BI EXECUTIVO

- leads;
- origem;
- SLA;
- briefing;
- shortlist;
- visitas;
- propostas;
- conversão;
- VGV;
- receita;
- comissões;
- captações;
- ativos;
- parados;
- exclusividades;
- tempo de mercado;
- unidades;
- corretores;
- bairros;
- CAC/ROI.

---

# 105. BI DO LOPITO

- conversas;
- briefings;
- matching;
- shortlist→visita;
- visita→proposta;
- handoff;
- resolução;
- perguntas sem resposta;
- satisfação;
- custo OpenAI;
- latência.

---

# 106. BI DO CORRETOR

- leads;
- SLA;
- contatos;
- visitas;
- propostas;
- conversão;
- VGV;
- comissão;
- tarefas;
- NPS.

---

# 107. BI DE INVENTÁRIO

- ativos;
- bairros;
- preços;
- tempo;
- reduções;
- visualizações;
- leads;
- visitas;
- propostas;
- liquidez.

---

# 108. ALERTAS INTELIGENTES

- lead sem contato;
- imóvel sem lead;
- views sem visita;
- visitas sem proposta;
- proposta vencendo;
- documento pendente;
- proprietário sem atualização;
- corretor sobrecarregado;
- integração quebrada;
- divergência de source of truth.

---

# 109. ÁREA DO CLIENTE

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
- preferências.

---

# 110. ÁREA DO PROPRIETÁRIO

Conforme módulos anteriores.

---

# 111. ÁREA DO CORRETOR

Mobile-first, orientada a próxima ação.

---

# 112. ÁREA DA GESTÃO

- CRM;
- inventário;
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
- permissões;
- integrações;
- Lopito;
- health score;
- pendências.

---

# 113. MULTIUNIDADE

Filtros, metas, equipes, receitas, custos e indicadores.

---

# 114. TICKETS

Número, prioridade, SLA, responsável, histórico, anexos.

---

# 115. LOPITO É O ÚNICO AGENTE VISÍVEL

Impulsionito nunca aparece para usuários Enjoy.

---

# 116. OPENAI DO LOPITO

Secret oficial:

`OPENAI_API_KEY_ENJOYIMOVEIS_LOPITO`

Cauã deve mapear explicitamente no gateway.

---

# 117. LOPITO — PRIMEIRO ACESSO

Abrir, apresentar, orientar, minimizar.

---

# 118. LOPITO — PERSONAS

Adaptar para:

- comprador;
- locatário;
- investidor;
- proprietário;
- corretor;
- gestor;
- jurídico;
- financeiro.

---

# 119. LOPITO — PROATIVIDADE COMERCIAL

Detectar:

- lead quente;
- lead esfriando;
- novo imóvel compatível;
- redução relevante;
- imóvel retornando ao mercado;
- perfil apto para Luxury;
- oportunidade de visita;
- oportunidade de reativação.

---

# 120. LOPITO — PROATIVIDADE OPERACIONAL

Detectar:

- SLA;
- visita;
- proposta;
- documentação;
- configuração;
- integração;
- tarefa;
- workflow parado.

---

# 121. LOPITO — PROATIVIDADE DE RELACIONAMENTO

Detectar momentos para:

- boas-vindas;
- agradecimento;
- pesquisa;
- indicação;
- reativação;
- pós-venda;
- aniversário da compra/locação.

---

# 122. LOPITO — LIMITES

Nunca:

- inventar imóvel;
- inventar preço;
- inventar característica;
- prometer financiamento;
- prometer valorização;
- emitir parecer jurídico;
- acessar outro tenant;
- revelar dados indevidos;
- executar ação sensível sem permissão.

---

# 123. OMNICHANNEL

Mesma identidade Lopito em todos os canais autorizados.

---

# 124. CUSTOMER 360

Cadastro único para múltiplos papéis.

---

# 125. RBAC

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

# 126. RLS / TENANT ISOLATION

Zero vazamento.

---

# 127. LGPD

- finalidade;
- minimização;
- retenção;
- consentimento;
- opt-out;
- cookies;
- direitos;
- auditoria.

---

# 128. SEGURANÇA

- Vault;
- MFA;
- audit log;
- rate limit;
- backup;
- restore;
- uploads seguros;
- secrets fora do frontend;
- least privilege.

---

# 129. OBSERVABILIDADE

Monitorar:

- front;
- API;
- DB;
- search;
- feeds;
- OpenAI;
- WhatsApp;
- e-mail;
- N8N;
- sync;
- latência.

---

# 130. PERFORMANCE

- CDN;
- lazy loading;
- imagens responsivas;
- WebP/AVIF;
- cache;
- Core Web Vitals;
- paginação.

---

# 131. ACESSIBILIDADE

WCAG como referência.

---

# 132. ZERO MOCK

Nada fictício apresentado como real.

---

# 133. AUDITORIA

Registrar ações críticas de:

- usuário;
- Lopito;
- N8N;
- corretor;
- gestão;
- integrações.

---

# 134. E2E — MIGRAÇÃO

**source → staging → validação → sync → front → reconciliação.**

---

# 135. E2E — BRIEFING

**lead → Lopito → hard/soft → shortlist → explicação → CRM.**

---

# 136. E2E — HANDOFF

**Lopito → corretor → contexto completo → ação → CRM.**

---

# 137. E2E — SLA

**lead → relógio → lembrete → vencimento → escalonamento → auditoria.**

---

# 138. E2E — VISITA

**agendamento → confirmação → lembrete → check-in → feedback → pesquisa.**

---

# 139. E2E — PROPOSTA

**visita → proposta → contraproposta → aceite → documentação.**

---

# 140. E2E — PROPRIETÁRIO

**avaliação → captação → publicação → leads → visitas → propostas → relatório.**

---

# 141. E2E — CONFIGURAÇÃO INICIAL

**login gestão → Lopito → checklist → regras mínimas → dependências → ativação.**

---

# 142. E2E — CONFIGURAÇÃO FALTANTE

**recurso bloqueado → Lopito detecta → alerta → CTA → configuração → ativação.**

---

# 143. E2E — TEMPLATE

**evento → template → identidade Enjoy → variáveis → envio → tracking → CRM.**

---

# 144. E2E — STATE AWARE

Lead avançou antes do timer → mensagem antiga deve ser cancelada.

---

# 145. E2E — OPENAI

**Enjoy → Lopito → secret exclusiva → OpenAI → tools → dados Enjoy.**

Testar falha e cross-tenant.

---

# 146. E2E — PERMISSÕES

- cliente → financeiro interno: NEGADO;
- proprietário → outro proprietário: NEGADO;
- corretor → outro tenant: NEGADO;
- Lopito → secret de outro agente: NEGADO;
- gestor autorizado: PERMITIDO/AUDITADO.

---

# 147. E2E — URL

Home direta no subdomínio, sem slug repetido.

---

# 148. E2E — FISCAL

Configuração → emissão homologada → documento → financeiro → auditoria.

---

# 149. E2E — N8N HEALTH

Workflow crítico falha → alerta → retry → recuperação → log.

---

# 150. CRITÉRIO DE AUTONOMIA

PASS somente quando:

- gestão configura regras uma vez;
- Lopito guia setup;
- Lopito detecta dependências;
- templates estão prontos;
- N8N é state-aware;
- SLA é automático;
- corretor é lembrado;
- visitas são automatizadas;
- propostas são monitoradas;
- proprietário é atualizado;
- pesquisas são automáticas;
- exceções são escaladas;
- gestão não depende de secretária/recepção para rotina.

---

# 151. CRITÉRIO DE GO-LIVE

PASS somente quando:

- inventário PASS;
- front PASS;
- Lopito PASS;
- briefing PASS;
- matching PASS;
- CRM PASS;
- N8N PASS;
- corretores PASS;
- visitas PASS;
- propostas PASS;
- proprietário PASS;
- ERP PASS;
- fiscal PASS quando aplicável;
- WhatsApp PASS;
- e-mail PASS;
- segurança PASS;
- URL PASS;
- P0 = zero;
- P1 impeditivo = zero.

---

# 152. DEMONSTRAÇÃO AO PROPRIETÁRIO DA IMOBILIÁRIA

A experiência de demonstração deve evidenciar em poucos minutos:

1. lead chega;
2. Lopito entende profundamente;
3. mostra poucos imóveis certos;
4. grava briefing;
5. escolhe corretor;
6. entrega contexto;
7. inicia SLA;
8. agenda visita;
9. lembra corretor/cliente;
10. registra feedback;
11. refina matching;
12. acompanha proposta;
13. cobra pendências;
14. atualiza proprietário;
15. mostra tudo no BI.

O gestor deve perceber imediatamente que grande parte da operação administrativa pode desaparecer.

---

# 153. WOW FACTOR

A plataforma deve provocar a percepção:

**“Isso não é um CRM imobiliário. É uma inteligência que administra a operação.”**

---

# 154. REGRA DE UNIVERSALIZAÇÃO

Tudo que for genérico volta ao Core Impulsionando como vertical imobiliária parametrizável.

Nunca carregar marca/dados Enjoy para outro tenant.

---

# 155. REGRA FINAL AO CAUÃ

Construir algo que nenhum dono de imobiliária experiente confunda com um site, CRM ou bot tradicional.

O diferencial é a união de:

**LOPITO + INVENTÁRIO REAL + BRIEFING INTELIGENTE + MATCHING EXPLICÁVEL + CRM 360º + N8N STATE-AWARE + CORRETORES ORQUESTRADOS + PROPRIETÁRIOS INFORMADOS + ERP + BI + AUTOMAÇÃO + GESTÃO POR EXCEÇÃO.**

Se o Lopito apenas conversar, está incompleto.

Se o corretor tiver que lembrar sozinho do follow-up, está incompleto.

Se a gestão precisar distribuir leads manualmente, está incompleto.

Se o proprietário precisar cobrar atualização, está incompleto.

Se o lead precisar repetir o briefing, está incompleto.

Se o sistema disparar mensagem incompatível com o estágio atual, está errado.

Se houver recurso Full parado porque ninguém percebeu uma configuração ausente, está incompleto.

Se a plataforma não surpreender o gestor pela autonomia e inteligência, a execução ainda não chegou ao objetivo deste Intake.

**STATUS: PRODUCT INTAKE V3 DEFINITIVO SALVO PARA EXECUÇÃO FUTURA PELO CAUÃ.**