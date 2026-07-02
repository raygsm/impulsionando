FROM node:22-alpine AS build

WORKDIR /app

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

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["npx", "nitro", "preview", "--host", "0.0.0.0", "--port", "3000"]
