# 🏗️ Obras Gestão

Sistema de gestão para **construção civil e arquitetura**: clientes, projetos/obras com cronograma (Gantt),
etapas e sub-etapas (checklist), e **Diário de Obra (RDO)** feito no celular no canteiro (checklist da
situação + fotos pela câmera).

Stack: **Next.js 16 + React 19 + Tailwind v4 + Prisma 6 + PostgreSQL + Auth.js v5**. Roda **no Docker**
(local) e a imagem de produção (`output: standalone`) está pronta para deploy em nuvem.

## Rodar local (Docker)

```bash
docker compose build
docker compose up -d db          # sobe o Postgres
# gera a migração inicial (só na 1ª vez):
docker compose run --rm app npx prisma migrate dev --name init --skip-seed
docker compose up                # sobe o app (migra + seed + dev) em http://localhost:3000
```

Acesse **http://localhost:3000** e entre com:

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `admin@obras.com` | `admin123` |
| Gestor | `gestor@obras.com` | `gestor123` |

Os dados ficam num volume Docker do Postgres (persistem entre `up`/`down`).

## Estrutura
- `src/app/(app)/` — telas autenticadas (dashboard, projetos, clientes, usuários)
- `src/app/actions/` — Server Actions (regras + escrita no banco)
- `src/lib/` — utilitários, permissões (RBAC), lógica de projetos/etapas
- `src/components/` — UI kit próprio + formulários
- `prisma/schema.prisma` — modelos (PostgreSQL); `prisma/seed.ts` — dados iniciais

## Deploy em nuvem (depois)
A imagem `runner` do `Dockerfile` roda `prisma migrate deploy && node server.js`. Basta um Postgres
gerenciado (DATABASE_URL) + as variáveis `AUTH_SECRET`/`AUTH_TRUST_HOST`.
