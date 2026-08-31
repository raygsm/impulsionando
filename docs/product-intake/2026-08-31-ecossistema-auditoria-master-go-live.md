# Product Intake — Auditoria Master do Ecossistema Impulsionando

## Status
APPROVED / IN_PROGRESS

## Data
2026-08-31

## Origem
Comando explícito do dono do produto: executar integralmente o último superprompt de auditoria, começando pela CHRISMED, preservando o que estiver correto, corrigindo o que estiver incorreto e validando o funcionamento real de todo o ecossistema.

## Escopo
- CHRISMED como primeira fase obrigatória;
- Core Impulsionando;
- todos os tenants atuais e futuros encontrados no inventário;
- identidade visual e logos oficiais;
- frontend, backend, banco, APIs, auth, RLS, RBAC;
- plano Full e módulos habilitados;
- CRM, ERP, PDV, estoque, agenda, billing, fiscal, BI;
- N8N, automações, nurturing e jornadas;
- agentes, Impulsionito, RAG, memória, tools/MCPs;
- Clube, white-label, vitrine, Private Chat;
- infraestrutura, DNS, SSL, VPS, reverse proxy, publicação da main;
- segurança, LGPD, logs, observabilidade e rollback;
- QA ponta a ponta por ator e por vertical;
- demos e verticais, incluindo DIBA e bares/restaurantes, após resolução de identidade quando necessário.

## Regra
Não declarar funcionalidade como pronta sem evidência de teste. DEPLOYED != CLOSED.

## Ordem
1. CHRISMED
2. Core Impulsionando
3. tenants ativos
4. demos prioritários
5. bares/restaurantes/cervejarias
6. materiais de construção/DIBA
7. demais verticais
8. testes transversais
9. segurança
10. QA completo
11. deploy controlado
12. verificação real
13. documentação e fechamento

## Evidências — Onda inicial CHRISMED

### Infraestrutura/publicação
- VPS real confirmada: `srv1777313`.
- `nginx`, `docker` e `impulsionando-core.service` ativos.
- Runtime público CHRISMED está atualmente roteado para canary `core-bfdc-canary` na porta local `3488`.
- Imagem do canary: `impulsionando-core:c054ceb3da481cb5cfe3778fa4249d7ff6820a6b`.
- Release metadata confirma SHA `c054ceb3da481cb5cfe3778fa4249d7ff6820a6b`, build `2026-08-31T15:43:21Z`.
- A `main` já está à frente desse SHA por alterações documentais de Product Intake; portanto não tratar o simples fato de `main` estar à frente como regressão do runtime.
- Há múltiplos containers preview/test/legado simultaneamente ativos. Não remover sem classificação e prova de não uso.

### Correção aplicada em produção — roteamento CHRISMED
Foi detectado que o Nginx possuía redirects legados que interceptavam rotas válidas do runtime:
- `/agendar -> /?acao=agendar`
- `/dra-cristiane -> /?secao=dra-cristiane`
- `/gms -> /?secao=gms`

Evidência mostrou que o runtime em `:3488` já atende `/agendar` e `/dra-cristiane` diretamente com HTTP 200. Os redirects legados foram removidos, com backup prévio da configuração e `nginx -t` aprovado antes de reload.

Estado verificado após correção:
- `/agendar` = HTTP 200 direto;
- `/dra-cristiane` = HTTP 200 direto;
- `/gms` não possui rota TanStack própria; alias controlado mantido como `302 -> /internacional`;
- `/internacional` = HTTP 200.

### Front/identidade CHRISMED
Produção observada usa assets reais:
- `/brand/chrismed/brasao.jpg`
- `/brand/chrismed/logo-horizontal.webp`
- `/brand/chrismed/dra-christiane-alencar.png`

Header responsivo, drawer mobile, CTA de agenda, PT/EN/ES, footer e Oliver estão presentes no HTML SSR atual. Isso supera achados históricos da Wave 1 em que logo/menu mobile estavam quebrados; ainda requer QA visual por breakpoint antes de marcar VERIFIED.

### Tenant/Core/Supabase
CHRISMED encontrada no banco com company id canônico `642096b5-a9ff-4521-a82a-c004f6d2e2d2`, ativa, não-demo e e-mail `sac@chrismed.com.br`.

