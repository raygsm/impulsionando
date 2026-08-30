# Deploy, automações e publishers

Atualizado em: 2026-08-30.

## GitHub Actions — reconciliação LIVE

| Métrica | Valor (2026-08-30) |
| --- | ---: |
| Workflows no checkout local | 168 |
| Workflows no registry GitHub | 209 |
| `active` | 202 |
| `disabled_manually` (contenção Fase 0) | 7 |
| Paths no registry **ausentes** do checkout | 41 |

Os sete contidos permanecem `disabled_manually` (IDs em [`CONTAINMENT.md`](CONTAINMENT.md)). `production-front.yml` continua desabilitado — não há publisher canônico de frontend ativo via Actions neste instante.

### Orphans (registry active, arquivo ausente do checkout)

40 workflows `active` sem YAML no checkout + 1 `disabled_manually` (`vps-safe-cleanup.yml`). Classes observadas nos nomes:

| Classe | Exemplos (path) | Risco residual |
| --- | --- | --- |
| Emergency / DNS cutover | `emergency-apex-dns-cutover.yml`, `emergency-edge-origin-repair.yml` | mutação de origem/tráfego se disparados |
| Schema / DB mutators | `reconstruct-legacy-schema.yml`, `tmp-patch-pega-schema.yml` | escrita de schema |
| n8n repair / secret | `vps-n8n-repair.yml`, `tmp-repair-core-n8n-hmac.yml`, `vps-oliver-bridge-secret.yml` | mutação VPS/n8n |
| Evolution provision | `provision-evolution-homologacao.yml` | provisionamento |
| Recover / publish | `p0-recover-fronts.yml`, `grupoevr-pr-publish.yml` | promoção de front |
| Backup restore workflow | `core-backup-restore.yml` | potencial restore/mutação (conteúdo UNKNOWN — YAML ausente) |
| Diagnostics tmp-* | vários `tmp-audit-*` | menor se só leem; **não provado** |

Lista completa de paths ausentes está no log de evidência da sessão 2026-08-30 (EVIDENCE-INDEX).

### Schedules ainda ativos (checkout)

`db-backup-daily.yml`, `dns-vps-check.yml`, `all-client-subdomains-reconcile.yml`, `post-deploy-monitor.yml`, `e2e-nightly.yml`, `security-nightly.yml`, `minimum-wage-sync.yml`, `wmp-onde-estou-daily.yml`.

`wildcard-subdomain-dns.yml` e `n8n-universal-ready-provisioner.yml` permanecem desabilitados.

Heurística: dezenas de workflows **active no checkout** ainda carregam nomes mutáveis (`*repair*`, `*cutover*`, `*deploy*`, `*emergency*`, `*recover*`). Contenção inicial cobriu só sete. **Produção não está congelada por automação completa.**

## Publishers fora do GitHub

| Publisher | Local | Capacidade | Estado LIVE 2026-08-30 | Decisão |
| --- | --- | --- | --- | --- |
| core publish worker | systemd | promover releases | **inactive/dead** desde 2026-08-27; unit ainda enabled | preservar; não acionar |
| Nginx | host | escolher upstream | ativo; mapa em DOMAINS-AND-RUNTIMES | preservar; sem mudança |
| Docker Compose/scripts | VPS | subir runtimes | ≥20 containers Up | congelar mudanças |
| Candidate d3 web | transient systemd `:3500` | serve release `d3ab3c8b` isolado | **active**; sem rota Nginx | não tocar sem aprovação |
| SentinelX | remoto | UNKNOWN | UNKNOWN | não interromper |
| n8n | container | workflows/webhooks | container Up; workflows live **UNKNOWN** | provisionador contido |
| Cloudflare | DNS/proxy | origem/tráfego | zone ativa; reconciliador wildcard contido | sem cutover |
| Evolution | containers | WhatsApp API | Up em `:18080` | inventário live pendente |
| `impulsionando-core` workers | systemd children | Pulsonitor + Colors ticks | **ativos** | caracterizar consumidores |

## Autoridade temporária única (DECLARED)

| Papel | Quem |
| --- | --- |
| Aprovadores técnicos de qualquer mudança emergencial em produção | **Cauã + Raygs** (ambos) |
| Product owner de todos os verticais P0 | **Raygs** |
| Branch de evidência Fase 0 | `codex/reengineering-phase-0` — **não** publica para produção |

Nenhuma automação desta branch deve publicar. Workflows contidos não devem ser reabilitados sem decisão registrada. Orphans ativos são **risco residual** até desabilitados ou convertidos para `workflow_dispatch` apenas.

### Stub de processo emergencial (obrigatório durante Fase 0)

1. Declarar incidente (texto curto): alvo, motivo, risco de não agir.
2. Obter aprovação explícita de **Cauã e Raygs** (mesmo canal assíncrono serve; registrar timestamp).
3. Preferir mudança mínima reversível; proibido cleanup/DNS/schema sem mapa + rollback escrito.
4. Executar; capturar evidência (comando, before/after, SHA/unit).
5. Anexar entrada em [`EXECUTION-LOG.md`](EXECUTION-LOG.md) no mesmo dia.
6. Se a mudança reativar automação, registrar data de re-contenção planejada.

Proteções: `main` sem branch protection observável; environment `production` sem reviewers — **não** confiar em GitHub gates.
