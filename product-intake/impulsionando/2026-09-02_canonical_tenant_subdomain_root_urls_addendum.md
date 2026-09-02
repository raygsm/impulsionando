# PRODUCT INTAKE — URL CANÔNICA DOS TENANTS / SUBDOMÍNIO COMO HOME

**MODO:** PRODUCT INTAKE  
**BRANCH:** `reengineering/program`  
**EXECUTOR FUTURO:** Cauã / programador  
**ESCOPO:** Core Impulsionando + TODOS os tenants atuais e futuros  
**NÃO EXECUTAR AGORA.**

## REGRA ABSOLUTA

A home pública de cada tenant deve ser exclusivamente a raiz de seu subdomínio:

`https://{slug}.impulsionando.com.br/`

O slug do cliente NÃO pode ser repetido no pathname.

### CORRETO

- `https://raoni.impulsionando.com.br/`
- `https://ontap.impulsionando.com.br/`
- `https://riobeer.impulsionando.com.br/`
- `https://chrismed.impulsionando.com.br/`
- `https://riomed.impulsionando.com.br/`
- `https://anamadu.impulsionando.com.br/`

### INCORRETO

- `https://raoni.impulsionando.com.br/raoni`
- `https://ontap.impulsionando.com.br/ontap`
- `https://riobeer.impulsionando.com.br/riobeer`
- `https://chrismed.impulsionando.com.br/chrismed`

A rota interna usada pelo frontend para resolver tenant não pode vazar para a URL pública.

## IMPLEMENTAÇÃO FUTURA

Cauã deve auditar o mecanismo atual de subdomain routing e preservar os fronts corretos. Corrigir a camada de roteamento/rewriting para que o hostname resolva internamente o tenant e entregue a home em `/`.

Não duplicar páginas nem criar uma segunda home. O objetivo é URL limpa e canônica.

## ROTAS INTERNAS LEGÍTIMAS

Rotas funcionais continuam permitidas depois da raiz quando representam páginas reais, por exemplo:

- `/login`
- `/agendar`
- `/eventos`
- `/minha-conta`
- `/gestao`

O proibido é o prefixo redundante do próprio tenant, como `/raoni`, `/ontap`, `/chrismed` etc. apenas para chegar à home.

## COMPATIBILIDADE / REDIRECT

URLs antigas redundantes já indexadas ou compartilhadas devem, quando aplicável, responder com redirect permanente para a URL canônica equivalente, preservando query string/UTM quando seguro.

Exemplo:

`raoni.impulsionando.com.br/raoni?utm_source=x` → `raoni.impulsionando.com.br/?utm_source=x`

Evitar redirect loop.

## SEO

Cada tenant deve publicar canonical apontando para sua URL limpa no subdomínio. Sitemap, Open Graph, links internos, CTAs, CRM, e-mail, WhatsApp, vitrine e campanhas devem gerar URLs canônicas sem repetição do slug.

## ESCOPO GLOBAL

A regra vale para TODOS os tenants atuais e para provisionamento automático de qualquer novo tenant. Não corrigir somente Raoni.

O provisionador deve produzir desde o início:

`tenant.impulsionando.com.br/`

Nunca:

`tenant.impulsionando.com.br/tenant`

## TESTES E2E

Para cada tenant ativo:

1. abrir `https://{slug}.impulsionando.com.br/`;
2. confirmar HTTP/HTTPS correto;
3. confirmar que a home certa é renderizada;
4. confirmar que o endereço permanece na raiz `/`;
5. confirmar que nenhum redirect adiciona `/{slug}`;
6. testar refresh direto;
7. testar navegação interna;
8. testar mobile;
9. testar canonical;
10. testar URLs antigas redundantes e redirect sem loop;
11. confirmar isolamento entre tenants;
12. confirmar SHA/build publicado conforme processo de deploy.

## CRITÉRIO DE ACEITE

PASS somente quando 100% dos tenants ativos tiverem:

- subdomínio correto;
- home na raiz `/`;
- nenhum slug redundante pós-domínio;
- links internos corretos;
- canonical correto;
- redirects legados seguros;
- nenhuma regressão de front;
- nenhuma quebra de auth/checkout/dashboard;
- isolamento multi-tenant preservado.

## REGRA FINAL AO CAUÃ

**O subdomínio identifica o tenant. A raiz `/` é a home. O nome do tenant não deve ser repetido no pathname para acessar a home.**

Corrigir isso na arquitetura de roteamento de forma universal, não com remendos individuais por cliente.

**STATUS: PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA.**