`core_tenant_identity` confirma:
- subdomain `chrismed`;
- root domain `impulsionando.com.br`;
- DNS `active`;
- SSL `issued`;
- canonical URL `https://chrismed.impulsionando.com.br`;
- auto provision ativo.

`core_client_enrollment` confirma plano associado e acesso Full interno, mas lifecycle ainda está `plan_required`, com contrato/comercial pendente. Isso é uma inconsistência de lifecycle a ser resolvida sem criar cobrança histórica indevida.

### Plano Full — achado crítico de governança
O plano associado é `ENTERPRISE / Full`, mensal, vencimento dia 5, ativo. Metadata declara `modules_policy=all_included_unlimited_use` e `commercial_level=full`.

Porém, a tabela `billing_plan_modules` atualmente contém somente três módulos certificados/incluídos para esse plano:
- Agenda;
- CRM;
- Central de Suporte.

E `company_modules` não possui linhas explícitas para CHRISMED.

Conclusão: NÃO é tecnicamente válido afirmar neste momento que todo o catálogo Full está 100% habilitado/homologado. É necessário reconciliar catálogo, entitlement dinâmico, módulos certificados e configuração do tenant antes da declaração final.

### Mercado Pago — P1
A rota de código `/api/public/health/mp/:slug` existe no SHA em produção, mas chamada real para `/api/public/health/mp/chrismed` retorna `404 {status:not_found, tenant:chrismed}`.

A causa observável é drift de schema/implementação: a rota procura `companies.subdomain/public_slug`, enquanto o schema real de `companies` não possui essas colunas; a identidade de subdomínio está em `core_tenant_identity`.

Esse health endpoint precisa ser corrigido para resolver tenant pela fonte canônica de identidade. Até isso e as credenciais externas serem validados, Mercado Pago CHRISMED permanece NÃO HOMOLOGADO ponta a ponta.

### Templates de comunicação
Tenant de comunicação CHRISMED identificado como `94bf647c-c851-41ab-8700-1e062263e54d`.

Existe biblioteca extensa de templates EMAIL publicados em pt-BR cobrindo, entre outros:
- conta/boas-vindas/suspensão/reativação;
- criação, confirmação, cancelamento, remarcação e lembretes de consulta;
- check-in e pesquisa;
- eventos;
- profissional;
- paciente;
- pagamento;
- fiscal;
- pega-agenda;
- suporte;
- ocupacional.

Achado: a consulta atual não demonstrou equivalência multicanal nem cobertura EN/ES. Portanto templates existem e estão publicados, mas a camada multicanal/multilíngue ainda não pode ser declarada completa.

### N8N
Container real `n8n-umlg-n8n-1` está ativo e exposto no runtime da VPS.

O registry/tenant state possui 31 jornadas CHRISMED entre agenda, CRM, clínica, eventos, ocupacional, comunicação, financeiro, pega-agenda e relacionamento. A maioria está `READY`; `chrismed.outbox.processor` aparece `ACTIVE`.

A inspeção direta do N8N confirma workflows CHRISMED efetivamente instalados, inclusive versões com prefixo CHRISMED. Porém `last_execution_at` está nulo nos estados consultados. Logo, presença/configuração NÃO será tratada como prova de execução E2E. Cada jornada crítica deve ser disparada e verificada antes de homologação.

## Riscos já abertos
- P1: health per-tenant Mercado Pago resolve tenant por colunas inexistentes no schema atual.
- P1: catálogo Full declarado por política não está reconciliado com módulos certificados/incluídos.
- P1: lifecycle CHRISMED permanece `plan_required` apesar de plano Full associado e operação autorizada.
- P1: jornadas N8N existem, mas não possuem evidência de execução registrada no tenant state.
- P2: templates publicados demonstrados somente em EMAIL pt-BR na consulta inicial; falta comprovar cobertura multicanal PT/EN/ES.
- P2: grande quantidade de containers preview/test/legado ativos na VPS requer classificação antes de limpeza.
- P3: warning Nginx de MIME type duplicado em `impulsionando-static-assets.conf` deve ser saneado após garantir ausência de regressão.

## Critério final
Cada item deve terminar com evidência de estado: não auditado / auditado / falhou / corrigido / testado / homologado / deployado / verificado.