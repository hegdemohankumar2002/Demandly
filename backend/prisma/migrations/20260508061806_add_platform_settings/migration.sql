-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "platformName" TEXT NOT NULL DEFAULT 'Demandly',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "region" TEXT NOT NULL DEFAULT 'India',
    "defaultThreshold" INTEGER NOT NULL DEFAULT 300,
    "auctionDurationHours" INTEGER NOT NULL DEFAULT 48,
    "autoCloseNoActivityHrs" INTEGER NOT NULL DEFAULT 72,
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "flashEventMinUnits" INTEGER NOT NULL DEFAULT 50,
    "campaignVoteGoal" INTEGER NOT NULL DEFAULT 100,
    "emailNewRegistrations" BOOLEAN NOT NULL DEFAULT true,
    "emailThresholdMet" BOOLEAN NOT NULL DEFAULT true,
    "emailDailyDigest" BOOLEAN NOT NULL DEFAULT true,
    "emailNewDemandPools" BOOLEAN NOT NULL DEFAULT true,
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorForAdmins" BOOLEAN NOT NULL DEFAULT false,
    "autoLockAfterAttempts" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
