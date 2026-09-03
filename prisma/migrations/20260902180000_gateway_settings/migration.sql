-- CreateTable
CREATE TABLE "GatewaySettings" (
    "id" TEXT NOT NULL,
    "activeGateway" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewaySettings_pkey" PRIMARY KEY ("id")
);
