# Banco de dados em produção (Supabase / Vercel)

## Por que login/cadastro falham sem migrações

O app usa **PostgreSQL** via `DATABASE_URL`. Se o banco no Supabase **nunca recebeu** as tabelas do Prisma (`User`, `Referral`, etc.), qualquer `findUnique` / `create` falha (nos logs da Vercel aparece erro Prisma **`P2021`** ou “relation … does not exist”).

Isso **não** é bug de SQLite vs Postgres no código: o schema precisa ser **aplicado** no mesmo banco que a Vercel usa.

## 1) Aplicar o schema no Supabase

### Opção A — Prisma Migrate (recomendado)

Na sua máquina (ou CI), com a **mesma** connection string de produção (ou uma URL **direta** na porta 5432, se o Supabase separar pooler vs direct):

```bash
cd next-platform
# Defina a URL do Postgres (Settings → Database no Supabase)
set DATABASE_URL=postgresql://...   # PowerShell: $env:DATABASE_URL="..."
npx prisma migrate deploy
```

Use a URL **“Direct connection”** ou **“Session mode”** do painel do Supabase para migrações, se o pooler transacional (`:6543`) reclamar.

### Opção B — SQL manual

1. Abra **Supabase → SQL Editor**.
2. Cole e execute o conteúdo de `prisma/migrations/20260321000000_postgres_init/migration.sql` (ou rode `migrate deploy` uma vez e ignore esta opção).

## 2) Conferir se as tabelas existem

No Supabase: **Table Editor** — deve existir pelo menos `User` (e as demais do schema).

## 3) Variável na Vercel

- **`DATABASE_URL`**: connection string PostgreSQL (pooler `6543` costuma funcionar para o app serverless; migrações às vezes precisam da URL direta `5432`).

O código em `src/lib/database-url.ts` acrescenta automaticamente **`pgbouncer=true`** quando a URL aponta para o pooler da Supabase (host `pooler.supabase.com` ou porta `6543`). Isso evita falhas intermitentes do Prisma com PgBouncer (prepared statements). Opcional: defina **`AUTH_DEBUG=1`** na Vercel para logs de host/`pgbouncer` na primeira requisição que inicializar o Prisma.

## 4) Usuários do SQLite antigo

Contas criadas só no **`file:./prisma/dev.db` local **não existem** no Postgres do Supabase. É preciso **cadastrar de novo** em produção (ou importar dados manualmente).

## 5) Ler erros reais após o deploy

Nos logs de função da Vercel, as rotas `/api/auth/login` e `/api/auth/register` passam a registrar códigos Prisma (ex.: `P2021`) via `logPrismaOrServerError`.
