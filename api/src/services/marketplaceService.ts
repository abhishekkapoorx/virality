import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

function toTextSearchQuery(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function mapHook(row: {
  id: string;
  ownerUserId: string | null;
  visibility: string;
  title: string;
  description: string | null;
  tags: string[];
  definition: unknown;
  createdAt: Date;
  updatedAt: Date;
}, currentUserId?: string) {
  const definition = (typeof row.definition === "object" && row.definition !== null ? row.definition : {}) as Record<
    string,
    unknown
  >;

  return {
    id: row.id,
    title: row.title,
    author: row.ownerUserId === currentUserId ? "You" : row.ownerUserId ? "Community" : "LinkedIn Agent",
    isMine: row.ownerUserId === currentUserId,
    shortDescription: row.description ?? String(definition.shortDescription ?? ""),
    longDescription: String(definition.longDescription ?? row.description ?? ""),
    visibility: row.visibility,
    icon: typeof definition.icon === "string" ? definition.icon : undefined,
    tags: row.tags ?? [],
    examples: Array.isArray(definition.examples)
      ? definition.examples.filter((item): item is string => typeof item === "string")
      : [],
    whenToUse: String(definition.whenToUse ?? ""),
    psychologicalEffect: String(definition.psychologicalEffect ?? ""),
    ownerUserId: row.ownerUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapPostStyle(row: {
  id: string;
  ownerUserId: string | null;
  visibility: string;
  title: string;
  description: string | null;
  tags: string[];
  template: unknown;
  createdAt: Date;
  updatedAt: Date;
}, currentUserId?: string) {
  const template = (typeof row.template === "object" && row.template !== null ? row.template : {}) as Record<
    string,
    unknown
  >;

  return {
    id: row.id,
    title: row.title,
    author: row.ownerUserId === currentUserId ? "You" : row.ownerUserId ? "Community" : "LinkedIn Agent",
    isMine: row.ownerUserId === currentUserId,
    shortDescription: row.description ?? String(template.shortDescription ?? ""),
    longDescription: String(template.longDescription ?? row.description ?? ""),
    visibility: row.visibility,
    icon: typeof template.icon === "string" ? template.icon : undefined,
    tags: row.tags ?? [],
    structure: String(template.structure ?? ""),
    expectedHooks: Array.isArray(template.expectedHooks)
      ? template.expectedHooks.filter((item): item is string => typeof item === "string")
      : [],
    outcome: String(template.outcome ?? ""),
    ownerUserId: row.ownerUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function filterVisibleHook(row: { visibility: string; ownerUserId: string | null }, userId: string): boolean {
  return row.visibility === "public" || row.ownerUserId === userId;
}

function filterVisiblePostStyle(row: { visibility: string; ownerUserId: string | null }, userId: string): boolean {
  return row.visibility === "public" || row.ownerUserId === userId;
}

function normalizeDaySelections(value: unknown): Record<string, string | null> {
  const result: Record<string, string | null> = {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) return result;

  for (const key of Object.keys(result)) {
    const next = (value as Record<string, unknown>)[key];
    result[key] = typeof next === "string" && next.length > 0 ? next : null;
  }

  return result;
}

async function replaceSelections(userId: string, selectedHookIds: string[], selectedPostStyleIdsByDay: Record<string, string | null>) {
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const selectedPostStyleEntries = dayOrder.flatMap((dayKey, ordering) => {
    const styleId = selectedPostStyleIdsByDay[dayKey];
    if (typeof styleId !== "string" || styleId.length === 0) return [];

    return [{
      userId,
      styleId,
      ordering
    }];
  });

  await prisma.$transaction(async (tx) => {
    await tx.userSelectedHook.deleteMany({ where: { userId } });
    await tx.userSelectedPostStyle.deleteMany({ where: { userId } });

    if (selectedHookIds.length > 0) {
      await tx.userSelectedHook.createMany({
        data: selectedHookIds.map((hookId, ordering) => ({ userId, hookId, ordering }))
      });
    }

    if (selectedPostStyleEntries.length > 0) {
      await tx.userSelectedPostStyle.createMany({
        data: selectedPostStyleEntries
      });
    }

    const existingSchedule = await tx.weeklyPostSchedule.findFirst({ where: { userId } });
    if (existingSchedule) {
      await tx.weeklyPostSchedule.update({
        where: { id: existingSchedule.id },
        data: { schedule: { selectedPostStyleIdsByDay } }
      });
      return;
    }

    await tx.weeklyPostSchedule.create({
      data: {
        userId,
        schedule: { selectedPostStyleIdsByDay },
        cronExpr: null,
        enabled: false
      }
    });
  });
}

export async function listHooksForUser(userId: string, query?: string | null) {
  const rows = await prisma.marketplaceHook.findMany({ orderBy: [{ visibility: "desc" }, { createdAt: "desc" }] });
  const filtered = rows.filter((row) => filterVisibleHook(row, userId));
  const normalizedQuery = toTextSearchQuery(query);

  return filtered
    .map((row) => mapHook(row, userId))
    .filter((row) => {
      if (!normalizedQuery) return true;
      return [row.title, row.author, row.shortDescription, row.longDescription, ...(row.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
}

export async function listPostStylesForUser(userId: string, query?: string | null) {
  const rows = await prisma.marketplacePostStyle.findMany({ orderBy: [{ visibility: "desc" }, { createdAt: "desc" }] });
  const filtered = rows.filter((row) => filterVisiblePostStyle(row, userId));
  const normalizedQuery = toTextSearchQuery(query);

  return filtered
    .map((row) => mapPostStyle(row, userId))
    .filter((row) => {
      if (!normalizedQuery) return true;
      return [row.title, row.author, row.shortDescription, row.longDescription, ...(row.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
}

async function ensureAccessibleHook(userId: string, hookId: string) {
  const row = await prisma.marketplaceHook.findUnique({ where: { id: hookId } });
  if (!row || !filterVisibleHook(row, userId)) return null;
  return row;
}

async function ensureAccessiblePostStyle(userId: string, postStyleId: string) {
  const row = await prisma.marketplacePostStyle.findUnique({ where: { id: postStyleId } });
  if (!row || !filterVisiblePostStyle(row, userId)) return null;
  return row;
}

export async function getHookById(userId: string, hookId: string) {
  const row = await ensureAccessibleHook(userId, hookId);
  return row ? mapHook(row, userId) : null;
}

export async function getPostStyleById(userId: string, postStyleId: string) {
  const row = await ensureAccessiblePostStyle(userId, postStyleId);
  return row ? mapPostStyle(row, userId) : null;
}

export async function createHookForUser(userId: string, payload: {
  title: string;
  shortDescription: string;
  longDescription: string;
  visibility: "public" | "private";
  icon?: string;
  tags?: string[];
  examples?: string[];
  whenToUse?: string;
  psychologicalEffect?: string;
}) {
  const row = await prisma.marketplaceHook.create({
    data: {
      ownerUserId: userId,
      visibility: payload.visibility,
      title: payload.title,
      description: payload.shortDescription,
      tags: payload.tags ?? [],
      definition: {
        shortDescription: payload.shortDescription,
        longDescription: payload.longDescription,
        icon: payload.icon ?? null,
        examples: payload.examples ?? [],
        whenToUse: payload.whenToUse ?? "",
        psychologicalEffect: payload.psychologicalEffect ?? ""
      }
    }
  });

  return mapHook(row, userId);
}

export async function updateHookForUser(userId: string, hookId: string, payload: {
  title: string;
  shortDescription: string;
  longDescription: string;
  visibility: "public" | "private";
  icon?: string;
  tags?: string[];
  examples?: string[];
  whenToUse?: string;
  psychologicalEffect?: string;
}) {
  const existing = await ensureAccessibleHook(userId, hookId);
  if (!existing || existing.ownerUserId !== userId) return null;

  const row = await prisma.marketplaceHook.update({
    where: { id: hookId },
    data: {
      visibility: payload.visibility,
      title: payload.title,
      description: payload.shortDescription,
      tags: payload.tags ?? [],
      definition: {
        shortDescription: payload.shortDescription,
        longDescription: payload.longDescription,
        icon: payload.icon ?? null,
        examples: payload.examples ?? [],
        whenToUse: payload.whenToUse ?? "",
        psychologicalEffect: payload.psychologicalEffect ?? ""
      }
    }
  });

  return mapHook(row, userId);
}

export async function deleteHookForUser(userId: string, hookId: string): Promise<boolean> {
  const existing = await ensureAccessibleHook(userId, hookId);
  if (!existing || existing.ownerUserId !== userId) return false;

  await prisma.$transaction([
    prisma.userSelectedHook.deleteMany({ where: { userId, hookId } }),
    prisma.marketplaceHook.delete({ where: { id: hookId } })
  ]);

  return true;
}

export async function createPostStyleForUser(userId: string, payload: {
  title: string;
  shortDescription: string;
  longDescription: string;
  visibility: "public" | "private";
  icon?: string;
  tags?: string[];
  structure?: string;
  expectedHooks?: string[];
  outcome?: string;
}) {
  const row = await prisma.marketplacePostStyle.create({
    data: {
      ownerUserId: userId,
      visibility: payload.visibility,
      title: payload.title,
      description: payload.shortDescription,
      tags: payload.tags ?? [],
      template: {
        shortDescription: payload.shortDescription,
        longDescription: payload.longDescription,
        icon: payload.icon ?? null,
        structure: payload.structure ?? "",
        expectedHooks: payload.expectedHooks ?? [],
        outcome: payload.outcome ?? ""
      }
    }
  });

  return mapPostStyle(row, userId);
}

export async function updatePostStyleForUser(userId: string, postStyleId: string, payload: {
  title: string;
  shortDescription: string;
  longDescription: string;
  visibility: "public" | "private";
  icon?: string;
  tags?: string[];
  structure?: string;
  expectedHooks?: string[];
  outcome?: string;
}) {
  const existing = await ensureAccessiblePostStyle(userId, postStyleId);
  if (!existing || existing.ownerUserId !== userId) return null;

  const row = await prisma.marketplacePostStyle.update({
    where: { id: postStyleId },
    data: {
      visibility: payload.visibility,
      title: payload.title,
      description: payload.shortDescription,
      tags: payload.tags ?? [],
      template: {
        shortDescription: payload.shortDescription,
        longDescription: payload.longDescription,
        icon: payload.icon ?? null,
        structure: payload.structure ?? "",
        expectedHooks: payload.expectedHooks ?? [],
        outcome: payload.outcome ?? ""
      }
    }
  });

  return mapPostStyle(row, userId);
}

export async function deletePostStyleForUser(userId: string, postStyleId: string): Promise<boolean> {
  const existing = await ensureAccessiblePostStyle(userId, postStyleId);
  if (!existing || existing.ownerUserId !== userId) return false;

  await prisma.$transaction([
    prisma.userSelectedPostStyle.deleteMany({ where: { userId, styleId: postStyleId } }),
    prisma.marketplacePostStyle.delete({ where: { id: postStyleId } })
  ]);

  return true;
}

export async function getMarketplaceSelections(userId: string) {
  const selectedHooks = await prisma.userSelectedHook.findMany({
    where: { userId },
    orderBy: { ordering: "asc" }
  });

  const selectedStyles = await prisma.userSelectedPostStyle.findMany({
    where: { userId },
    orderBy: { ordering: "asc" }
  });

  const schedule = await prisma.weeklyPostSchedule.findFirst({ where: { userId } });
  const scheduleSelections = normalizeDaySelections(
    schedule?.schedule && typeof schedule.schedule === "object" ? (schedule.schedule as Record<string, unknown>).selectedPostStyleIdsByDay : null
  );

  return {
    selectedHookIds: selectedHooks.map((entry) => entry.hookId),
    selectedPostStyleIds: selectedStyles.map((entry) => entry.styleId),
    selectedPostStyleIdsByDay: scheduleSelections
  };
}

export async function updateMarketplaceSelections(
  userId: string,
  selectedHookIds: string[],
  selectedPostStyleIdsByDay: Record<string, string | null>
) {
  const accessibleHooks = await prisma.marketplaceHook.findMany({ where: { OR: [{ visibility: "public" }, { ownerUserId: userId }] } });
  const accessibleHookIds = new Set(accessibleHooks.map((entry) => entry.id));
  const filteredHookIds = selectedHookIds.filter((hookId) => accessibleHookIds.has(hookId));

  const accessibleStyles = await prisma.marketplacePostStyle.findMany({ where: { OR: [{ visibility: "public" }, { ownerUserId: userId }] } });
  const accessibleStyleIds = new Set(accessibleStyles.map((entry) => entry.id));
  const filteredPostStyleIdsByDay = Object.fromEntries(
    Object.entries(selectedPostStyleIdsByDay).map(([dayKey, styleId]) => [
      dayKey,
      styleId && accessibleStyleIds.has(styleId) ? styleId : null
    ])
  );

  await replaceSelections(userId, filteredHookIds, filteredPostStyleIdsByDay);
  return getMarketplaceSelections(userId);
}

export async function searchHookById(userId: string, hookId: string) {
  return getHookById(userId, hookId);
}

export async function searchPostStyleById(userId: string, postStyleId: string) {
  return getPostStyleById(userId, postStyleId);
}