# Auditoria de segurança e autossuficiência

Data: 2026-06-24  
Escopo: auditoria documental e endurecimento de arquivos de ambiente.  
Branch: `codex/security-autonomy-audit`

## Decisão executiva

O Impulsionando Core já tem estrutura suficiente para operar como sistema mãe fora do Lovable, mas ainda existem dependências técnicas e operacionais que precisam ser isoladas antes de declarar independência total.

Esta auditoria não altera frontend, produção, regras de negócio, rotas, banco, workflows ou integrações em runtime. As mudanças aplicadas são apenas:

- criação de `.env.example` sem valores reais;
- reforço de `.gitignore` para impedir novos commits de ambientes reais;
- documentação de dependências, riscos e plano de autonomia.

## Achado crítico: arquivos de ambiente versionados

Foram encontrados arquivos reais controlados pelo Git:

| Arquivo | Existe | Versionado | Ação recomendada |
| --- | --- | --- | --- |
| `.env` | Sim | Sim | Remover do rastreamento do Git e rotacionar credenciais expostas |
| `.env.local` | Não | Não | Usar como arquivo local padrão |
| `.env.production` | Sim | Sim | Remover do rastreamento do Git e rotacionar credenciais expostas |
| `.env.development` | Sim | Sim | Remover do rastreamento do Git e rotacionar credenciais expostas |

Nenhum valor foi copiado para este relatório. Como esses arquivos já estavam no histórico, a correção completa exige rotação das chaves em seus provedores e, se necessário, limpeza de histórico com ferramenta própria em janela controlada.

## `.gitignore`

Antes da auditoria, `.gitignore` ignorava `*.local`, mas não bloqueava `.env`, `.env.production` ou `.env.development`.

Regra definida:

- ignorar `.env`;
- ignorar `.env.*`;
- permitir somente `.env.example`.

## Inventário de variáveis

As variáveis usadas pelo código foram consolidadas em `.env.example`. Categorias principais:

- Supabase: URL pública, chave anon/publishable, service role e banco;
- Core: segredos internos de webhook e processamento;
- N8N: base URL, token de webhook e alerta operacional;
- Mercado Pago: access token, public key e segredo de webhook;
- Paddle/pagamentos: chaves live/sandbox e token público;
- Z-API/WhatsApp: instance id, token de instância e client token;
- Fiscal: Focus NFe token e segredo de webhook;
- Alertas: Resend, Slack, Twilio e e-mail operacional;
- Observabilidade: Sentry, GA4, release e ambiente;
- GitHub/CI: token, repositório, SHA e flags de teste;
- Lovable legado: API key, envio de e-mail e metadados de build;
- Cloudflare/Hostinger: campos reservados para migração de DNS/hosting.

## Supabase

Estado observado no repositório:

- muitas migrations com RLS habilitado e políticas por tenant;
- uso legítimo de `SUPABASE_SERVICE_ROLE_KEY` em rotas server-side e edge functions;
- testes dedicados para RLS, storage e permissões;
- workflows de GitHub Actions para baseline de segurança e gate de publicação.

Riscos:

- `service_role` depende totalmente de segredo fora do navegador; se vazar, bypassa RLS;
- migrations históricas incluem muitos grants a `service_role`, portanto rotação e segregação por ambiente são obrigatórias;
- variáveis reais versionadas tornam necessária a rotação das chaves Supabase.

Checklist de autonomia:

- manter `SUPABASE_SERVICE_ROLE_KEY` apenas em GitHub Secrets, Supabase Secrets ou provedor de deploy;
- separar projetos Supabase de dev/staging/prod;
- rodar `test:rls`, `test:rls:recent` e `test:rls:storage` antes de publicar;
- exportar backup de schema e dados críticos fora do Lovable.

## GitHub

Estado observado:

- GitHub já é a origem do código;
- existem gates de build, Vitest, Playwright, segurança, RLS e publicação;
- o projeto consegue receber PRs e merges sem depender da UI do Lovable.

Riscos:

- checks podem falhar por ausência de secrets no ambiente de PR;
- PRs com falha visual podem ser mergeados manualmente se os gates não forem obrigatórios;
- segredos que já passaram pelo histórico precisam de rotação mesmo após sair do rastreamento.

Checklist de autonomia:

- definir branch protection na `main`;
- exigir build, testes unitários, RLS/security e publish gate antes de deploy;
- guardar segredos somente em GitHub Secrets ou no provedor final de deploy;
- manter deploy reproduzível via GitHub Actions.

## N8N

Estado observado:

- existem rotas e docs para callbacks/logs N8N;
- existem tabelas e migrations relacionadas a workflows, execuções e automações;
- a integração usa segredos como `IMPULSIONANDO_WEBHOOK_SECRET`, `N8N_BASE_URL` e `N8N_WEBHOOK_TOKEN`.

Riscos:

- webhooks sem segredo forte podem receber payload externo indevido;
- workflows de produção precisam ser exportados e versionados;
- falhas silenciosas podem afetar onboarding, funis, pós-pagamento e alertas.

Checklist de autonomia:

- exportar todos os workflows N8N para `docs/n8n` ou pasta operacional própria;
- configurar `IMPULSIONANDO_WEBHOOK_SECRET` diferente por ambiente;
- registrar URL, dono, evento, payload esperado e retry de cada webhook;
- criar rotina de replay para execuções com erro.

## Mercado Pago

Estado observado:

