-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "publicId" TEXT,
    "fullName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "sponsoredUser" BOOLEAN NOT NULL DEFAULT false,
    "pixKeyType" TEXT,
    "pixKey" TEXT,
    "holderName" TEXT,
    "holderCpf" TEXT,
    "inviteCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "checkInLastDate" TEXT,
    "checkInLastSlot" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "gatewayTransactionId" TEXT,
    "gatewayProvider" TEXT,
    "pixCode" TEXT,
    "qrCodeImage" TEXT,
    "externalReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requestedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pixKeyType" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderCpf" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "gatewayTransactionId" TEXT,
    "gatewayProvider" TEXT,
    "externalReference" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "maxRedemptions" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusCodeRedemption" (
    "id" TEXT NOT NULL,
    "bonusCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusCodeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL,
    "dailyYield" DOUBLE PRECISION NOT NULL,
    "cycleDays" INTEGER NOT NULL,
    "totalReturn" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyYieldSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cycleDaysSnapshot" INTEGER NOT NULL DEFAULT 0,
    "daysPaid" INTEGER NOT NULL DEFAULT 0,
    "lastPayoutAt" TIMESTAMP(3),
    "earningStatus" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "UserProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "minDeposit" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "minWithdrawal" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "commissionLevel1" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "commissionLevel2" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "commissionLevel3" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "withdrawalFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "welcomeModalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "welcomeModalTitle" TEXT NOT NULL DEFAULT 'Boas-vindas',
    "welcomeModalText" TEXT NOT NULL DEFAULT '',
    "welcomeModalLink" TEXT NOT NULL DEFAULT '',
    "earningsTestMode" BOOLEAN NOT NULL DEFAULT false,
    "earningsTestIntervalMinutes" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCommission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceUserId" TEXT NOT NULL,
    "userProductId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "BonusCode_code_key" ON "BonusCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BonusCodeRedemption_bonusCodeId_userId_key" ON "BonusCodeRedemption"("bonusCodeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCommission_userProductId_level_key" ON "ReferralCommission"("userProductId", "level");

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusCodeRedemption" ADD CONSTRAINT "BonusCodeRedemption_bonusCodeId_fkey" FOREIGN KEY ("bonusCodeId") REFERENCES "BonusCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusCodeRedemption" ADD CONSTRAINT "BonusCodeRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProduct" ADD CONSTRAINT "UserProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProduct" ADD CONSTRAINT "UserProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_userProductId_fkey" FOREIGN KEY ("userProductId") REFERENCES "UserProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
