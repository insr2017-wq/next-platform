-- RedefineTable-style: SQLite add columns for earning snapshots
ALTER TABLE "UserProduct" ADD COLUMN "dailyYieldSnapshot" REAL NOT NULL DEFAULT 0;
ALTER TABLE "UserProduct" ADD COLUMN "cycleDaysSnapshot" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserProduct" ADD COLUMN "daysPaid" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserProduct" ADD COLUMN "lastPayoutAt" DATETIME;
ALTER TABLE "UserProduct" ADD COLUMN "earningStatus" TEXT NOT NULL DEFAULT 'active';

UPDATE "UserProduct"
SET
  "dailyYieldSnapshot" = COALESCE((SELECT "dailyYield" FROM "Product" WHERE "Product"."id" = "UserProduct"."productId"), 0),
  "cycleDaysSnapshot" = COALESCE(
    (SELECT CASE WHEN "cycleDays" < 1 THEN 1 ELSE "cycleDays" END FROM "Product" WHERE "Product"."id" = "UserProduct"."productId"),
    1
  )
WHERE EXISTS (SELECT 1 FROM "Product" P WHERE P."id" = "UserProduct"."productId");
