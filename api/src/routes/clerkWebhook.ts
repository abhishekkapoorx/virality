import { verifyWebhook } from "@clerk/backend/webhooks";
import { Router, type Request, type Response } from "express";

import {
  deleteUserByClerkId,
  ensureUserFromClerk
} from "../services/userService.js";

export const clerkWebhookRouter = Router();

/** Svix signing secret from Clerk Dashboard → Webhooks (whsec_…), not CLERK_SECRET_KEY. */
function getWebhookSigningSecret(): string | null {
  const raw = process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim();
  if (!raw || raw === "whsec_replace_me" || raw.includes("replace_me")) {
    return null;
  }
  return raw;
}

function webhookRequestUrl(req: Request): string {
  const configured = process.env.CLERK_WEBHOOK_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const host =
    req.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    req.get("host") ??
    "localhost";
  const proto =
    req.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.includes("ngrok") ? "https" : "http");
  return `${proto}://${host}${req.originalUrl}`;
}

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserEventData = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

function primaryEmail(data: ClerkUserEventData): string {
  const emails = data.email_addresses ?? [];
  if (data.primary_email_address_id) {
    const primary = emails.find((e) => e.id === data.primary_email_address_id);
    if (primary) return primary.email_address;
  }
  return emails[0]?.email_address ?? `${data.id}@users.clerk.placeholder`;
}

clerkWebhookRouter.post("/", async (req: Request, res: Response) => {
  const signingSecret = getWebhookSigningSecret();
  if (!signingSecret) {
    return res.status(503).json({
      error:
        "CLERK_WEBHOOK_SIGNING_SECRET not configured — copy the whsec_… value from Clerk Dashboard → Webhooks into api/.env (not sk_test_…)"
    });
  }

  try {
    const url = webhookRequestUrl(req);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(key, value);
      else if (Array.isArray(value)) headers.set(key, value.join(","));
    }

    const body =
      req.body instanceof Buffer
        ? req.body
        : Buffer.from(
            typeof req.body === "string" ? req.body : JSON.stringify(req.body)
          );

    const request = new Request(url, {
      method: "POST",
      headers,
      body: body.byteLength ? body : undefined
    });

    const event = await verifyWebhook(request, { signingSecret });
    const type = event.type;
    const data = event.data as ClerkUserEventData;

    if (type === "user.created" || type === "user.updated") {
      await ensureUserFromClerk({
        clerkUserId: data.id,
        email: primaryEmail(data),
        firstName: data.first_name,
        lastName: data.last_name
      });
    } else if (type === "user.deleted") {
      await deleteUserByClerkId(data.id);
    }

    return res.status(200).json({ received: true, type });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const prismaCode =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: string }).code)
        : undefined;

    if (prismaCode === "P2021" || message.includes("does not exist in the current database")) {
      console.error("Clerk webhook handler: database schema missing", err);
      return res.status(503).json({
        error: "Database schema not ready",
        hint: "Run prisma migrate deploy (Docker dev runs this on API startup; restart with pnpm docker:dev)"
      });
    }

    console.error("Clerk webhook failed", { url: webhookRequestUrl(req), message, err });
    const hint = message.includes("Base64Coder")
      ? "Invalid CLERK_WEBHOOK_SIGNING_SECRET — use the whsec_… signing secret from Clerk → Webhooks, not CLERK_SECRET_KEY"
      : undefined;
    return res.status(400).json({
      error: "Webhook verification failed",
      ...(hint ? { hint } : {})
    });
  }
});
