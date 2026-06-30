# Deploy Hostinger do Impulsionando Core

Este e o caminho oficial para publicar o Core na VPS Hostinger, atras do Traefik que ja roda junto do n8n.

O objetivo deste deploy e simples: a Hostinger deve baixar a imagem pronta do GitHub Container Registry e rodar o Core. A VPS nao deve compilar o projeto.

## Regra principal

Use sempre esta imagem no container:

```text
ghcr.io/raygsm/impulsionando-core:hostinger-verified
```

Nao use tag com SHA de commit e nao use a tag `security-autonomy-audit` para o deploy manual da Hostinger. A tag `hostinger-verified` e atualizada automaticamente pelo workflow `Build Core Docker Image` somente depois que a imagem passa por estes testes:

- `/health` contem `runtime=impulsionando-core-bun`;
- `/__impulsionando-runtime` contem `"runtime": "impulsionando-core-bun"`;
- `/` nao contem a pagina padrao do Nginx (`Welcome to nginx`).

## URLs atendidas

- `https://impulsionando.com.br`
- `https://www.impulsionando.com.br`
- `https://app.impulsionando.com.br`
- `https://*.impulsionando.com.br`
- `https://*.*.impulsionando.com.br`

## Como publicar pela tela da Hostinger

1. Abra a Hostinger.
2. Entre na VPS `srv1777313.hstgr.cloud`.
3. Va em `Gerenciador Docker`.
4. Clique em `Projetos`.
5. Abra o projeto `impulsionando-core`.
6. Clique em `Gerenciar`.
7. Entre em `Editor visual`.
8. No container `impulsionando-core`, clique no icone de lapis.
9. No campo da imagem, coloque exatamente:

```text
ghcr.io/raygsm/impulsionando-core:hostinger-verified
```

10. Abra a area `Ambiente`.
11. Confirme estas variaveis:

```text
SUPABASE_URL=https://arygtqrdpcdkwnuwsgmm.supabase.co
SUPABASE_PUBLISHABLE_KEY=COLE_A_CHAVE_PUBLICAVEL_DO_SUPABASE
SUPABASE_ANON_KEY=COLE_A_MESMA_CHAVE_PUBLICAVEL_DO_SUPABASE
VITE_SUPABASE_URL=https://arygtqrdpcdkwnuwsgmm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=COLE_A_MESMA_CHAVE_PUBLICAVEL_DO_SUPABASE
```

12. Salve.
13. Clique em `Implantar`.
14. Aguarde o status ficar `Em execucao`.

## Como validar

Depois de implantar, abra primeiro:

```text
https://app.impulsionando.com.br/health
```

O resultado esperado contem:

```text
ok
runtime=impulsionando-core-bun
mode=server|static|emergency
version=<sha publicado pelo GitHub>
```

Depois abra:

```text
https://app.impulsionando.com.br/__impulsionando-runtime
```

O resultado esperado contem:

```json
{
  "ok": true,
  "runtime": "impulsionando-core-bun",
  "version": "<sha publicado pelo GitHub>"
}
```

Se `/health` responder `OK`, mas a pagina principal mostrar `Welcome to nginx`, o problema nao e DNS, Supabase, N8N ou Cloudflare. Isso significa que a Hostinger ainda esta entregando uma imagem antiga, um container antigo, ou uma rota antiga do Traefik.

Nesse caso, nao altere Cloudflare, DNS, SSL/TLS, Supabase nem N8N. Volte ao projeto `impulsionando-core` na Hostinger e confirme que a imagem do container e exatamente:

```text
ghcr.io/raygsm/impulsionando-core:hostinger-verified
```

## Arquivo Compose oficial

O arquivo `docker-compose.image.yml` contem a configuracao completa para o modo por imagem pronta. Ele deve ser usado como referencia quando a Hostinger pedir um Compose manual.
