# Índice de evidências

Atualizado em: 2026-08-30.

## Repositório local

| Evidência | Origem | Data | Observação |
| --- | --- | --- | --- |
| commit analisado (início Fase 0) | Git `d3ab3c8b` | 2026-08-28 | igual a `origin/main` no início |
| HEAD branch trabalho | `dbf34881` | 2026-08-30 | hydration PublicHeader only; sem upstream |
| workflows no checkout | `.github/workflows/` | 2026-08-30 | 168 arquivos |
| rotas / API | `src/routes/` | 2026-08-28 | 1.083 / 111 |
| auth trace | [`AUTH-SESSION-TRACE.md`](AUTH-SESSION-TRACE.md) | 2026-08-30 | STATIC |
| schema SoT | [`SCHEMA-SOURCE-OF-TRUTH.md`](SCHEMA-SOURCE-OF-TRUTH.md) | 2026-08-30 | decisão observacional |

## GitHub

| Evidência | Consulta | Data | Resultado |
| --- | --- | --- | --- |
| workflow registry | Actions API | 2026-08-30 | 209 total; **202 active**; 7 `disabled_manually` |
| orphans | registry path ∉ checkout | 2026-08-30 | **41** paths (40 active + cleanup disabled) |
| contenção | Actions API | 2026-08-28→30 | sete mutáveis ainda disabled |
| branch protection | API | 2026-08-28 | não configurada |
| backup diário | run `33185576586` | 2026-08-28 | falhou Configure SSH |

## VPS / DNS / runtime (LIVE 2026-08-30)

| Evidência | Origem | Resultado |
| --- | --- | --- |
| SSH inspect | `root@187.77.232.52` read-only | mapa em DOMAINS-AND-RUNTIMES |
| candidate unit | `systemctl` | `impulsionando-candidate-d3-web` active, `127.0.0.1:3500`, SHA `d3ab3c8b`, **sem** Nginx |
| apex upstream | nginx + curl :3490 | Docker `final3-test`; version `commit: unknown`; health degraded |
| tenant upstream | nginx + curl :3000 | `impulsionando-core` → `ebcc52f0…`; workers ativos |
| publish worker | systemctl | inactive since 2026-08-27 |
| DNS | dig | apex/tenants via Cloudflare; www A→origin; n8n CNAME Hostinger |
| smoke | `npm run phase0:smoke` | 12/15 — [`PUBLIC-SMOKE-BASELINE-2026-08-30.md`](PUBLIC-SMOKE-BASELINE-2026-08-30.md) |
| backups dir | `/var/backups/impulsionando` | sem dump `daily/*.sql.gz.enc` |

## Supabase

| Evidência | Origem | Data | Resultado |
| --- | --- | --- | --- |
| structural live audit | SQL kit + CSVs `.local/phase0-evidence/` | 2026-08-28 | 577 public tables; drift grave; ver SUPABASE-LIVE-AUDIT |
| managed backup policy | docs provedor Pro | 2026-08-30 | daily 7d típico; Dashboard/PITR **não** confirmados nesta sessão |
| isolated restore | — | — | **não executado** |
| AI assistants (J-14) | [`AI-ASSISTANTS-INVENTORY.md`](AI-ASSISTANTS-INVENTORY.md) | 2026-08-30 | 8 assistants STATIC; not CHARACTERIZED; Phase 6 forbidden |

Valores de secrets não foram armazenados. Env files da VPS não foram dumpados.
