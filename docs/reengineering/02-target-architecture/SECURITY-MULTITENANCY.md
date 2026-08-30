# Segurança e multi-tenancy

## Identidade canônica

O modelo novo precisa escolher nomes canônicos para tenant, membership, usuário e papel. `company_id`, `tenant_id`, slugs e hostname não podem continuar sendo identidades concorrentes sem tradução explícita.

## Regras

- Toda linha privada pertence a um tenant, direta ou indiretamente.
- Tenant ativo é derivado da sessão e do hostname no servidor.
- IDs enviados pelo cliente são parâmetros, nunca autorização.
- Membership e papel são verificados no início de cada caso de uso.
- RLS protege acesso via Data API e atua como defesa adicional.
- `service_role` fica exclusivamente em processos server-side autorizados.
- Views, functions e Storage entram na mesma auditoria de isolamento.

## Testes obrigatórios

Para cada recurso multi-tenant:

- usuário do tenant A lê A;
- usuário do tenant A não lê B;
- usuário do tenant A não cria ou move registro para B;
- usuário sem membership é negado;
- papel inadequado é negado;
- serviço privilegiado deixa audit trail;
- índices cobrem colunas usadas por policies.

## Auditoria

Ações sensíveis registram tenant, ator, papel, capability, correlation ID, idempotency key, resumo do input, decisão de policy, resultado e timestamps.

Dados clínicos, financeiros, credenciais e mensagens precisam de classificação e retenção explícitas antes da migração.

