-- Idempotent for DBs that already have User from 20260510120000_init_tenant_user
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "User"("clerkUserId");
