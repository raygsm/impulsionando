FROM node:22-alpine AS build

WORKDIR /app

ENV NITRO_PRESET=node-server

COPY package*.json ./
COPY package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

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

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
