# Domínios e runtimes

Atualizado em: 2026-08-30 (inspeção VPS somente leitura + DNS público + smoke).

Este mapa separa intenção no repositório de observação operacional. Nenhuma entrada deve ser removida por ausência de evidência de tráfego.

## Clientes declarados para DNS

`infra/subdomains/clients.json` declara oito destinos habilitados:

| Host                            | Rota interna declarada | Product owner | Technical owner   | Criticidade        | Decisão                   |
| ------------------------------- | ---------------------- | ------------- | ----------------- | ------------------ | ------------------------- |
| `csi.impulsionando.com.br`      | `/csi`                 | Raygs         | Cauã + Raygs      | desconhecida       | manter durante descoberta |
| `wmp.impulsionando.com.br`      | `/wmp`                 | Raygs         | Cauã + Raygs      | aparentemente alta | manter durante descoberta |
| `chrismed.impulsionando.com.br` | `/chrismed`            | Raygs         | Cauã + Raygs      | alta, inclui saúde | manter durante descoberta |
| `anamadu.impulsionando.com.br`  | `/anamadu`             | Raygs         | Cauã + Raygs      | aparentemente alta | manter durante descoberta |
| `marocas.impulsionando.com.br`  | `/marocas`             | Raygs         | Cauã + Raygs      | desconhecida       | manter durante descoberta |
| `riomed.impulsionando.com.br`   | `/riomed`              | Raygs         | Cauã + Raygs      | alta, inclui saúde | manter durante descoberta |
| `grupoevr.impulsionando.com.br` | `/grupo-evr`           | Raygs         | Cauã + Raygs      | desconhecida       | manter durante descoberta |
| `revela.impulsionando.com.br`   | `/revela`              | Raygs         | Cauã + Raygs      | desconhecida       | manter durante descoberta |

O código em `src/lib/subdomain.ts` adiciona aliases e destinos para Colors Saúde, Garrido, tours e vitrines. Ele também aceita qualquer subdomínio não reservado e o envia para `/vitrine/{slug}`. Logo, “não está no JSON” não significa “não é roteável”. `agenda.chrismed.com.br` é um host customizado explícito.

## DNS / Cloudflare (LIVE 2026-08-30)

| Host | Resolução observada | Evidência |
| --- | --- | --- |
| `impulsionando.com.br` | Cloudflare anycast `172.67.189.100`, `104.21.65.77` (+ AAAA CF) | `dig` |
| `www.impulsionando.com.br` | A direto para origem `187.77.232.52` (não proxied ou DNS-only neste instante) | `dig` |
| `wmp` / `chrismed` / `colorssaude` | Cloudflare anycast | `dig` |
| `n8n.impulsionando.com.br` | CNAME `n8n-umlg.srv1777313.hstgr.cloud.` → `187.77.232.52` | `dig` |
| Resposta HTTPS apex/WMP | `server: cloudflare`, `cf-ray` presente | `curl -I` |

Export completo de zone/rules Cloudflare: **UNKNOWN** (sem API token nesta sessão). Origin VPS confirmada: `187.77.232.52` (`srv1777313`).

## Mapa live host → Nginx → upstream → runtime → release/SHA (2026-08-30)

Inspeção: SSH root somente leitura; `nginx -T`; `ss -lntp`; `docker ps`; `systemctl`; curl local por porta. **Nenhum serviço foi parado/reiniciado.**

