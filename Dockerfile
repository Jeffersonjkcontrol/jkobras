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
# Só sobe o servidor. As migrações NÃO rodam aqui: a imagem standalone é enxuta e
# não carrega as dependências do CLI do Prisma (@prisma/config e cia.).
# Quem aplica as migrações é o serviço one-shot "migrate" do compose (imagem builder,
# com node_modules completo), que roda antes do app — padrão de deploy real.
CMD ["node", "server.js"]
