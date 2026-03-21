-- Garante tabela e linha global (init antigo pode não ter criado PlatformSettings)
CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "minDeposit" REAL NOT NULL DEFAULT 10,
    "minWithdrawal" REAL NOT NULL DEFAULT 20,
    "commissionLevel1" REAL NOT NULL DEFAULT 10,
    "commissionLevel2" REAL NOT NULL DEFAULT 5,
    "commissionLevel3" REAL NOT NULL DEFAULT 2,
    "updatedAt" DATETIME NOT NULL
);

INSERT OR IGNORE INTO "PlatformSettings" ("id", "minDeposit", "minWithdrawal", "commissionLevel1", "commissionLevel2", "commissionLevel3", "updatedAt")
VALUES ('global', 10, 20, 10, 5, 2, CURRENT_TIMESTAMP);
