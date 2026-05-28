import {
  DEMO_USER_ID,
  SetupProfileSchema,
  type UserWorkflowContext,
  type UserWorkflowContextUpsert,
  type WorkflowContextBundle
} from "@linkedin-agent/shared";

import { prisma } from "../lib/prisma.js";

const dayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
] as const;

function defaultRow(userId: string) {
  return {
    userId,
    configText:
      "LinkedIn config: brand voice, audience (founders + operators), default hashtags #BuildInPublic #Leadership",
    styleText:
      "Writing style: professional, direct, practical. Use BUT -> THEREFORE loops. Vary sentence length (SMALL / MEDIUM / LARGE). End with a short punchline.",
    scheduleText:
      "Weekly schedule:\nMonday — Belief Reversal\nTuesday — Translation\nWednesday — Rejection Story\nThursday — 1-Minute Fix\nFriday — Storytelling",
    hookSystemText:
      "Hook system: Negative Warning, Lie Reveal, Curiosity Gap, Educational, Storytelling, Specific Audience Call-Out. Pick the hook that matches today's post type and goal.",
    carouselDesignLanguage:
      "Clean dark cards, neon blue accents, concise bullets, high contrast.",
    cronExpression: "0 9 * * 1"
  };
}

function toWorkflowContextRecord(params: {
  userId: string;
  configText: string;
  styleText: string;
  scheduleText: string;
  hookSystemText: string;
  carouselDesignLanguage: string;
  cronExpression: string;
  updatedAt: Date;
}): UserWorkflowContext {
  return {
    userId: params.userId,
    configText: params.configText,
    styleText: params.styleText,
    scheduleText: params.scheduleText,
    hookSystemText: params.hookSystemText,
    carouselDesignLanguage: params.carouselDesignLanguage,
    cronExpression: params.cronExpression,
    updatedAt: params.updatedAt.toISOString()
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function loadProfileBackedContext(userId: string): Promise<UserWorkflowContext | null> {
  const profile = await prisma.userSetupProfile.findUnique({ where: { userId } });
  if (!profile) {
    return null;
  }

  const detailedDocsResult = SetupProfileSchema.shape.detailedDocs.safeParse(profile.detailedDocs);
  const detailedDocs = detailedDocsResult.success ? detailedDocsResult.data : null;
  const selectedStyles = await prisma.userSelectedPostStyle.findMany({
    where: { userId },
    include: { style: true },
    orderBy: { ordering: "asc" }
  });
  const schedule = await prisma.weeklyPostSchedule.findFirst({ where: { userId } });
  const scheduleSelection =
    isRecord(schedule?.schedule) ? schedule.schedule : ({} as Record<string, unknown>);

  const selectedPostStyleIdsByDay =
    isRecord(scheduleSelection.selectedPostStyleIdsByDay)
      ? (scheduleSelection.selectedPostStyleIdsByDay as Record<string, string | null>)
      : {};
  const selectedPostStyleSendTimesByDay =
    isRecord(scheduleSelection.selectedPostStyleSendTimesByDay)
      ? (scheduleSelection.selectedPostStyleSendTimesByDay as Record<string, string | null>)
      : {};

  const scheduleText = dayOrder
    .map((dayKey) => {
      const selectedStyleId = selectedPostStyleIdsByDay[dayKey];
      if (!selectedStyleId) {
        return `${dayKey[0].toUpperCase()}${dayKey.slice(1)} — No post selected`;
      }

      const selectedStyle = selectedStyles.find((entry) => entry.styleId === selectedStyleId);
      const styleTitle = selectedStyle?.style?.title ?? selectedStyleId;
      const sendTime = selectedPostStyleSendTimesByDay[dayKey] ?? selectedStyle?.sendTime ?? "09:00";
      return `${dayKey[0].toUpperCase()}${dayKey.slice(1)} — ${styleTitle} at ${sendTime}`;
    })
    .join("\n");

  const configParts = [
    `Industry: ${profile.industry ?? "Not specified"}`,
    `ICPs: ${profile.icps.length > 0 ? profile.icps.join(", ") : "Not specified"}`,
    detailedDocs?.industryNarrative ? `Narrative: ${detailedDocs.industryNarrative}` : null,
    detailedDocs?.topicLanes?.length ? `Topic lanes: ${detailedDocs.topicLanes.join(", ")}` : null,
    toStringArray(profile.exampleAngles).length > 0
      ? `Example angles: ${toStringArray(profile.exampleAngles).join(", ")}`
      : null
  ].filter((part): part is string => Boolean(part));

  const styleParts = [
    profile.writingStyle ? `Writing style: ${profile.writingStyle}` : null,
    profile.brandVoice ? `Brand voice: ${profile.brandVoice}` : null,
    profile.personalizationNotes ? `Personalization notes: ${profile.personalizationNotes}` : null,
    detailedDocs?.writingStyleGuide ? `Style guide: ${detailedDocs.writingStyleGuide}` : null,
    detailedDocs?.brandVoiceGuide ? `Voice guide: ${detailedDocs.brandVoiceGuide}` : null,
    detailedDocs?.personalizationGuide ? `Personalization guide: ${detailedDocs.personalizationGuide}` : null
  ].filter((part): part is string => Boolean(part));

  const hookSystemParts = [
    "Selected hooks:",
    selectedStyles.length > 0
      ? selectedStyles
          .map((entry) => `- ${entry.style.title}: ${entry.style.description ?? entry.style.templateShortDescription}`)
          .join("\n")
      : "- No post styles selected yet.",
    detailedDocs?.icpCards?.length
      ? `ICP cards:\n${detailedDocs.icpCards
          .map((card) => `- ${card.label}: ${card.messageAngles.join(" | ")}`)
          .join("\n")}`
      : null
  ].filter((part): part is string => Boolean(part));

  return toWorkflowContextRecord({
    userId,
    configText: configParts.join("\n"),
    styleText: styleParts.join("\n"),
    scheduleText,
    hookSystemText: hookSystemParts.join("\n"),
    carouselDesignLanguage:
      detailedDocs?.brandVoiceGuide ?? profile.brandVoice ?? defaultRow(userId).carouselDesignLanguage,
    cronExpression: schedule?.cronExpr ?? defaultRow(userId).cronExpression,
    updatedAt: profile.updatedAt
  });
}

export async function getOrCreateWorkflowContext(
  userId: string = DEMO_USER_ID
): Promise<UserWorkflowContext> {
  const profileBacked = await loadProfileBackedContext(userId);
  if (profileBacked) {
    return profileBacked;
  }

  const existing = await prisma.userWorkflowContext.findUnique({ where: { userId } });
  if (existing) {
    return toWorkflowContextRecord(existing);
  }

  const created = await prisma.userWorkflowContext.create({ data: defaultRow(userId) });
  return toWorkflowContextRecord(created);
}

export async function upsertWorkflowContext(
  input: UserWorkflowContextUpsert
): Promise<UserWorkflowContext> {
  const row = await prisma.userWorkflowContext.upsert({
    where: { userId: input.userId },
    create: {
      ...defaultRow(input.userId),
      ...input
    },
    update: {
      configText: input.configText,
      styleText: input.styleText,
      scheduleText: input.scheduleText,
      hookSystemText: input.hookSystemText,
      carouselDesignLanguage: input.carouselDesignLanguage,
      cronExpression: input.cronExpression
    }
  });
  return toWorkflowContextRecord(row);
}

/** Maps DB row → LangGraph `WorkflowContextBundle` (n8n Concated Context). */
export function toWorkflowContextBundle(
  record: UserWorkflowContext,
  options: { userFeedback?: string; todayDay?: string } = {}
): WorkflowContextBundle {
  const todayDay = options.todayDay ?? new Date().toLocaleString("en-US", { weekday: "long" });

  return {
    configText: record.configText,
    styleText: record.styleText,
    scheduleText: record.scheduleText,
    hookSystemText: record.hookSystemText,
    todayDay,
    userFeedback: options.userFeedback?.trim() ? options.userFeedback : "None"
  };
}