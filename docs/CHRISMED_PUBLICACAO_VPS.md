# CHRISMED — Publicação na VPS atual

Data: 2026-07-03

Este checklist fecha a publicação do cliente CHRISMED no endereço correto do Core:
`https://chrismed.impulsionando.com.br/`.

> Observação operacional: o domínio antigo `https://agenda.chrismed.com.br/` pertence ao projeto anterior e não entra nesta publicação agora.

## 1. Domínio final

- Domínio público oficial desta publicação: `chrismed.impulsionando.com.br`
- Rota pública no Core: `/chrismed`
- Home do subdomínio: ao acessar `/`, o Core redireciona para `/chrismed`
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

## 3. Proxy reverso do subdomínio

O virtual host de `chrismed.impulsionando.com.br` deve apontar para o serviço novo
do Core na VPS.

Exemplo Nginx:

```nginx
server {
  server_name chrismed.impulsionando.com.br;

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
certbot --nginx -d chrismed.impulsionando.com.br
```

## 4. Validação pós-publicação

Validar em produção:

```bash
curl -I https://chrismed.impulsionando.com.br/
curl -I https://chrismed.impulsionando.com.br/chrismed/agendar
curl -s https://chrismed.impulsionando.com.br/ | head
```

Checklist manual:

- Abrir `https://chrismed.impulsionando.com.br/` e confirmar que cai na experiência CHRISMED nova.
- Abrir `https://chrismed.impulsionando.com.br/chrismed/agendar`.
- Clicar no botão flutuante “Falar com Oliver” e confirmar abertura do WhatsApp `21 97253-7868`.
- Abrir `/chrismed/contato` e confirmar que o card “WhatsApp principal” usa o mesmo número.
- Rodar o diagnóstico autenticado `/chrismed/setup` e corrigir qualquer erro antes de tráfego real.
- Fazer um PIX de teste/sandbox, se disponível, e confirmar retorno do status de pagamento.
