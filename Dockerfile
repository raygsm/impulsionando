FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_PUBLIC_SITE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV NITRO_PRESET=node-server
ENV VITE_PUBLIC_SITE_URL=${VITE_PUBLIC_SITE_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}

COPY package*.json ./
COPY pnpm-lock.yaml* ./

RUN corepack enable || true
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm install; fi

COPY . .

RUN if [ -f pnpm-lock.yaml ]; then pnpm run build; else npm run build; fi

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/public ./public
COPY --from=build /app/scripts/pulsonitor-worker.mjs ./scripts/pulsonitor-worker.mjs
COPY --from=build /app/scripts/start-core-runtime.mjs ./scripts/start-core-runtime.mjs

EXPOSE 3000

CMD ["node", "scripts/start-core-runtime.mjs"]
