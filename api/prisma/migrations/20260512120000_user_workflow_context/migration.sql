-- CreateTable
CREATE TABLE "UserWorkflowContext" (
    "userId" TEXT NOT NULL,
    "configText" TEXT NOT NULL DEFAULT '',
    "styleText" TEXT NOT NULL DEFAULT '',
    "scheduleText" TEXT NOT NULL DEFAULT '',
    "hookSystemText" TEXT NOT NULL DEFAULT '',
    "carouselDesignLanguage" TEXT NOT NULL DEFAULT '',
    "cronExpression" TEXT NOT NULL DEFAULT '0 9 * * 1',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWorkflowContext_pkey" PRIMARY KEY ("userId")
);
