# Arquitetura-alvo

## Forma geral

```text
Cloudflare
  -> Traefik gerenciado pelo Dokploy
      -> platform-web
      -> tenant-web
      -> app-web
      -> api

api
  -> Supabase: Postgres, Auth, Storage, Realtime
  -> filas duráveis
  -> integrações síncronas controladas

worker
  -> filas
  -> n8n, Evolution, pagamentos, e-mail e IA
  -> Supabase
```

## Unidades de execução

### `platform-web`

Site institucional da Impulsionando. Não contém regras administrativas nem credenciais privilegiadas.

### `tenant-web`

Experiências públicas e white-label dos tenants. Uma única imagem atende todos os tenants; hostname e configuração resolvem branding, conteúdo e módulos.

### `app-web`

Aplicação autenticada. Pode usar SSR/BFF fino, mas não é proprietária das regras de negócio.

### `api`

API modular responsável por autorização, casos de uso, transações, contratos externos e publicação de jobs.

### `worker`

Consumidor de jobs duráveis. Executa tarefas demoradas ou sujeitas a retry sem compartilhar ciclo de vida com o servidor web.

## Módulos iniciais do domínio

- Identity e Access
- Tenants e Memberships
- Billing e Subscriptions
- CRM e Customer Lifecycle
- Communications
- Automations
- Integrations
- Support
- Audit e Compliance
- AI Runtime

Os módulos começam no mesmo API. Extração para serviço separado só ocorre mediante evidência de escala, disponibilidade ou isolamento regulatório.

## Fluxos proibidos

- Browser chamando integrações privilegiadas diretamente.
- n8n alterando estado crítico sem validação no API.
- Modelo de IA executando SQL ou HTTP arbitrário.
- Nginx/Traefik escolhendo versão de código por tenant.
- Worker sendo iniciado como filho do processo SSR.

