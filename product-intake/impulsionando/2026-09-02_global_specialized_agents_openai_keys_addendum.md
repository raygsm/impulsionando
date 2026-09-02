# PRODUCT INTAKE — AGENTES ESPECIALIZADOS POR TENANT + CHAVES OPENAI DEDICADAS

**MODO:** PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**ESCOPO:** TODOS os tenants atuais e futuros do Ecossistema Impulsionando  
**NÃO EXECUTAR AGORA.**

## 1. REGRA GLOBAL DE IDENTIDADE DOS AGENTES

Cada tenant deve possuir e exibir exclusivamente seu próprio agente virtual especializado.

O **Impulsionito é o orquestrador central interno do Core Impulsionando**, porém **não deve ser exibido ao cliente final nem aparecer como agente visível dentro dos tenants dos clientes**.

Arquitetura conceitual:

`Impulsionito (Core interno/orquestrador) → agente especializado do tenant → usuário final/gestão daquele tenant`

Exemplos já definidos:

- CHRISMED → Oliver;
- Colors Saúde → Íris;
- WMP → Milito;
- Marocas → Maroquito;
- Ana Madú → Annita;
- RioMed → Medicito;
- CSI Investimentos → Investito;
- Rio Beer → Bierito;
- On Tap → Tapito;
- Boteco do Raoni → Raonito;
- demais tenants → agente especializado oficial próprio, nunca `Impulsionito` como nome/identidade visível.

## 2. REGRA DE EXIBIÇÃO

Em qualquer tenant cliente, revisar e remover referências visuais/textuais genéricas a `Impulsionito` quando o usuário final deveria enxergar o agente especializado daquele cliente.

O cliente deve perceber apenas o agente da sua marca/tenant.

O Impulsionito pode continuar atuando internamente na orquestração, roteamento, políticas, ferramentas compartilhadas, memória/contexto permitido e governança do Core.

## 3. CHAVE OPENAI DEDICADA POR AGENTE

Todos os agentes especializados deverão operar com **sua própria chave/API key da OpenAI**, criada/gerenciada dentro da conta/projeto OpenAI da Impulsionando, de modo que o consumo seja debitado dos créditos/projeto Impulsionando conforme a configuração oficial vigente.

Não compartilhar uma mesma secret entre todos os agentes quando a arquitetura oficial do projeto exigir segregação individual por agente.

## 4. PADRÃO DE NOMENCLATURA

Cauã deve auditar os secrets existentes e adotar padrão único, explícito e estável.

Referência conceitual:

- `OPENAI_API_KEY_CHRISMED_OLIVER`
- `OPENAI_API_KEY_COLORS_IRIS`
- `OPENAI_API_KEY_WMP_MILITO`
- `OPENAI_API_KEY_MAROCAS_MAROQUITO`
- `OPENAI_API_KEY_ANAMADU_ANNITA`
- `OPENAI_API_KEY_RIOMED_MEDICITO`
- `OPENAI_API_KEY_CSI_INVESTITO`
- `OPENAI_API_KEY_RIOBEER_BIERITO`
- `OPENAI_API_KEY_ONTAP_TAPITO`
- `OPENAI_API_KEY_RAONI_RAONITO`

Se já existir nome oficial diferente em produção, não renomear cegamente. Primeiro mapear, documentar dependências e migrar sem quebra.

## 5. LOCAL DE ARMAZENAMENTO

Secrets devem seguir o padrão de segurança já definido no ecossistema:

- Supabase Vault / mecanismo secreto homologado do projeto;
- nunca no frontend;
- nunca em código versionado;
- nunca em `.env` exposto;
- nunca em logs;
- nunca em respostas de API ao cliente;
- nunca em analytics.

## 6. MAPEAMENTO TENANT → AGENTE → SECRET

Criar/validar registro canônico que permita resolver de forma segura:

`tenant_id → agent_id → agent_name → openai_secret_name → status → model/config → tool policy`

Esse mapeamento deve estar protegido e acessível somente ao backend/orquestrador autorizado.

## 7. ISOLAMENTO

Cada requisição de agente deve carregar contexto explícito do tenant.

Obrigatório testar que:

- Oliver não usa chave/config/contexto da Íris;
- Tapito não usa chave/contexto do Raonito;
- Bierito não consulta dados do RioMed;
- nenhum agente consulta dados de outro tenant;
- nenhum usuário consegue escolher manualmente secret de outro agente.

## 8. CONSUMO / OBSERVABILIDADE

Registrar métricas por agente/tenant:

- chamadas;
- tokens quando disponíveis;
- custo estimado/real quando disponível;
- latência;
- erros;
- rate limit;
- ferramenta utilizada;
- volume por dia/mês;
- status da chave;
- falhas de autenticação.

Sem registrar conteúdo sensível além do necessário e permitido.

