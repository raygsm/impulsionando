# ADR-008 — Separar platform-web, tenant-web e app-web

## Estado

Proposta

## Contexto

Um único runtime concentra site institucional, homepages/white-label de tenants, app autenticado e grande parte do backend. Subdomínios e hosts customizados resolvem para prefixos internos; o código aceita subdomínios não reservados para vitrine. Em produção, apex e rotas de tenant já podem apontar para runtimes/releases diferentes — sem autoridade clara.

Clarificação 2026-08-30: no lado cliente, aplicações de tenant são visualmente produtos separados; Raygs opera a plataforma. Isso favorece superfícies de frontend distintas com **a mesma imagem por serviço** e diferenças por configuração/hostname — não commits diferentes por tenant no proxy.

A arquitetura-alvo define três apps web deployáveis com papéis distintos, compartilhando UI/contracts via packages (ADR-001).

Esta ADR não autoriza split de apps nem mudanças de DNS/roteamento na Fase 0.

## Decisão

Separar os frontends em três aplicações:

| App | Papel |
|---|---|
| `platform-web` | Site institucional / aquisição Impulsionando; sem regras admin privilegiadas nem credenciais privilegiadas |
| `tenant-web` | Experiências públicas e white-label; **uma imagem** para todos os tenants; hostname + config resolvem branding, conteúdo e módulos |
| `app-web` | Aplicação autenticada; SSR/BFF fino permitido; não é dona das regras de negócio |

Limites:

- hostname resolve **configuração de tenant**, não seleciona commit/imagem diferente;
- tenants de um serviço rodam o mesmo SHA imutável (ADR-007);
- hosts desconhecidos/não verificados falham seguro;
- regras de negócio e integrações privilegiadas ficam no `api` / worker (ADR-003, ADR-005);
- não migrar mecanicamente todas as rotas; um fluxo vertical por vez;
- split físico de apps ocorre nas fases de frontend/tenants (Fase 4+) após ADRs aceitas e API estável o suficiente para o módulo em migração;
- Fase 0: mapear hosts → runtime/release/SHA e caracterizar jornadas — sem cutover.

## Alternativas consideradas

- **Manter um único app web com roteamento interno por host** — status quo; perpetua blast radius e acoplamento de deploys.
- **Um deploy/imagem por tenant** — escala operacional ruim; proibido selecionar commit por tenant no proxy.
- **Apenas dois apps (público vs autenticado)** — mistura institucional Impulsionando com white-label de clientes; obscurece ownership e blast radius.
- **Microfrontends por vertical** — complexidade prematura; contradiz monólito modular inicial.

## Consequências

### Positivas

- Blast radius e deploys alinhados ao tipo de superfície.
- White-label intencional sem lógica especial no proxy por tenant.
- Clareza de o que pode ir ao browser (platform vs app).
- Combina com Traefik/Dokploy: rotas por serviço, mesma imagem multi-tenant.

### Negativas e custos

- Três pipelines/imagens web e disciplina de packages UI compartilhados.
- Risco de duplicar layouts/componentes se `packages/ui` não for usado.
- Migração de hosts legados (Nginx path-based vs apps) exige mapa completo e rollback.
- Auth/password-reset host canônico ainda OPEN — não inventar na Fase 0.

## Critérios de revisão

- Evidência de que três apps aumentam custo sem reduzir incidentes de blast radius após o primeiro tenant migrado.
- Necessidade de quarto runtime (ex.: vertical isolado regulatoriamente) — ADR aditiva, não necessariamente fusão.
- Decisão de produto de unificar UX autenticada e pública em um shell (improvável dadas clarificações).

## Evidências

- [`../../02-target-architecture/SYSTEM.md`](../../02-target-architecture/SYSTEM.md)
- [`../../02-target-architecture/REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md)
- [`../../02-target-architecture/TARGET-STACK.md`](../../02-target-architecture/TARGET-STACK.md)
- [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md)
- [`../../01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md`](../../01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md)
- [`../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md`](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md) — superfícies cliente separadas; ownership Raygs.
- [`../../01-current-state/product-map/TENANTS-AND-SURFACES.md`](../../01-current-state/product-map/TENANTS-AND-SURFACES.md)
- ADR-001, ADR-002, ADR-007.
- [`../DECISIONS.md`](../DECISIONS.md)
