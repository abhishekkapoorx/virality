import { prisma } from "../lib/prisma.js";

/**
 * Build a prompt bundle from the new day-row model and other available tables.
 * Falls back to empty strings to preserve compatibility during migration.
 */
export async function getOrCreateWorkflowContext(userId: string) {
  // Build a minimal record-like object from available tables
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { setupProfile: true } });
  const profileText = user?.setupProfile?.detailedDocs ? JSON.stringify(user.setupProfile.detailedDocs) : "";

  return {
    userId,
    configText: profileText,
    styleText: "",
    scheduleText: "",
    hookSystemText: "",
    carouselDesignLanguage: "",
    cronExpression: "",
    updatedAt: new Date().toISOString()
  };
}

export async function upsertWorkflowContext(_data: any) {
  // Migration: storing per-user prompt context is no longer supported.
  throw new Error("upsertWorkflowContext is deprecated — use new setup APIs");
}

export function toWorkflowContextBundle(record: any, opts: { userFeedback?: string } = {}) {
  const todayDay = new Date().toLocaleString("en-US", { weekday: "long" });
  return {
    configText: record?.configText ?? "",
    styleText: record?.styleText ?? "",
    scheduleText: record?.scheduleText ?? "",
    hookSystemText: record?.hookSystemText ?? "",
    todayDay,
    userFeedback: opts.userFeedback ?? ""
  };
}

export default {};
