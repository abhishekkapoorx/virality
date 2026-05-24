-- CreateTable
CREATE TABLE "UserSetupAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'collecting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSetupAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSetupProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "industry" TEXT,
    "icps" JSONB NOT NULL,
    "writingStyle" TEXT,
    "brandVoice" TEXT,
    "personalizationNotes" TEXT,
    "postConstraints" JSONB,
    "exampleAngles" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSetupProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPostSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schedule" JSONB NOT NULL,
    "cronExpr" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPostSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePostStyle" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "template" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplacePostStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceHook" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceHook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSelectedPostStyle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSelectedPostStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSelectedHook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSelectedHook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupAuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetupAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSetupAnswer_userId_idx" ON "UserSetupAnswer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetupProfile_userId_key" ON "UserSetupProfile"("userId");

-- CreateIndex
CREATE INDEX "UserSetupProfile_userId_idx" ON "UserSetupProfile"("userId");

-- CreateIndex
CREATE INDEX "WeeklyPostSchedule_userId_idx" ON "WeeklyPostSchedule"("userId");

-- AddForeignKey
ALTER TABLE "UserSetupAnswer" ADD CONSTRAINT "UserSetupAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetupProfile" ADD CONSTRAINT "UserSetupProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPostSchedule" ADD CONSTRAINT "WeeklyPostSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSelectedPostStyle" ADD CONSTRAINT "UserSelectedPostStyle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSelectedHook" ADD CONSTRAINT "UserSelectedHook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupAuditEvent" ADD CONSTRAINT "SetupAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
