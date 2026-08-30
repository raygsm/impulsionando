# Baseline HTTP público — 2026-08-30

Executado em: `2026-08-30T17:46:23.249Z`

Comando: `npm run phase0:smoke`

Modo: 15 requisições `GET` HTTPS públicas, sem autenticação, sem redirects automáticos e sem mutações.

Resultado: **12 passaram; 3 falharam** (igual ao baseline de 2026-08-28).

| Alvo                           | Status | Resultado  | Observação                                        |
| ------------------------------ | -----: | ---------- | ------------------------------------------------- |
| apex                           |    200 | passou     | HTML                                              |
| www                            |    301 | passou     | redirect para apex                                |
| csi                            |    200 | passou     | HTML                                              |
| wmp                            |    200 | passou     | HTML                                              |
| chrismed                       |    200 | passou     | HTML                                              |
| anamadu                        |    200 | passou     | HTML                                              |
| marocas                        |    200 | passou     | HTML                                              |
| riomed                         |    200 | passou     | HTML                                              |
| grupoevr                       |    200 | passou     | HTML                                              |
| revela                         |    200 | passou     | HTML                                              |
| colorssaude                    |    200 | passou     | HTML                                              |
| `/api/public/health`           |    503 | **falhou** | `status: degraded`; `db.error: supabase env missing` no runtime do apex |
| `/api/public/version`          |    200 | passou     | `commit: unknown`, `builtAt: 2026-08-26T23:32:36.369Z` |
| `/impulsionando-front-sha.txt` |    404 | **falhou** | marcador não publicado no apex                    |
| `/impulsionando-release.json`  |    404 | **falhou** | metadata não publicada no apex                    |

## Interpretação limitada

HTTP 200 ≠ prova de release. O apex responde com `commit: unknown` e health 503 por ausência de env Supabase no container que atende a porta pública 3490. SHA/release públicos no apex continuam indisponíveis. Ver mapa live em [`DOMAINS-AND-RUNTIMES.md`](DOMAINS-AND-RUNTIMES.md).
