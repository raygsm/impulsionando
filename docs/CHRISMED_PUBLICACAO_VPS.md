# CHRISMED — Publicação na VPS atual

Data: 2026-07-03

Este checklist fecha a publicação do novo projeto cliente CHRISMED no domínio
`https://agenda.chrismed.com.br/`, garantindo que o domínio deixe de apontar para
o projeto antigo e passe a servir o Core Impulsionando publicado na VPS atual.

## 1. Domínio final

- Domínio público oficial: `agenda.chrismed.com.br`
- Rota pública no Core: `/chrismed`
- Home do domínio: ao acessar `/`, o Core redireciona para `/chrismed`
- Fluxo de agendamento: `/chrismed/agendar`
- WhatsApp único oficial: `+55 21 97253-7868` (`5521972537868` no formato `wa.me`)

## 2. Publicação na VPS

Na VPS, publicar a imagem/serviço do Core atual e garantir que o processo escute
na porta interna configurada pelo Dockerfile (`3000`).

Com Docker direto, o serviço pode ser reconstruído e reiniciado com o padrão do
ambiente atual, por exemplo:

```bash
git pull --ff-only
npm install
npm run build
NODE_ENV=production HOST=0.0.0.0 PORT=3000 node .output/server/index.mjs
```

Com container, reconstruir a imagem do Core atual e reiniciar o serviço que está
atrás do proxy reverso da VPS:

```bash
docker build -t impulsionando-core:chrismed .
docker stop impulsionando-core || true
docker rm impulsionando-core || true
docker run -d --name impulsionando-core --restart unless-stopped -p 3000:3000 --env-file .env impulsionando-core:chrismed
```

## 3. Proxy reverso do domínio

O virtual host de `agenda.chrismed.com.br` deve apontar para o serviço novo do
Core na VPS, e não mais para o projeto antigo `chrismed.lovable.app`.

Exemplo Nginx:

```nginx
server {
  server_name agenda.chrismed.com.br;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Depois de alterar o proxy:

```bash
nginx -t
systemctl reload nginx
certbot --nginx -d agenda.chrismed.com.br
```

## 4. Validação pós-publicação

Validar em produção:

```bash
curl -I https://agenda.chrismed.com.br/
curl -I https://agenda.chrismed.com.br/chrismed/agendar
curl -s https://agenda.chrismed.com.br/ | head
```

Checklist manual:

- Abrir `https://agenda.chrismed.com.br/` e confirmar que cai na experiência CHRISMED nova.
- Abrir `https://agenda.chrismed.com.br/chrismed/agendar`.
- Clicar no botão flutuante “Falar com Oliver” e confirmar abertura do WhatsApp `21 97253-7868`.
- Abrir `/chrismed/contato` e confirmar que o card “WhatsApp principal” usa o mesmo número.
- Rodar o diagnóstico autenticado `/chrismed/setup` e corrigir qualquer erro antes de tráfego real.
- Fazer um PIX de teste/sandbox, se disponível, e confirmar retorno do status de pagamento.

## 5. Não desligar o projeto antigo imediatamente

Manter `chrismed.lovable.app` como fallback até confirmar:

1. `agenda.chrismed.com.br` servindo 100% pelo Core na VPS.
2. Webhooks Mercado Pago/Z-API/N8N apontando para o Core.
3. Sem escritas relevantes no projeto antigo.
4. Sem usuários autenticando no projeto antigo durante a janela de observação.
