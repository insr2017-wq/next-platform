-- Sistema de missões configuráveis

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "extraRouletteSpins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastMissionLoginDate" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastMissionRouletteDate" TEXT;

CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardValue" DOUBLE PRECISION NOT NULL,
    "resets" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT NOT NULL DEFAULT 'target',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserMissionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "currentProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMissionProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserMissionProgress_userId_missionId_periodStart_key" ON "UserMissionProgress"("userId", "missionId", "periodStart");
CREATE INDEX "UserMissionProgress_userId_idx" ON "UserMissionProgress"("userId");
CREATE INDEX "UserMissionProgress_missionId_idx" ON "UserMissionProgress"("missionId");

ALTER TABLE "UserMissionProgress" ADD CONSTRAINT "UserMissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserMissionProgress" ADD CONSTRAINT "UserMissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Mission" ("id", "title", "description", "type", "criterion", "targetValue", "rewardType", "rewardValue", "resets", "isActive", "icon", "sortOrder", "updatedAt")
VALUES
  ('mission_login_streak', 'Login e Roleta', 'Faça login por 5 dias seguidos', 'semanal', 'login_streak', 5, 'valor_fixo', 5, true, true, 'clock', 10, CURRENT_TIMESTAMP),
  ('mission_pix_key', 'Perfil completo', 'Complete seu perfil e cadastre sua chave Pix', 'permanente', 'cadastro_chave_pix', 1, 'giro_extra_roleta', 1, false, true, 'shield', 20, CURRENT_TIMESTAMP),
  ('mission_weekly_referral', 'Nova indicação da semana', 'Convide 1 nova pessoa essa semana', 'semanal', 'indicados_ativos', 1, 'valor_fixo', 2, true, true, 'zap', 30, CURRENT_TIMESTAMP),
  ('mission_first_active', 'Primeiro indicado ativo', 'Traga ao menos 1 indicado ativo', 'permanente', 'indicados_ativos', 1, 'valor_fixo', 10, false, true, 'users', 40, CURRENT_TIMESTAMP),
  ('mission_five_active', '5 indicados ativos', 'Traga 5 amigos que realizem a primeira compra', 'meta_indicacao', 'indicados_ativos', 5, 'valor_fixo', 50, false, true, 'users', 50, CURRENT_TIMESTAMP),
  ('mission_network_2000', 'Rede de R$ 2.000', 'Volume total movimentado pela sua rede', 'meta_indicacao', 'volume_rede', 2000, 'valor_fixo', 100, false, true, 'target', 60, CURRENT_TIMESTAMP),
  ('mission_first_deposit', 'Primeiro depósito', 'Faça um depósito confirmado', 'permanente', 'primeiro_deposito_min', 1, 'valor_fixo', 5, false, true, 'wallet', 70, CURRENT_TIMESTAMP);
