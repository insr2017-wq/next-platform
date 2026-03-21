-- Check-in diário por dia de calendário (America/Sao_Paulo no app)
ALTER TABLE "User" ADD COLUMN "checkInLastDate" TEXT;
ALTER TABLE "User" ADD COLUMN "checkInLastSlot" INTEGER NOT NULL DEFAULT 0;
