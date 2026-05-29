import { prisma } from "../lib/prisma.js";
import { getOrCreateWorkflowContext } from "./workflowContextService.js";

type ClerkUserPayload = {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

function displayName(payload: ClerkUserPayload): string {
  const parts = [payload.firstName, payload.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return payload.email.split("@")[0] ?? "Workspace";
}

export async function findUserByClerkId(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId } });
}

export async function ensureUserFromClerk(payload: ClerkUserPayload) {
  const existing = await findUserByClerkId(payload.clerkUserId);
  if (existing) {
    if (existing.email !== payload.email) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { email: payload.email }
      });
    }
    return existing;
  }

  const tenant = await prisma.tenant.create({
    data: { name: `${displayName(payload)} workspace` }
  });

  const user = await prisma.user.create({
    data: {
      clerkUserId: payload.clerkUserId,
      email: payload.email,
      tenantId: tenant.id
    }
  });

  await getOrCreateWorkflowContext(user.id);
  return user;
}

export async function deleteUserByClerkId(clerkUserId: string) {
  const user = await findUserByClerkId(clerkUserId);
  if (!user) return;
  await prisma.user.delete({ where: { id: user.id } });
}
