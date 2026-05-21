import { verifyToken } from "@clerk/backend";
import type { NextFunction, Request, Response } from "express";

import { resolveUserId } from "../lib/resolveUserId.js";
import { ensureUserFromClerk } from "../services/userService.js";
import type { AuthedRequest } from "../types/auth.js";

function clerkConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY?.trim());
}

/**
 * When CLERK_SECRET_KEY is unset, falls back to demo/query user id (local dev).
 * When set, requires Authorization: Bearer <Clerk session JWT>.
 */
export async function clerkAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!clerkConfigured()) {
    const internalUserId = resolveUserId(req);
    (req as AuthedRequest).auth = {
      clerkUserId: "dev-bypass",
      internalUserId,
      tenantId: "dev-tenant"
    };
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    });

    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      res.status(401).json({ error: "Invalid token: missing subject" });
      return;
    }

    const email =
      typeof payload.email === "string" && payload.email
        ? payload.email
        : `${clerkUserId}@users.clerk.placeholder`;

    const user = await ensureUserFromClerk({
      clerkUserId,
      email,
      firstName:
        typeof payload.first_name === "string" ? payload.first_name : null,
      lastName:
        typeof payload.last_name === "string" ? payload.last_name : null
    });

    (req as AuthedRequest).auth = {
      clerkUserId,
      internalUserId: user.id,
      tenantId: user.tenantId
    };
    next();
  } catch (err) {
    console.error("Clerk JWT verification failed", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}
