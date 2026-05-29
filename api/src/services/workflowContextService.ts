import { prisma } from "../lib/prisma.js";

/**
 * Build a prompt bundle from the new day-row model and other available tables.
 * Falls back to empty strings to preserve compatibility during migration.
 */
export async function getOrCreateWorkflowContext(userId: string) {
  // Build a minimal record-like object from available tables
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      setupProfile: true,
      selectedPostStyles: { include: { style: true } },
      selectedHooks: { include: { hook: true } }
    }
  });
  const profile = user?.setupProfile;

  // Build readable summaries from structured profile fields so the worker
  // receives human-friendly context for post generation.
  const industry = profile?.industry ?? "";
  const icps = Array.isArray(profile?.icps) ? profile!.icps.join(", ") : "";
  const writingStyle = profile?.writingStyle ?? "";
  const brandVoice = profile?.brandVoice ?? "";
  const personalizationNotes = profile?.personalizationNotes ?? "";
  const exampleAngles = profile?.exampleAngles ? JSON.stringify(profile.exampleAngles) : "";
  const postConstraints = profile?.postConstraints ? JSON.stringify(profile.postConstraints) : "";
  const detailedDocs = profile?.detailedDocs ? JSON.stringify(profile.detailedDocs) : "";

  const configText = [
    industry && `Industry: ${industry}`,
    icps && `ICP: ${icps}`,
    personalizationNotes && `Personalization: ${personalizationNotes}`,
    detailedDocs && `DetailedDocs: ${detailedDocs}`
  ]
    .filter(Boolean)
    .join("\\n");

  const styleText = [
    writingStyle && `WritingStyle: ${writingStyle}`,
    brandVoice && `BrandVoice: ${brandVoice}`,
    exampleAngles && `ExampleAngles: ${exampleAngles}`,
    postConstraints && `PostConstraints: ${postConstraints}`
  ]
    .filter(Boolean)
    .join("\\n");

  // Build schedule summary from selected post styles (day rows)
  const selectedStyles = user?.selectedPostStyles ?? [];
  const scheduleLines = selectedStyles.map((s) => {
    const title = s.style?.title ?? s.styleId;
    const when = s.sendTime ? `${s.sendTime} (${s.timezone ?? "UTC"})` : "unscheduled";
    return `${s.dayKey}: ${title} at ${when}`;
  });
  const scheduleText = scheduleLines.join("\\n");

  // Build hook system summary from selected hooks
  const selectedHooks = user?.selectedHooks ?? [];
  const hookLines = selectedHooks.map((h) => {
    const title = h.hook?.title ?? h.hookId;
    const desc = h.hook?.description ?? "";
    return desc ? `${title}: ${desc}` : title;
  });
  const hookSystemText = hookLines.join("\\n");

  return {
    userId,
    configText,
    styleText,
    scheduleText,
    hookSystemText,
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
    userFeedback: opts.userFeedback ?? "",
    updatedAt: record?.updatedAt ?? ""
  };
}

export default {};
