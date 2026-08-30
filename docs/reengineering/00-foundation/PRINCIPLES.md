# Princípios não negociáveis

## Arquitetura

1. Começar com monólito modular, não com uma explosão de microserviços.
2. Separar unidades de execução: frontend, API e worker.
3. Uma regra de negócio possui um único módulo responsável.
4. Tenant é contexto de segurança, não apenas tema visual.
5. Integrações são adapters substituíveis; não comandam o domínio.

## Entrega

1. Build uma vez; promover a mesma imagem entre ambientes.
2. Nunca executar `git pull`, build ou edição manual em produção.
3. Nunca usar `latest` como identidade de release.
4. `main` produz candidato; promoção de produção exige gates.
5. Mudanças de banco seguem expand/contract e migrations imutáveis.

## Segurança

1. O servidor deriva tenant, usuário e permissões.
2. RLS e grants são testados, não presumidos.
3. Credenciais privilegiadas nunca chegam ao browser.
4. Webhooks exigem assinatura, replay protection e idempotência.
5. Toda ação de IA usa ferramenta registrada e policy gate.

## Migração

1. Nada de big bang.
2. Novo e legado convivem por contratos explícitos durante a transição.
3. Migrar um fluxo vertical completo antes de espalhar scaffolding.
4. Toda mudança de tráfego possui rollback documentado.
5. Legado só é removido depois de evidência e janela de segurança.

## Operação

1. Nenhum serviço é produção sem logs estruturados e health check.
2. Alertas devem apontar ação e responsável.
3. Backup sem teste de restauração não é backup comprovado.
4. Dokploy governa deploy; ele não contém regras de negócio.
5. Cloudflare governa edge; o proxy de origem governa destinos internos.