| Host / superfície pública | Nginx upstream | Runtime | Identidade de release observada | Tráfego público? |
| --- | --- | --- | --- | --- |
| `impulsionando.com.br` / `app.impulsionando.com.br` (443) | `127.0.0.1:3490` | Docker `impulsionando-final3-test` image `impulsionando:correct-front-final3-20260826` | `/api/public/version` → `commit: unknown`, `builtAt: 2026-08-26T23:32:36.369Z`; health 503 `supabase env missing` | **SIM** |
| Tenants no bloco compartilhado (`wmp`, `colorssaude`, `csi`, `anamadu`, …) | `127.0.0.1:3000` | systemd `impulsionando-core.service` → Node `.output/server/index.mjs` (+ Pulsonitor + Colors workers) | WorkingDirectory `current` → release `recovery-ebcc52f0…`; version local `commit: ebcc52f0…` | **SIM** |
| `chrismed.impulsionando.com.br` | `127.0.0.1:3000` | mesmo `impulsionando-core` | `ebcc52f0…` | **SIM** |
| `marocas.impulsionando.com.br` | `/` static `/var/www/marocas-static`; resto → `:3000` | static + core | static datado 2026-08-26; app `ebcc52f0…` | **SIM** |
| `revela.impulsionando.com.br` | `127.0.0.1:3017` | Docker `revela-front` `ghcr.io/raygsm/impulsionando-core:e007cf20…` | image SHA `e007cf20…` | **SIM** |
| `grupoevr.impulsionando.com.br` | `127.0.0.1:3000` | core | `ebcc52f0…` | **SIM** |
| `crismedia.impulsionando.com.br` | `172.16.1.5:3000` | Docker `chrismedia-18h` | image `c8916dd0…` | **SIM** (host separado) |
| `*.impulsionando.com.br` catch-all | `127.0.0.1:3000` | core | `ebcc52f0…` | **SIM** |
| Preview loopbacks (`127.0.0.1:94xx`) | várias portas `3400–3490` | containers de preview/test | SHAs diversos (`b8e2fb15`, `41b91e91`, `e007cf20`, …) | **NÃO** (loopback) |
| Candidate `impulsionando-candidate-d3-web` | **sem** `proxy_pass` para `:3500` no Nginx | transient systemd; `127.0.0.1:3500`; cwd `releases/recovery-d3ab3c8b…` | version local `commit: d3ab3c8b…` | **NÃO** (não roteado) |

### Marcadores de release no disco (não publicados no apex HTTP)

| Path | Conteúdo |
| --- | --- |
| `/var/www/impulsionando-static-release/impulsionando-front-sha.txt` | `ebcc52f0a71c0d1d9567209effbd4aa8a1141457` |
| `/var/www/impulsionando-static-release/impulsionando-release.json` | sha `ebcc52f0…`, `built_at: 2026-08-24T16:37:15Z` |
| `/opt/impulsionando/public/impulsionando-release.json` | sha `d606d77d…`, `built_at: 2026-08-24T08:51:52Z` (divergente) |

HTTP público `/impulsionando-front-sha.txt` e `/impulsionando-release.json` no apex: **404** (smoke 2026-08-30).

## Unidade candidata (evento reconciliado)

| Campo | Valor LIVE |
| --- | --- |
| Unit | `impulsionando-candidate-d3-web.service` |
| Tipo | **transient** (`/run/systemd/transient/…`) |
| Estado | `active (running)` desde `2026-08-30 15:48:53 UTC` |
| Bind | `HOST/NITRO_HOST=127.0.0.1`, `PORT/NITRO_PORT=3500` |
| CWD | `/var/www/impulsionando-core/releases/recovery-d3ab3c8bdc9158119120efe63670dabd25312708` |
| Exec | `/usr/bin/node .output/server/index.mjs` as `www-data` |
| Nginx | **nenhuma** referência a `3500` / `candidate-d3` |
| Ação | **não** parar/reiniciar/remover sem aprovação explícita de Cauã |

Evento anterior (handoff): wrapper candidatou workers Pulsonitor/Colors ~15s; side effects **UNKNOWN**.

## Publishers / runtimes auxiliares observados

| Componente | Estado LIVE 2026-08-30 |
| --- | --- |
| `impulsionando-core.service` | active desde 2026-08-24; workers Pulsonitor + Colors **ativos** (ticks Colors a cada ~60s) |
| `impulsionando-publish-worker.service` | loaded enabled; **inactive/dead** desde 2026-08-27 |
| Docker n8n | `n8n-umlg-n8n-1` Up; host port `36382→5678` |
| Evolution stack | `impulsionando-evolution-api` `:18080`, postgres, redis Up |
| Containers preview/test | ≥15 containers bindidos em loopback |

## Pendências honestas

- Export Cloudflare zone/rules completo.
- Tráfego 30/90 dias por host: **UNKNOWN** (pré-lançamento / sem analytics confiável).
- Qual imagem Docker exatamente corresponde ao label `correct-front-final3-20260826` (SHA git): **UNKNOWN** além de `builtAt`/`commit: unknown`.
- Side effects do start acidental de workers no candidato: **UNKNOWN**.
