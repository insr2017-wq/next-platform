-- Links configuráveis na página inicial (atalhos do usuário)
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "supportLink" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "appDownloadLink" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "communityLink" TEXT NOT NULL DEFAULT '';
