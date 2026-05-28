import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

import { prisma } from "../lib/prisma.js";

export const DRAFT_QUEUE_NAME = "scheduled-draft-generation";

type DraftQueuePayload = {
  tenantId: string;
  userId: string;
  telegramUserId?: string | null;
  updateRequest?: string;
  source: "manual" | "schedule";
  dayKey?: string;
};

const redisConnection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

export const draftQueue = new Queue<DraftQueuePayload>(DRAFT_QUEUE_NAME, {
  connection: redisConnection
});

const draftQueueEvents = new QueueEvents(DRAFT_QUEUE_NAME, {
  connection: redisConnection
});

const cronDayMap: Record<string, string> = {
  sunday: "0",
  monday: "1",
  tuesday: "2",
  wednesday: "3",
  thursday: "4",
  friday: "5",
  saturday: "6"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function resolveDraftDeliveryTargetForUser(userId: string): Promise<{
  tenantId: string;
  telegramUserId: string | null;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, telegramUserId: true }
  });

  if (!user) {
    return null;
  }

  return {
    tenantId: user.tenantId,
    telegramUserId: user.telegramUserId
  };
}

function buildCronExpression(dayKey: string, sendTime: string): string {
  const [hourPart, minutePart] = sendTime.split(":");
  const hour = Number.parseInt(hourPart ?? "0", 10);
  const minute = Number.parseInt(minutePart ?? "0", 10);
  const dayOfWeek = cronDayMap[dayKey];

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || !dayOfWeek) {
    throw new Error(`Invalid schedule for ${dayKey}`);
  }

  return `${minute} ${hour} * * ${dayOfWeek}`;
}

async function removeExistingSchedules(userId: string, dayKey?: string) {
  const repeatableJobs = await draftQueue.getRepeatableJobs();
  const matchingJobs = repeatableJobs.filter((job) => {
    if (job.name !== "scheduled-draft-generation") {
      return false;
    }

    if (!job.id?.startsWith(`${userId}:`)) {
      return false;
    }

    return !dayKey || job.id.includes(`:${dayKey}`);
  });

  await Promise.all(matchingJobs.map((job) => draftQueue.removeRepeatableByKey(job.key)));
}

export async function enqueueDraftGeneration(payload: DraftQueuePayload) {
  return draftQueue.add("scheduled-draft-generation", payload, {
    jobId: `${payload.source}:${payload.userId}:${payload.dayKey ?? "manual"}:${Date.now()}`
  });
}

export async function enqueueDraftGenerationAndWait(payload: DraftQueuePayload) {
  await draftQueueEvents.waitUntilReady();
  const job = await enqueueDraftGeneration(payload);
  return job.waitUntilFinished(draftQueueEvents);
}

export async function syncDraftScheduleForUser(userId: string) {
  const target = await resolveDraftDeliveryTargetForUser(userId);
  if (!target) {
    await removeExistingSchedules(userId);
    return;
  }

  const schedule = await prisma.weeklyPostSchedule.findFirst({ where: { userId } });
  if (!schedule || !schedule.enabled) {
    await removeExistingSchedules(userId);
    return;
  }

  const scheduleSelection = isRecord(schedule.schedule) ? schedule.schedule : {};
  const selectedPostStyleIdsByDay = isRecord(scheduleSelection.selectedPostStyleIdsByDay)
    ? (scheduleSelection.selectedPostStyleIdsByDay as Record<string, string | null>)
    : {};
  const selectedPostStyleSendTimesByDay = isRecord(scheduleSelection.selectedPostStyleSendTimesByDay)
    ? (scheduleSelection.selectedPostStyleSendTimesByDay as Record<string, string | null>)
    : {};

  await removeExistingSchedules(userId);

  for (const [dayKey, styleId] of Object.entries(selectedPostStyleIdsByDay)) {
    const sendTime = selectedPostStyleSendTimesByDay[dayKey];
    if (!styleId || !sendTime) {
      continue;
    }

    const cronExpression = buildCronExpression(dayKey, sendTime);
    await draftQueue.add(
      "scheduled-draft-generation",
      {
        tenantId: target.tenantId,
        userId,
        telegramUserId: target.telegramUserId,
        source: "schedule",
        dayKey
      },
      {
        jobId: `schedule:${userId}:${dayKey}`,
        repeat: {
          pattern: cronExpression
        }
      }
    );
  }
}