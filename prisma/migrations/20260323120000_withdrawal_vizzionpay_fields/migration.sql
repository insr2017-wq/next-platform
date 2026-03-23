-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "requesterIp" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "gatewayReceiptUrl" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "gatewayWebhookToken" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "gatewayStatus" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "gatewayFailureReason" TEXT;
