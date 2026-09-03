ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "initialUserBalance" DOUBLE PRECISION NOT NULL DEFAULT 25;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "depositCommissionL1First" DOUBLE PRECISION NOT NULL DEFAULT 20;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "depositCommissionL1Next" DOUBLE PRECISION NOT NULL DEFAULT 8;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "depositCommissionL2" DOUBLE PRECISION NOT NULL DEFAULT 2;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "depositCommissionL3" DOUBLE PRECISION NOT NULL DEFAULT 1;

ALTER TABLE "Mission" ADD COLUMN IF NOT EXISTS "requiredLevel" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "RoulettePrize" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'balance',
    "probability" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoulettePrize_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RouletteSpinLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RouletteSpinLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RouletteSpinLog_userId_createdAt_idx" ON "RouletteSpinLog"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RouletteSpinLog_userId_fkey') THEN
    ALTER TABLE "RouletteSpinLog"
      ADD CONSTRAINT "RouletteSpinLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RouletteSpinLog_prizeId_fkey') THEN
    ALTER TABLE "RouletteSpinLog"
      ADD CONSTRAINT "RouletteSpinLog_prizeId_fkey"
      FOREIGN KEY ("prizeId") REFERENCES "RoulettePrize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PaymentGatewayConfig" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "publicKey" TEXT NOT NULL DEFAULT '',
    "secretKey" TEXT NOT NULL DEFAULT '',
    "extraJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DepositReferralPayout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceUserId" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DepositReferralPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DepositReferralPayout_depositId_level_key" ON "DepositReferralPayout"("depositId", "level");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DepositReferralPayout_userId_fkey') THEN
    ALTER TABLE "DepositReferralPayout"
      ADD CONSTRAINT "DepositReferralPayout_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DepositReferralPayout_sourceUserId_fkey') THEN
    ALTER TABLE "DepositReferralPayout"
      ADD CONSTRAINT "DepositReferralPayout_sourceUserId_fkey"
      FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
