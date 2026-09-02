# PRODUCT INTAKE — PADRÃO GLOBAL DE URL CANÔNICA DOS TENANTS

**MODO:** PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**ESCOPO:** Core Impulsionando + TODOS os tenants atuais e futuros  
**NÃO EXECUTAR AGORA.**

## REGRA GLOBAL DEFINITIVA

A home canônica de cada cliente/tenant é exclusivamente:

`https://cliente.impulsionando.com.br`

O subdomínio já identifica o tenant. Portanto, **nunca repetir o nome, slug, alias, singular ou plural do cliente depois do domínio para chegar à home**.

### PADRÃO CORRETO

- `https://raoni.impulsionando.com.br`
- `https://ontap.impulsionando.com.br`
- `https://riobeer.impulsionando.com.br`
- `https://chrismed.impulsionando.com.br`
- `https://riomed.impulsionando.com.br`
- `https://anamadu.impulsionando.com.br`
- `https://cliente.impulsionando.com.br`

### PADRÕES INCORRETOS / PROIBIDOS COMO HOME

- `https://raoni.impulsionando.com.br/raoni`
- `https://ontap.impulsionando.com.br/ontap`
- `https://riobeer.impulsionando.com.br/riobeer`
- `https://chrismed.impulsionando.com.br/chrismed`
- `https://cliente.impulsionando.com.br/cliente`
- `https://cliente.impulsionando.com.br/clientes`

A rota interna do frontend pode continuar existindo para resolução técnica, mas ela não pode aparecer na URL pública.

## PRINCÍPIO DE ROTEAMENTO

O hostname resolve o tenant:

`{slug}.impulsionando.com.br` → tenant `{slug}` → renderizar home na raiz.

A home deve permanecer em `/`, sem redirecionamento para `/{slug}`.

Corrigir isso na camada compartilhada de subdomain routing/rewrite, não com patches individuais por cliente.

## ROTAS FUNCIONAIS LEGÍTIMAS

Subrotas continuam permitidas quando representam funcionalidades reais, por exemplo:

- `/login`
- `/gestao`
- `/agendar`
- `/eventos`
- `/minha-conta`
- `/checkout`

O que é proibido é usar o próprio slug do tenant apenas como prefixo redundante para acessar essas páginas quando o hostname já identifica o tenant.

A arquitetura futura deve preferir, por exemplo:

`chrismed.impulsionando.com.br/agendar`

em vez de:

`chrismed.impulsionando.com.br/chrismed/agendar`

quando isso puder ser feito sem quebrar contratos internos legítimos.

## REDIRECTS LEGADOS

URLs redundantes já compartilhadas ou indexadas devem ser migradas com redirect permanente seguro para a URL canônica equivalente.

Exemplos:

`raoni.impulsionando.com.br/raoni` → `raoni.impulsionando.com.br`

`cliente.impulsionando.com.br/clientes` → `cliente.impulsionando.com.br`

Preservar query string e UTM quando apropriado e seguro.

Evitar loops.

## SEO E LINKS

Atualizar para o padrão canônico:

- `<link rel="canonical">`;
- sitemap;
- Open Graph;
- links internos;
- CTAs;
- CRM;
- e-mail;
- WhatsApp;
- campanhas;
- UTMs;
- vitrine Impulsionando;
- onboarding;
- QR codes.

Nenhum novo link gerado pelo sistema deve repetir o slug do cliente depois do domínio.

## PROVISIONAMENTO DE NOVOS CLIENTES

O provisionador automático deve gerar desde o primeiro momento:

`cliente.impulsionando.com.br`

Nunca:

`cliente.impulsionando.com.br/cliente`

ou:

`cliente.impulsionando.com.br/clientes`

Esta regra é parte do template universal de criação de tenant.

## AUDITORIA DE TODOS OS TENANTS EXISTENTES

Cauã deve levantar todos os tenants ativos e validar um a um, mas corrigir a causa no Core.

Matriz mínima:

`Tenant | Subdomínio | Home esperada | Home atual | Slug repetido? | Redirect legado | Canonical | Links internos | Status`

## TESTES E2E OBRIGATÓRIOS

Para cada tenant ativo:

1. abrir `https://{slug}.impulsionando.com.br`;
2. confirmar que a home correta renderiza;
3. confirmar que a URL permanece no subdomínio raiz;
4. confirmar que nenhum redirect adiciona `/{slug}` ou alias equivalente;
5. testar refresh direto;
6. testar navegação interna;
7. testar login/auth;
8. testar dashboard/gestão;
9. testar checkout/agendamento quando aplicável;
10. testar mobile;
11. validar canonical;
12. validar links gerados por CRM/e-mail/WhatsApp;
13. testar URLs antigas redundantes e redirects;
14. confirmar ausência de loop;
15. confirmar isolamento multi-tenant;
16. confirmar que o front correto do tenant não foi trocado durante a correção.

## CRITÉRIO DE ACEITE

PASS somente quando 100% dos tenants ativos apresentarem:

- subdomínio correto;
- home diretamente em `cliente.impulsionando.com.br`;
- nenhum nome/slug/alias repetido depois do domínio para chegar à home;
- canonical correto;
- redirects legados funcionando;
- links internos e externos atualizados;
- nenhuma regressão de front;
- auth/checkout/dashboard preservados;
- isolamento de tenants preservado.

## REGRA FINAL AO CAUÃ

**`cliente.impulsionando.com.br` É A HOME CANÔNICA.**

**NUNCA REPETIR O NOME/SLUG DO CLIENTE APÓS O DOMÍNIO.**

O subdomínio identifica o tenant. A correção deve ser estrutural, universal e aplicada também ao provisionamento de todos os novos clientes.

**STATUS: PRODUCT INTAKE FINALIZADO PARA EXECUÇÃO FUTURA PELO PROGRAMADOR.**