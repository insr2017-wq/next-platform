-- Saldo inicial de novos cadastros (configurável no painel). Default 0.
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "initialUserBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Default do campo User.balance deixa de ser 25; linhas existentes não são alteradas.
ALTER TABLE "User" ALTER COLUMN "balance" SET DEFAULT 0;
