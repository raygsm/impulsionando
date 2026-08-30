# ADR-006 — Usar Dokploy como control plane em infraestrutura limpa

## Estado

Proposta

## Contexto

A produção atual está em split-brain: Nginx (não Traefik) como reverse proxy real; Docker e Node/systemd simultâneos; múltiplos publishers (GitHub Actions com SSH, publish worker systemd, Compose, n8n, Cloudflare); apex e rotas de tenant podem servir releases diferentes; dezenas de containers e ~117 diretórios de release observados.

Dokploy é proposto como control plane de deploy (variáveis, domínios, logs operacionais, lifecycle de containers) com Traefik gerenciado e Cloudflare na edge — em **infraestrutura limpa paralela**, não limpando nem reaproveitando a VPS legada durante a descoberta.

`DOKPLOY.md` deixa explícito: arquitetura-alvo da Fase 2; **não** autoriza provisionar, instalar, migrar DNS/roteamento ou limpar a VPS na Fase 0. A VPS atual permanece evidência e rollback até cutover comprovado (Fase 7).

## Decisão

Adotar **Dokploy** como control plane de deployment na **infraestrutura limpa** (produção nova + staging; control plane preferencialmente separado), com Traefik como autoridade de roteamento de origem e Cloudflare na edge.

Limites e não-objetivos desta proposta:

- **Não** wipe / cleanup / reinstall na VPS atual;
- **Não** autoriza instalação Dokploy, mudança de DNS, cutover de tráfego ou rebuild de VPS na Fase 0;
- produção nova fica isolada do legado e do staging; se orçamento impedir três servidores, control plane e staging podem compartilhar máquina com limites explícitos — produção permanece isolada;
- Supabase gerenciado permanece **fora** do Dokploy;
- Dokploy não contém regras de negócio, não compensa arquitetura ruim e não seleciona commit por tenant;
- workers não são filhos de SSR/API; lifecycles independentemente controláveis;
- aposentadoria da VPS legada só na Fase 7 com evidência de cutover e janela de rollback;
- implementação alinhada à Fase 2+ após aceite desta ADR e evidência de Fase 0.

## Alternativas consideradas

- **Continuar Nginx + scripts/SSH na VPS atual** — status quo; perpetua split-brain e publishers concorrentes.
- **Kubernetes / ECS** — fora de escopo inicial (`OBJECTIVE.md`); complexidade operacional excessiva agora.
- **Só Docker Compose manual sem control plane** — possível em staging mínimo; não resolve promoção, domínios e lifecycle com a disciplina desejada.
- **Instalar Dokploy na VPS legada agora** — rejeitado: mistura control plane com estado corrompido/split-brain e viola contenção da Fase 0.

## Consequências

### Positivas

- Autoridade única de deploy na plataforma nova.
- Separação edge (Cloudflare) / origem (Traefik) / apps.
- Base para build-once / promote-same-image (ADR-007).
- Legado intacto como rollback até cutover.

### Negativas e custos

- Custo de servidores limpos (control / staging / prod) e operação Dokploy.
- Período de convivência legado + novo com risco de publishers paralelos se contenção falhar.
- Dokploy não resolve RLS, jobs idempotentes nem ownership de produto.
- Risco de agentes tratarem esta ADR Proposta como licença para provisionar — deve ser recusado.

## Critérios de revisão

- Evidência de que Dokploy não atende promoção por SHA, multi-serviço ou isolamento staging/prod após POC em infra limpa (não na VPS legada).
- Decisão formal por outro control plane (CapRover, Portainer+CI puro, cloud PaaS) com custo/benefício documentado.
- Restrição de budget que force topologia diferente — revisar separação de servidores, não necessariamente abandonar o modelo limpo.

## Evidências

- [`../../01-current-state/BASELINE.md`](../../01-current-state/BASELINE.md)
- [`../../01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md`](../../01-current-state/phase-0/DOMAINS-AND-RUNTIMES.md)
- [`../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md`](../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md)
- [`../../01-current-state/phase-0/CONTAINMENT.md`](../../01-current-state/phase-0/CONTAINMENT.md)
- [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md)
- [`../../00-foundation/PRINCIPLES.md`](../../00-foundation/PRINCIPLES.md)
- [`../../00-foundation/OBJECTIVE.md`](../../00-foundation/OBJECTIVE.md) — sem limpeza destrutiva antes do cutover.
- [`../../STATUS.md`](../../STATUS.md) — só Fase 0 autorizada.
- [`../DECISIONS.md`](../DECISIONS.md)