## 9. LIMITES E ORÇAMENTO

Preparar controles configuráveis por agente/tenant:

- budget mensal;
- alertas de consumo;
- rate limit;
- circuit breaker;
- proteção contra loop de automação;
- filas/retry controlado.

Não deixar agente gerar custo infinito por erro de workflow.

## 10. FALLBACK SEGURO

Se a chave dedicada de um agente falhar:

- não expor erro técnico ao usuário;
- não trocar silenciosamente para chave de outro cliente;
- registrar incidente;
- alertar gestão;
- usar fallback central somente se houver política explícita aprovada e isolamento mantido;
- caso contrário, degradar com mensagem segura de indisponibilidade temporária.

## 11. PRIMEIRO ACESSO

Em cada tenant, o agente especializado — e somente ele — deve executar a experiência de onboarding já definida:

**primeiro login → agente especializado abre → apresenta-se → oferece ajuda → minimiza automaticamente → permanece acessível.**

Nunca apresentar `Impulsionito` ao usuário do tenant.

## 12. CANAIS

O mesmo agente especializado deve ser a identidade lógica nos canais autorizados do tenant:

- chat do front;
- dashboard;
- área do cliente;
- WhatsApp oficial;
- Instagram/Messenger quando API permitir;
- outros canais integrados.

A identidade do agente deve permanecer consistente entre canais.

## 13. CORE COMPARTILHADO SEM MARCA COMPARTILHADA

Ferramentas, políticas e raciocínio podem vir do Core Impulsionando, mas o usuário do tenant vê a marca/agente do próprio cliente.

Exemplo:

- motor de tickets = Core;
- CRM = Core;
- ERP = Core;
- N8N = Core;
- policies = Core;
- orquestração Impulsionito = interna;
- identidade visível = agente especializado do tenant.

## 14. MIGRAÇÃO DE REFERÊNCIAS EXISTENTES

Cauã deve procurar em:

- frontend;
- prompts de sistema;
- componentes de chat;
- N8N;
- edge functions;
- templates de e-mail/WhatsApp;
- banco/configurações;
- docs operacionais;

qualquer referência que faça um tenant cliente exibir `Impulsionito` onde deveria exibir seu agente próprio.

Corrigir sem alterar o conceito de Impulsionito como Core interno.

## 15. TESTE E2E POR TENANT

Para cada tenant ativo:

1. abrir subdomínio canônico;
2. realizar login/primeiro acesso;
3. confirmar nome correto do agente;
4. confirmar que `Impulsionito` não aparece visualmente;
5. enviar pergunta;
6. backend resolve secret dedicado correto;
7. chamada OpenAI retorna com sucesso;
8. ferramenta consulta apenas dados do tenant;
9. resposta mantém personalidade/contexto correto;
10. logs mostram agent_id/tenant_id corretos sem secret;
11. testar erro de chave;
12. testar rate limit;
13. testar tentativa cross-tenant;
14. testar mobile e canais integrados.

## 16. INVENTÁRIO OBRIGATÓRIO

Antes de marcar PASS, gerar matriz real:

`Tenant | Agente visível | Secret esperado | Secret existente? | Vault? | Teste OpenAI | Cross-tenant | Front | WhatsApp | Status`

Nenhum tenant ativo deve ficar sem agente corretamente configurado.

## 17. CRITÉRIO DE ACEITE

PASS somente quando:

- todos os tenants ativos possuem agente especializado oficial;
- nenhum tenant cliente exibe Impulsionito como identidade visível;
- cada agente possui secret/chave dedicada conforme padrão aprovado;
- secrets pertencem ao projeto/conta OpenAI Impulsionando;
- secrets estão no Vault;
- nenhuma chave está exposta;
- E2E OpenAI funciona por agente;
- isolamento tenant PASS;
- observabilidade PASS;
- fallback seguro PASS;
- custos/limites podem ser monitorados;
- nenhuma configuração mock é apresentada como funcional.

## 18. REGRA FINAL AO CAUÃ

**Impulsionito é o cérebro/orquestrador invisível do ecossistema. O protagonista visível de cada cliente é exclusivamente o agente especializado daquele tenant.**

Cada agente deve possuir identidade, contexto, permissões e credencial OpenAI dedicados, consumindo a infraestrutura/créditos da conta/projeto Impulsionando conforme a arquitetura oficial.

Não basta trocar o nome na interface. É necessário garantir a cadeia completa:

**TENANT → AGENTE CORRETO → SECRET CORRETO → CONTEXTO CORRETO → FERRAMENTAS CORRETAS → DADOS CORRETOS → OBSERVABILIDADE → SEGURANÇA.**

**STATUS: PRODUCT INTAKE SALVO PARA EXECUÇÃO E TESTES FUTUROS PELO PROGRAMADOR.**