# Fronteiras de tecnologia

Este documento evita que ferramentas diferentes assumam a mesma responsabilidade.

| Tecnologia | Responsabilidade | Não deve fazer |
|---|---|---|
| TanStack Start | React, SSR, routing e BFF fino | concentrar domínio, workers ou integrações privilegiadas |
| NestJS + Fastify | API modular, autenticação, autorização, casos de uso e contratos | renderizar interfaces ou controlar deploy |
| Supabase Postgres | dados transacionais, RLS, constraints, funções realmente data-centric | armazenar secrets de frontend ou substituir regras de aplicação complexas |
| Supabase Auth | identidade e emissão de sessão | decidir sozinho permissões de negócio |
| Supabase Storage | arquivos e políticas de acesso | servir como filesystem improvisado de jobs |
| Supabase Realtime | eventos de UI com autorização | substituir fila durável de trabalho |
| Supabase Queues/pgmq | jobs duráveis, retries controlados e desacoplamento | executar o job dentro do banco |
| Worker Node | consumir filas e executar tarefas assíncronas | receber tráfego público geral |
| n8n | orquestração visual e integrações auxiliares | ser fonte de verdade do domínio |
| Evolution API | transporte WhatsApp | decidir autorização, campanha ou tenant |
| AI SDK/provedores | inferência, streaming e tool calling | ter acesso irrestrito a dados ou ações |
| Dokploy | deploy, variáveis, domínios, logs operacionais e lifecycle de containers | compensar arquitetura ruim ou guardar lógica de produto |
| Traefik | TLS e roteamento de origem | selecionar commits diferentes por tenant |
| Cloudflare | DNS, proxy, WAF, rate limiting de edge | duplicar regras internas de aplicação |
| GitHub Actions | validação, build e publicação de artefatos | editar produção por SSH |
| GHCR | imagens imutáveis por SHA | usar `latest` como release auditável |

## Regra TanStack versus NestJS

TanStack Start não será substituído automaticamente. Ele permanece nos frontends. O backend hoje embutido em routes e `createServerFn` será extraído gradualmente para o NestJS.

Durante a migração:

- server functions existentes podem atuar como adapters temporários;
- novos casos de uso devem nascer no domínio/API novo após o gate correspondente;
- componentes React não devem importar acesso privilegiado ao banco;
- contratos compartilhados vivem em `packages/contracts`.

