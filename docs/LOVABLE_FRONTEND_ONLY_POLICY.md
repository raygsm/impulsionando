# Política Lovable frontend-only

Data: 2026-07-14.

## Decisão operacional

O Lovable pode ser usado somente como ferramenta visual/IDE de apoio ao frontend. O repositório GitHub é a fonte oficial do projeto e nenhum fluxo crítico de produção deve depender do Lovable.

## Removido/desacoplado neste ajuste

- Build Vite/TanStack não usa mais `@lovable.dev/vite-tanstack-config`, MCP plugin, tagger, HMR gate ou bridge de dev-server.
- Autenticação OAuth do aplicativo usa Supabase diretamente; o wrapper legado `src/integrations/lovable` existe apenas para compatibilidade de import.
- Endpoints MCP Lovable foram desativados e não expõem ferramentas operacionais.
- Endpoints Lovable Email/Webhook foram desativados com HTTP 410 para impedir dependência de envio, suppression ou auth-email pelo Lovable.
- Configurações de DNS/publicação deixam de orientar A/TXT/CNAME Lovable e passam a usar alvos configuráveis por `PUBLIC_DNS_A_TARGET`, `PUBLIC_DNS_CNAME_TARGET`, `VITE_DNS_A_TARGET` e `VITE_DNS_CNAME_TARGET`.

## Serviços que devem permanecer fora do Lovable

- Domínio e DNS: Cloudflare/registrador/Hostinger ou provedor escolhido, nunca painel Lovable.
- Hospedagem e deploy: pipeline independente a partir do GitHub.
- Banco e autenticação: Supabase direto, com variáveis próprias do ambiente.
- Automações: N8N/webhooks diretos.
- Pagamentos: provedores diretos (Mercado Pago/Paddle/etc.), sem gateway Lovable.
- E-mail/SMS/IA: provedores diretos. As chaves devem ser do provedor direto, nunca do Lovable.

## Pendências externas antes de produção

1. Definir o alvo real da infraestrutura independente e preencher `PUBLIC_DNS_A_TARGET` e/ou `PUBLIC_DNS_CNAME_TARGET` no ambiente de deploy.
2. Remover do DNS qualquer `A 185.158.133.1`, `CNAME *.lovable.app` ou `TXT _lovable=lovable_verify=...` somente após o novo deploy estar validado.
3. Configurar CI/CD independente para a branch `main` a partir do GitHub.
4. Validar as URLs diretas de IA/e-mail/SMS/Search Console/Paddle antes de habilitar esses recursos em produção crítica.
