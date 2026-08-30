# Baseline HTTP público — 2026-08-28

Executado em: `2026-08-28T22:46:37.723Z`

Comando: `npm run phase0:smoke`

Modo: 15 requisições `GET` HTTPS públicas, sem autenticação, sem redirects automáticos e sem mutações.

Resultado: **12 passaram; 3 falharam**.

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
| `/api/public/health`           |    503 | **falhou** | endpoint existe, mas declara runtime não saudável |
| `/api/public/version`          |    200 | passou     | JSON                                              |
| `/impulsionando-front-sha.txt` |    404 | **falhou** | marcador exigido não está publicado no apex       |
| `/impulsionando-release.json`  |    404 | **falhou** | metadata exigida não está publicada no apex       |

## Interpretação limitada

Os hosts responderem 200 prova disponibilidade HTTP naquele instante, não prova que servem o mesmo commit, que hidratam no navegador ou que suas jornadas autenticadas funcionam. Os 404 impedem confirmar SHA/release pelo contrato de publicação declarado. O 503 precisa ser decomposto por dependência antes de qualquer correção.

Hashes e tamanhos foram calculados em memória pelo runner para comparação futura; nenhum corpo de resposta foi salvo no repositório.
