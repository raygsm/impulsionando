FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml* ./

RUN corepack enable || true

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm install; fi

COPY . .

RUN if [ -f pnpm-lock.yaml ]; then pnpm run build; else npm run build; fi

FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location ~* (^|/)\.env {
    return 404;
  }

  location /health {
    access_log off;
    add_header Content-Type text/plain;
    return 200 "ok\n";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
