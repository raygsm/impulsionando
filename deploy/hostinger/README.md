# Deploy Hostinger + Traefik

Este pacote sobe o Impulsionando Core na VPS Hostinger, atras do Traefik existente, sem depender da hospedagem do Lovable.

## Pre-requisitos

- DNS do Cloudflare apontando para a VPS `187.77.232.52`.
- Traefik rodando na VPS.
- Docker e Docker Compose ativos.
- Arquivo `.env.production` preenchido na VPS com os segredos reais.

## Registros atendidos

- `impulsionando.com.br`
- `www.impulsionando.com.br`
- `app.impulsionando.com.br`
- `*.impulsionando.com.br`
- `*.*.impulsionando.com.br`

## Como subir na VPS

### Opcao recomendada: imagem pronta do GitHub

Use `docker-compose.image.yml` no Gerenciador Docker da Hostinger. Esse modo nao compila o projeto no VPS; ele baixa a imagem oficial publicada pelo GitHub Actions.

Antes de implantar:

1. Execute o workflow `Build Core Docker Image` no GitHub.
2. Confirme que a imagem `ghcr.io/raygsm/impulsionando-core:hostinger-stable` foi publicada.
3. No Compose da Hostinger, substitua `COLE_AQUI_A_CHAVE_PUBLICAVEL_DO_SUPABASE` pela chave `Publishable key` do projeto Supabase oficial.

### Opcao por terminal

```bash
cd /opt/impulsionando
docker compose -f deploy/hostinger/docker-compose.yml up -d --build
```

Se o Traefik da Hostinger usar outro nome de rede ou outro resolver TLS, crie um arquivo `.env` em `/opt/impulsionando`:

```bash
TRAEFIK_NETWORK=traefik
TRAEFIK_HTTP_ENTRYPOINT=web
TRAEFIK_HTTPS_ENTRYPOINT=websecure
TRAEFIK_CERT_RESOLVER=letsencrypt
```

Depois rode novamente:

```bash
docker compose -f deploy/hostinger/docker-compose.yml up -d --build
```

## Validacao

```bash
docker ps
docker logs impulsionando-core --tail=80
curl -I https://app.impulsionando.com.br
curl -I https://impulsionando.com.br
```

Resultado esperado:

- O container `impulsionando-core` fica `Up`.
- As URLs respondem por HTTPS.
- Nao aparece erro de certificado.
- O Core continua com `LOVABLE_LEGACY_ENABLED=false`.
- O Traefik encaminha para a porta interna `80` do Nginx.
