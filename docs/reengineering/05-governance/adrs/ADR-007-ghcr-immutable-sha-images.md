# ADR-007 — Usar GHCR e imagens imutáveis por SHA completo

## Estado

Proposta

## Contexto

Em produção, um commit pode chegar à VPS e ainda assim não ser o conteúdo público. Existem múltiplos publishers, releases em diretórios, imagens Docker locais e ausência de identidade de release auditável por domínio. Smoke da Fase 0 mostrou HTTP 200 sem prova de release (marcadores 404 / health 503). `latest` e builds na VPS violam os princípios de entrega.

O fluxo-alvo em `CI-CD.md` e `DOKPLOY.md`: build único no CI, publicar em GHCR com **SHA completo do Git**, deploy em staging, promoção explícita da **mesma** imagem para produção, rollback pela imagem anterior conhecida.

`build-info.ts` gerado localmente não é autoridade de release.

Esta ADR não autoriza pipelines de publicação produtiva nem push de imagens a partir da Fase 0 além do necessário para inventário/evidência já contido.

## Decisão

Usar **GitHub Container Registry (GHCR)** como registro de imagens de aplicação, com tags/identidade **imutáveis pelo SHA completo do commit** (`GHCR:<full-commit-sha>`).

Regras:

- build once; promover a mesma imagem entre staging e produção;
- proibido usar `latest` como fonte de verdade de release;
- proibido build/`git pull`/edição manual de código na VPS de produção;
- cada serviço publica identidade: SHA, data de build, ambiente, health/readiness;
- smoke externo deve verificar domínio, TLS, runtime, SHA e superfície — não só HTTP 200;
- rollback = redeploy da imagem imutável anterior conhecida, sem depender de migration destrutiva;
- implementação no CI alinhada à Fase 2+ após aceite; Fase 0 mantém contenção de workflows mutáveis.

## Alternativas consideradas

- **Docker Hub / ECR / outro registry** — viáveis; GHCR integra naturalmente a GitHub Actions já presente.
- **Tags semver mutáveis ou `latest`** — rejeitadas como autoridade; semver pode coexistir como alias não autoritativo se necessário.
- **Deploy por checkout Git na VPS** — status quo parcial; incompatível com imutabilidade e rollback confiável.
- **Imagens por tenant/commit diferente no proxy** — proibido em `SYSTEM.md` / `DOKPLOY.md`.

## Consequências

### Positivas

- Rastreabilidade commit → imagem → ambiente → domínio.
- Rollback reproduzível sem caça a diretórios de release.
- Alinha CI, Dokploy e princípios de entrega.
- Reduz publishers concorrentes quando o fluxo único estiver ativo.

### Negativas e custos

- Disciplina de CI e retenção de imagens no GHCR.
- Exige health/readiness e smoke por SHA antes de confiar na promoção.
- Convivência com legado até cutover: ainda podem existir releases não-GHCR na VPS antiga.
- Não resolve sozinho branch protection / environment gates — complementa ADR de processo.

## Critérios de revisão

- Limites de GHCR (retenção, permissões, rate) que bloqueiem o fluxo após medição.
- Mudança organizacional para outro registry com os mesmos requisitos de imutabilidade por SHA.
- Evidência de que tagging só por SHA prejudica comunicação de release — avaliar aliases adicionais sem abandonar SHA como autoridade.

## Evidências

- [`../../01-current-state/BASELINE.md`](../../01-current-state/BASELINE.md)
- [`../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md`](../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md)
- [`../../01-current-state/phase-0/PUBLIC-SMOKE-BASELINE-2026-08-28.md`](../../01-current-state/phase-0/PUBLIC-SMOKE-BASELINE-2026-08-28.md)
- [`../../03-platform/CI-CD.md`](../../03-platform/CI-CD.md)
- [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md)
- [`../../00-foundation/PRINCIPLES.md`](../../00-foundation/PRINCIPLES.md) — build once; nunca `latest` como identidade.
- [`../../00-foundation/OBJECTIVE.md`](../../00-foundation/OBJECTIVE.md)
- [`../DECISIONS.md`](../DECISIONS.md)
