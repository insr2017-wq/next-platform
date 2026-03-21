-- Add optional Pix key fields to User for withdrawals/receiving
ALTER TABLE "User" ADD COLUMN "pixKeyType" TEXT;
ALTER TABLE "User" ADD COLUMN "pixKey" TEXT;
