# Backend Foundation

This document describes the backend layer added to the platform: database, authentication, roles, and how to run and test it.

---

## 1. Database structure

### Technology

- **ORM:** Prisma
- **Database:** SQLite for development (file: `prisma/dev.db`). You can switch the datasource in `prisma/schema.prisma` to `postgresql` and set `DATABASE_URL` for production.

### User model (`prisma/schema.prisma`)

| Field         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| `id`          | String   | CUID, primary key                                |
| `fullName`    | String   | Default `""`                                     |
| `phone`       | String   | Unique; used for login                           |
| `passwordHash`| String   | Bcrypt hash; never store plain passwords         |
| `role`        | String   | `"user"` or `"admin"`                            |
| `balance`     | Float    | Default `0`                                      |
| `inviteCode`  | String   | Unique; generated per user                       |
| `referredBy`  | String?  | Invite code of referrer (optional)                |
| `createdAt`   | DateTime | Set on create                                    |
| `updatedAt`   | DateTime | Updated on every update                           |

---

## 2. Authentication

### Flow

- **Login:** POST `/api/auth/login` with `{ phone, password }`. Server checks credentials, sets an HTTP-only cookie with a JWT, and returns `{ role, redirectTo }`.
- **Register:** POST `/api/auth/register` with `{ phone, password, confirmPassword, inviteCode? }`. Server validates, ensures phone is unique, generates an invite code, hashes password, creates user. No session is created; user must log in.
- **Session:** GET `/api/auth/session` returns the current session payload from the cookie (or `null`).
- **Logout:** POST `/api/auth/logout` clears the session cookie.

### Password handling

- Passwords are hashed with **bcrypt** (cost 12) before storage.
- Plain passwords are never stored; only `passwordHash` is in the database.

### Session (JWT)

- **Library:** `jose` (HS256).
- **Cookie name:** `session`.
- **Cookie options:** HTTP-only, `path: /`, 7-day expiry, SameSite=Lax, Secure in production.
- **Payload:** `{ userId, role, phone, exp }`.
- **Secret:** `process.env.JWT_SECRET` (must be set in production).

---

## 3. Roles and redirects

- **`role: "user"`**  
  - After login → redirect to **`/home`**.  
  - Can access all app routes under `/home`, `/profile`, `/invite`, etc.  
  - Cannot access `/admin/*`.

- **`role: "admin"`**  
  - After login → redirect to **`/admin/dashboard`**.  
  - Can access `/admin/*`.  
  - If an admin visits `/login` or `/register` while logged in, they are redirected to `/admin/dashboard`.

---

## 4. Route protection (middleware)

- **File:** `src/middleware.ts`.
- **Behaviour:**
  - **Auth routes (`/login`, `/register`):** If the user has a valid session, redirect by role (admin → `/admin/dashboard`, user → `/home`).
  - **Admin routes (`/admin`, `/admin/*`):** Require a session; if role is not `admin`, redirect to `/home`.
  - **User app routes (`/home`, `/profile`, etc.):** Require a session; if not logged in, redirect to `/login`.
- Session is verified on the edge using the same JWT secret (no Prisma in middleware).

---

## 5. Files added or changed

### New files

| Path | Purpose |
|------|--------|
| `prisma/schema.prisma` | User model and SQLite datasource |
| `prisma/seed.ts` | Creates default admin user for development |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/auth.ts` | Password hash/verify, JWT create/verify, session cookie get/set/delete |
| `src/lib/auth-edge.ts` | Edge-safe JWT verify for middleware |
| `src/lib/invite-code.ts` | Generate unique invite codes |
| `src/app/api/auth/register/route.ts` | POST register |
| `src/app/api/auth/login/route.ts` | POST login |
| `src/app/api/auth/logout/route.ts` | POST logout |
| `src/app/api/auth/session/route.ts` | GET session |
| `src/middleware.ts` | Route protection and role-based redirects |
| `.env.example` | Example env vars (DATABASE_URL, JWT_SECRET) |
| `BACKEND.md` | This documentation |

### Modified files

| Path | Change |
|------|--------|
| `package.json` | Added deps (prisma, @prisma/client, bcryptjs, jose), dev deps (@types/bcryptjs, tsx), scripts (db:generate, db:migrate, db:seed, db:push), prisma seed config, and `prisma generate` in `build` |
| `src/app/(auth)/login/page.tsx` | Controlled inputs, call `/api/auth/login`, redirect by role, error/loading state |
| `src/app/(auth)/register/page.tsx` | Call `/api/auth/register`, error/loading state, redirect to `/login` on success |

---

## 6. Setup and run

### 1) Environment

Copy `.env.example` to `.env` and adjust:

- **DATABASE_URL** – For SQLite: `file:./prisma/dev.db` (or `file:./dev.db` so the file is created in `prisma/`).
- **JWT_SECRET** – Any long, random string; required in production.

### 2) Environment variables

Create a `.env` at the project root (or copy from `.env.example`):

- **DATABASE_URL** – For SQLite: `file:./prisma/dev.db`. (Used by Prisma CLI and by the app at runtime.)
- **JWT_SECRET** – Any long random string; required in production for session signing.

The app and `prisma.config.ts` load `.env` automatically.

### 3) Database

```bash
# Generate Prisma client (required before build; uses SQLite adapter)
npm run db:generate

# Create DB and run migrations (creates prisma/dev.db and User table)
npm run db:migrate

# Seed default admin user (optional)
npm run db:seed
```

If you prefer not to use migrations yet:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4) App

```bash
npm run dev
```

---

## 7. How to test login and admin

### Default admin (after seed)

| Field      | Value          |
|-----------|----------------|
| **Phone** | `11999999999` (only digits) |
| **Password** | `admin123` |

Steps:

1. Run `npm run db:seed` (once).
2. Open `/login`.
3. Log in with the above credentials.
4. You should be redirected to **`/admin/dashboard`** (admin role).

### Normal user

1. Open `/register`.
2. Register with a new phone (e.g. `11988887777`), password (min 6 characters), confirm password; invite code optional.
3. Open `/login` and log in with that phone and password.
4. You should be redirected to **`/home`** (user role).

### If login/register fail

- **Register:** See the red error on the page (e.g. phone already registered, passwords don't match).
- **Login:** "Telefone ou senha incorretos" = wrong credentials or user not found.
- **Session not sticking:** Cookie `session` is set on the login response; use same origin. In dev, check Network tab for Set-Cookie on `/api/auth/login` response.
- **Dev:** API may return the actual error message; check server logs and response body.

### Logout

- Call `POST /api/auth/logout` (e.g. from a “Sair” button that fetches this endpoint), then redirect to `/login`. The session cookie is cleared and middleware will send unauthenticated users to `/login` when they try to access app or admin routes.

---

## 8. Optional: logout in the UI

To add logout for the current user:

- From the client, call `fetch("/api/auth/logout", { method: "POST" })`, then `router.push("/login")`.
- You can add this to the Profile page or a header menu.

---

## Summary

- **Database:** Prisma + SQLite, single `User` table with role and invite fields.
- **Auth:** Login/register APIs, JWT in HTTP-only cookie, bcrypt for passwords.
- **Roles:** `user` → `/home`; `admin` → `/admin/dashboard`; middleware enforces access.
- **Frontend:** Login and register pages are wired to the new APIs; layout and design are unchanged.
