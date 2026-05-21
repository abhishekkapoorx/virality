import {
  DEMO_USER_ID,
  type UserWorkflowContext,
  type UserWorkflowContextUpsert,
  type WorkflowContextBundle
} from "@linkedin-agent/shared";

import { prisma } from "../lib/prisma.js";

function defaultRow(userId: string) {
  return {
    userId,
    configText:
      "LinkedIn config: brand voice, audience (founders + operators), default hashtags #BuildInPublic #Leadership",
    styleText:
      "Writing style: professional, direct, practical. Use BUT → THEREFORE loops. Vary sentence length (SMALL / MEDIUM / LARGE). End with a short punchline.",
    scheduleText:
      "Weekly schedule:\nMonday — Belief Reversal\nTuesday — Translation\nWednesday — Rejection Story\nThursday — 1-Minute Fix\nFriday — Storytelling",
    hookSystemText:
      "Hook system: Negative Warning, Lie Reveal, Curiosity Gap, Educational, Storytelling, Specific Audience Call-Out. Pick the hook that matches today's post type and goal.",
    carouselDesignLanguage:
      "Clean dark cards, neon blue accents, concise bullets, high contrast.",
    cronExpression: "0 9 * * 1"
  };
}

function toRecord(row: {
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
    userId: row.userId,
    configText: row.configText,
    styleText: row.styleText,
    scheduleText: row.scheduleText,
    hookSystemText: row.hookSystemText,
    carouselDesignLanguage: row.carouselDesignLanguage,
    cronExpression: row.cronExpression,
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function getOrCreateWorkflowContext(
  userId: string = DEMO_USER_ID
): Promise<UserWorkflowContext> {
  const existing = await prisma.userWorkflowContext.findUnique({
    where: { userId }
  });
  if (existing) {
    return toRecord(existing);
  }

  const created = await prisma.userWorkflowContext.create({
    data: defaultRow(userId)
  });
  return toRecord(created);
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
  return toRecord(row);
}

/** Maps DB row → LangGraph `WorkflowContextBundle` (n8n Concated Context). */
export function toWorkflowContextBundle(
  record: UserWorkflowContext,
  options: { userFeedback?: string; todayDay?: string } = {}
): WorkflowContextBundle {
  const todayDay =
    options.todayDay ??
    new Date().toLocaleString("en-US", { weekday: "long" });

  return {
    configText: record.configText,
    styleText: record.styleText,
    scheduleText: record.scheduleText,
    hookSystemText: record.hookSystemText,
    todayDay,
    userFeedback: options.userFeedback?.trim() ? options.userFeedback : "None"
  };
}
