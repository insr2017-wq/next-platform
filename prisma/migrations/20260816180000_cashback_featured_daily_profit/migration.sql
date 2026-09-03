ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "cashbackPercent" DOUBLE PRECISION NOT NULL DEFAULT 3;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "cashbackBandAmount" DOUBLE PRECISION NOT NULL DEFAULT 200;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "cashbackMinInvest" DOUBLE PRECISION NOT NULL DEFAULT 500;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "returnPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purchaseLocked" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product"
SET "returnPercent" = ROUND((("totalReturn" / "price") * 100)::numeric, 2)
WHERE "returnPercent" = 0 AND "price" > 0 AND "totalReturn" > 0;

CREATE TABLE IF NOT EXISTS "UserDailyProfit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDailyProfit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserDailyProfit_userId_date_key" ON "UserDailyProfit"("userId", "date");
CREATE INDEX IF NOT EXISTS "UserDailyProfit_userId_date_idx" ON "UserDailyProfit"("userId", "date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserDailyProfit_userId_fkey'
  ) THEN
    ALTER TABLE "UserDailyProfit"
      ADD CONSTRAINT "UserDailyProfit_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
