# PRODUCT INTAKE — ENJOY IMÓVEIS — LOPITO

**MODO:** PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**TENANT:** Enjoy Imóveis / Lopes Enjoy Imóveis  
**SUBDOMÍNIO:** `https://enjoyimoveis.impulsionando.com.br`  
**AGENTE ESPECIALIZADO OFICIAL:** **Lopito**  
**NÃO EXECUTAR AGORA.**

## 1. DEFINIÇÃO OFICIAL

A partir deste Intake, **Lopito** é o nome oficial do agente virtual da Enjoy Imóveis.

Esta definição substitui a pendência de nome existente no Superprompt Mestre da Enjoy.

Arquitetura:

**Impulsionito (Core interno e invisível) → Lopito (agente especializado/protagonista visível) → Enjoy Imóveis**

O Impulsionito não deve ser exibido aos usuários do tenant Enjoy. A identidade visível em front, dashboard, área do cliente, área do proprietário, área do corretor, WhatsApp e demais canais autorizados deve ser **Lopito**.

## 2. CÉREBRO VIVO DA IMOBILIÁRIA

Lopito deve ser implementado como cérebro vivo e protagonista da operação Enjoy, não como simples chatbot.

Deve compreender, conforme autenticação e RBAC:

- inventário real de imóveis;
- compra, venda e locação;
- bairros e condomínios;
- lançamentos;
- Lopes Enjoy Luxury;
- perfil e intenção do cliente;
- favoritos e comparações;
- corretores;
- agenda e visitas;
- propostas e contrapropostas;
- captação de imóveis;
- proprietários;
- documentação;
- financiamento;
- contratos;
- CRM;
- ERP/financeiro permitido;
- campanhas;
- N8N;
- BI;
- tickets e suporte.

## 3. JORNADA DO COMPRADOR/LOCATÁRIO

Lopito deve transformar linguagem natural em busca real.

Exemplo:

“Quero apartamento de 3 quartos no Jardim Oceânico, até R$ 2 milhões, perto do metrô.”

Fluxo:

**intenção → critérios → inventário real → ranking → explicação → comparação → favorito → corretor → visita → proposta → próximos passos.**

Nunca inventar imóvel, preço, disponibilidade, metragem, característica ou localização.

## 4. JORNADA DO PROPRIETÁRIO

Lopito deve orientar:

**quero vender/alugar → dados do imóvel → avaliação/triagem → captação → corretor → documentação → publicação → visitas/propostas → acompanhamento.**

## 5. JORNADA DO CORRETOR

Conforme RBAC, Lopito pode ajudar com:

- novos leads;
- leads sem contato;
- agenda;
- visitas;
- follow-ups;
- imóveis compatíveis;
- propostas;
- documentos pendentes;
- tarefas;
- metas;
- indicadores.

## 6. JORNADA DA GESTÃO

Lopito deve responder em linguagem natural com dados reais e período/fonte, por exemplo:

- “quantos leads estão sem atendimento?”;
- “qual unidade converte mais?”;
- “quais imóveis estão parados?”;
- “qual VGV está em negociação?”;
- “quais visitas temos hoje?”;
- “quais propostas vencem esta semana?”

## 7. PROATIVIDADE

Quando autorizado, Lopito pode detectar e sugerir ações sobre:

- lead sem atendimento;
- imóvel compatível com cliente;
- imóvel parado;
- alteração de preço;
- visita sem follow-up;
- proposta expirando;
- documento pendente;
- proprietário aguardando retorno;
- campanha/oportunidade;
- gargalo de funil.

Sugestão não significa execução irrestrita. Respeitar confirmação, RBAC e auditoria.

## 8. OPENAI

Lopito deverá possuir sua **própria API key OpenAI**, pertencente à conta/projeto OpenAI Impulsionando e consumindo os créditos desse projeto, conforme regra global dos agentes especializados.

Referência de secret name:

`OPENAI_API_KEY_ENJOYIMOVEIS_LOPITO`

O programador deve validar o padrão oficial antes de criar/migrar a secret.

Obrigatório:

- Vault/secret manager;
- nunca frontend;
- nunca GitHub;
- nunca logar valor;
- tenant/agent mapping explícito;
- isolamento cross-tenant;
- métricas de uso/custo;
- rate limit;
- fallback seguro.

## 9. PRIMEIRO ACESSO

No primeiro acesso autenticado, Lopito deve abrir, apresentar-se brevemente, oferecer ajuda e depois minimizar automaticamente, permanecendo acessível.

Não repetir de forma invasiva em todos os logins.

## 10. OMNICHANNEL

A identidade lógica deve permanecer Lopito em todos os canais autorizados:

- front;
- dashboard;
- área do cliente;
- área do proprietário;
- área do corretor;
- WhatsApp oficial;
- redes sociais quando APIs oficiais permitirem;
- suporte.

## 11. SEGURANÇA

Obrigatório:

- RLS;
- RBAC;
- tenant isolation;
- tool permissions;
- audit log;
- least privilege;
- nenhuma exposição de secret;
- nenhum acesso a outro tenant;
- nenhuma ação financeira/jurídica crítica sem autorização adequada.

## 12. TESTES E2E

Executar no mínimo:

1. home canônica `enjoyimoveis.impulsionando.com.br`;
2. Lopito aparece, Impulsionito não aparece;
3. busca em linguagem natural consulta inventário real;
4. imóvel inexistente não é inventado;
5. cliente agenda visita;
6. proprietário inicia captação;
7. corretor consulta seus leads;
8. gestor consulta BI;
9. perfil sem permissão tenta financeiro → NEGADO;
10. tentativa cross-tenant → NEGADO;
11. backend resolve a chave OpenAI exclusiva do Lopito;
12. logs não revelam secret;
13. falha de OpenAI degrada com segurança;
14. mobile e canais autorizados mantêm identidade Lopito.

## 13. CRITÉRIO DE ACEITE

PASS somente quando:

- Lopito é o agente oficial e visível da Enjoy;
- nenhuma identidade Impulsionito aparece para usuários do tenant;
- Lopito está conectado ao inventário/CRM/ferramentas reais conforme permissão;
- chave OpenAI dedicada está configurada com segurança;
- isolamento PASS;
- E2E PASS;
- nenhuma informação imobiliária inventada;
- nenhuma configuração mock é apresentada como produção.

## REGRA FINAL

**Lopito é o cérebro vivo e protagonista digital da Enjoy Imóveis. Impulsionito permanece como Core/orquestrador interno e invisível.**

Se Lopito apenas conversar, está incompleto. Deve compreender o negócio, consultar dados reais, orientar, recomendar, executar ações autorizadas, registrar eventos, aprender com sinais operacionais e escalar para humano quando necessário.

**STATUS: PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA PELO CAUÃ.**