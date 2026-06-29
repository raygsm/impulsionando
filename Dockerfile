# syntax=docker/dockerfile:1

FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
WORKDIR /app

ARG APP_BASE_URL
ARG PUBLIC_APP_URL
ARG PUBLIC_SITE_URL
ARG SITE_URL
ARG VITE_PUBLIC_SITE_URL
ARG SUPABASE_URL
ARG SUPABASE_PUBLISHABLE_KEY
ARG SUPABASE_ANON_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV NODE_ENV=production
ENV LOVABLE_LEGACY_ENABLED=false
ENV APP_BASE_URL=$APP_BASE_URL
ENV PUBLIC_APP_URL=$PUBLIC_APP_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV SITE_URL=$SITE_URL
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

COPY . .
RUN bun run build
RUN set -eux; \
  rm -rf /app/docker-public; \
  mkdir -p /app/docker-public; \
  for candidate in /app/dist /app/.output/public /app/dist/client /app/build /app/build/client; do \
    if [ -f "$candidate/index.html" ]; then \
      cp -a "$candidate"/. /app/docker-public/; \
      break; \
    fi; \
  done; \
  test -f /app/docker-public/index.html

FROM nginx:1.27-alpine AS runner

ENV NODE_ENV=production
ENV LOVABLE_LEGACY_ENABLED=false

COPY deploy/hostinger/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/docker-public/ /usr/share/nginx/html/
RUN test -f /usr/share/nginx/html/index.html && ! grep -qi "Welcome to nginx" /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