- há rotas server-side e edge functions de criação, webhook e reembolso;
- há tela/admin de integração, mas credenciais sensíveis devem ficar como secrets;
- variáveis mapeadas: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`.

Riscos:

- webhook sem validação de assinatura pode gerar conciliação incorreta;
- access token versionado exige rotação imediata;
- ambiente sandbox/live deve ser explicitamente documentado.

Checklist de autonomia:

- rotacionar tokens;
- validar segredo de webhook em todos os endpoints;
- manter tabela de credenciais por tenant quando aplicável;
- documentar processo de estorno, reprocessamento e conciliação.

## Z-API / WhatsApp

Estado observado:

- integração server-side usa `ZAPI_INSTANCE_ID`, `ZAPI_INSTANCE_TOKEN` e `ZAPI_CLIENT_TOKEN`;
- há endpoints para status e notificações;
- diagnóstico cita `ZAPI_TOKEN`, além de `ZAPI_INSTANCE_TOKEN`.

Riscos:

- divergência de nomes (`ZAPI_TOKEN` vs `ZAPI_INSTANCE_TOKEN`) pode quebrar ambiente;
- tokens versionados precisam ser rotacionados;
- sessão WhatsApp é dependência operacional externa.

Checklist de autonomia:

- padronizar `ZAPI_INSTANCE_TOKEN` como nome canônico;
- manter `ZAPI_TOKEN` apenas como alias temporário se necessário;
- documentar dono da instância, QR/session recovery e limite de disparos;
- registrar alertas de sessão desconectada.

## Cloudflare

Estado observado:

- há checagem de DNS via Cloudflare DNS-over-HTTPS;
- ainda existe referência a `impulsionando.lovable.app` como host padrão;
- não foi encontrado controle completo de Cloudflare via API no código auditado.

Riscos:

- domínio apontando para host Lovable mantém dependência operacional;
- DNS manual sem runbook aumenta risco de indisponibilidade;
- ausência de variáveis Cloudflare indica migração incompleta.

Checklist de autonomia:

- definir host final fora do Lovable;
- documentar zona DNS, registros A/CNAME/TXT/MX e responsáveis;
- configurar `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_ZONE_ID` quando automação for implementada;
- criar runbook de troca de domínio por tenant.

## Hostinger

Estado observado:

- não foi encontrada integração operacional clara com API Hostinger no código auditado;
- a dependência parece existir como operação externa, não como código.

Riscos:

- ausência de documentação impede handoff e recuperação;
- domínios, e-mails, DNS ou hospedagem podem estar fora do GitHub/Supabase;
- credenciais sem inventário podem concentrar risco em uma conta pessoal.

Checklist de autonomia:

- documentar quais domínios/serviços estão na Hostinger;
- registrar dono da conta, 2FA, renovação, DNS, e-mail e backup;
- criar variáveis reservadas `HOSTINGER_API_TOKEN` e `HOSTINGER_DNS_ZONE_ID` apenas quando houver automação real;
- migrar DNS crítico para Cloudflare se esse for o padrão operacional.

## Lovable

Dependências encontradas:

- pacotes `@lovable.dev/cloud-auth-js`, `@lovable.dev/email-js`, `@lovable.dev/webhooks-js`;
- dev dependency `@lovable.dev/vite-tanstack-config`;
- rotas `/lovable/email/*`;
- variáveis `LOVABLE_API_KEY`, `LOVABLE_SEND_URL`, `LOVABLE_COMMIT_SHA`, `LOVABLE_BRANCH`;
- referências de host `impulsionando.lovable.app`;
- funções de IA e alertas que ainda leem `LOVABLE_API_KEY`.

Conclusão:

O GitHub já consegue ser a fonte de verdade. A independência total do Lovable ainda depende de substituir ou encapsular e-mail, IA, hosting/preview e metadados de build.

Plano de saída:

1. Congelar Lovable como ferramenta opcional de scaffolding, não como produção.
2. Migrar envio de e-mail para provedor próprio documentado.
3. Migrar host canônico para Cloudflare/provedor escolhido.
4. Substituir `LOVABLE_API_KEY` por gateway próprio de IA.
5. Remover pacotes Lovable somente após testes de regressão e deploy alternativo validado.

## Ações imediatas obrigatórias

1. Rotacionar todas as chaves que estavam em `.env`, `.env.development` e `.env.production`.
2. Confirmar que os arquivos reais não voltam ao Git.
3. Preencher `.env.local` local e secrets do GitHub/provedor de deploy a partir de `.env.example`.
4. Ativar branch protection para impedir deploy com checks críticos falhando.
5. Exportar workflows N8N e inventário Hostinger/Cloudflare.

## Critério de independência total

O projeto só deve ser considerado independente do Lovable quando:

- build e deploy rodam por GitHub Actions sem abrir Lovable;
- produção usa domínio próprio fora de `lovable.app`;
- IA, e-mail e webhooks não exigem `LOVABLE_API_KEY`;
- secrets estão todos em cofres próprios;
- Supabase, N8N, Mercado Pago, Z-API, Cloudflare e Hostinger têm runbook com dono, credenciais, rotação e rollback;
- existe restauração documentada de banco, deploy e workflows.

## Rollback

Como esta alteração não muda runtime, rollback é simples:

- reverter este commit se for necessário desfazer documentação;
- manter, porém, a regra de não versionar `.env` reais;
- não restaurar segredos antigos sem rotação.
