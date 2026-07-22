# syntax=docker/dockerfile:1

# ---- dependências ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
RUN npm install

# ---- desenvolvimento (usado pelo docker compose local) ----
FROM node:20-alpine AS dev
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# Gera o client, aplica migrações, popula (idempotente) e sobe o dev server.
CMD ["sh", "-lc", "npx prisma generate && npx prisma migrate deploy && (npx prisma db seed || true) && npm run dev"]

# ---- build de produção ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runner de produção (imagem enxuta p/ nuvem) ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
EXPOSE 3000
# Em produção: aplica migrações e inicia o servidor standalone.
CMD ["sh", "-lc", "npx prisma migrate deploy && node server.js"]
