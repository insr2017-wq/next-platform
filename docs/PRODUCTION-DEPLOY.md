# Deploy em produção (VPS + PM2 + PostgreSQL)

Este projeto usa **Prisma Client gerado em `generated/prisma/`** (não o default `node_modules/.prisma/client`). O build do Next.js precisa incluir essa pasta no bundle de runtime.

## Sintoma comum

`Invalid prisma.user.findUnique() invocation` (500) no cadastro/login, enquanto `curl http://localhost:3000/api/...` funciona:

1. **Client Prisma desatualizado** em relação ao `schema.prisma` ou ao bundle `.next/`
2. **Deploy incompleto** (faltou `prisma generate` ou `npm run clean` antes do build)
3. **PM2** ainda servindo processo antigo ou múltiplas instâncias com builds diferentes

## Checklist obrigatório (na VPS, na pasta do app)

```bash
cd /caminho/do/app

# 1. Código atualizado
git pull   # ou rsync/scp do artefato

# 2. Dependências (postinstall roda prisma generate)
npm ci

# 3. Regenerar client (redundante com postinstall, mas explícito)
npx prisma generate

# 4. Migrações no Postgres (se houver novas)
npx prisma migrate deploy

# 5. Limpar cache de build e rebuild
npm run clean
npm run build

# 6. Reiniciar PM2 (todas as instâncias)
pm2 restart all
# ou: pm2 restart nome-do-app

# 7. Conferir logs
pm2 logs --lines 100
```

## Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | PostgreSQL (nunca `file:`) |
| `NODE_ENV` | Use `production` na VPS |
| `NEXT_PUBLIC_APP_URL` | URL pública (`https://nx-tc.online`) — links de convite, callbacks |
| `APP_URL` | Mesmo valor que `NEXT_PUBLIC_APP_URL` (server-side) |
| `NEXT_PUBLIC_BASE_URL` | Mesmo valor (fallback em `invite-link.ts`) |
| `NEXTAUTH_URL` | Mesmo valor (se usar NextAuth no futuro) |
| `JWT_SECRET` / `NEXTAUTH_SECRET` | Segredos de sessão (não reutilizar entre ambientes) |
| `AUTH_DEBUG` | `1` só para diagnosticar (loga host DB e detalhe de erro Prisma nos logs) |

Após trocar o domínio, atualize o `.env` na VPS e rode `npm run deploy:prod && pm2 restart all` para rebuild com as novas URLs embutidas em `NEXT_PUBLIC_*`.

## Verificação rápida

```bash
# Mesmo payload do formulário (com nome e convite opcional)
curl -s -X POST http://127.0.0.1:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Teste","phone":"11999999999","password":"123456","confirmPassword":"123456"}'

# Via domínio público (passa pelo Nginx)
curl -s -X POST https://nx-tc.online/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Teste","phone":"11988887777","password":"123456","confirmPassword":"123456"}'
```

Se localhost OK e domínio falhar → Nginx/proxy apontando para outra porta ou instância PM2 antiga.

## Onde o Prisma é importado

- **Client:** `generated/prisma/client` via `@/lib/prisma-generated`
- **Instância singleton:** `@/lib/db` (`prisma`) — use sempre este import nas rotas API
- **Não** importar `@prisma/client` diretamente para models (só runtime interno do generator)

## Script npm (atalho)

```bash
npm run deploy:prod
```

Equivalente a: `prisma generate` → `clean` → `build` (depois rode `pm2 restart` manualmente).
