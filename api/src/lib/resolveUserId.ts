import { DEMO_USER_ID } from "@linkedin-agent/shared";
import type { Request } from "express";

/**
 * Resolves the active user id for pre-auth routes.
 * Clerk JWT middleware will replace this with req.auth.userId later.
 */
export function resolveUserId(req: Request): string {
  const fromQuery = req.query.userId;
  if (typeof fromQuery === "string" && fromQuery.trim()) {
    return fromQuery.trim();
  }

  const body = req.body as { userId?: string } | undefined;
  if (body?.userId?.trim()) {
    return body.userId.trim();
  }

  return process.env.DEMO_USER_ID?.trim() || DEMO_USER_ID;
}
