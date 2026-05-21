import type { Request } from "express";

export type AuthContext = {
  clerkUserId: string;
  internalUserId: string;
  tenantId: string;
};

export type AuthedRequest = Request & {
  auth: AuthContext;
};

export function getAuth(req: Request): AuthContext {
  const auth = (req as AuthedRequest).auth;
  if (!auth) {
    throw new Error("Missing auth on request — clerkAuthMiddleware required");
  }
  return auth;
}
