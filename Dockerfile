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
  artifacts="$(find /app/.output /app/dist /app/.vinxi /app/.tanstack /app/build \
    -maxdepth 8 \( -name index.html -o -name index.mjs -o -name index.js -o -name server.mjs -o -name nitro.mjs \) \
    -print 2>/dev/null || true)"; \
  printf '%s\n' "$artifacts"; \
  test -n "$artifacts"

FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV LOVABLE_LEGACY_ENABLED=false

COPY --from=build /app /app

EXPOSE 3000

CMD ["bun", "scripts/start-hostinger.mjs"]
