import { Router } from "express";
import { z } from "zod";

import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const generatedPostSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  conversationId: z.string().min(1),
  type: z.string().min(1),
  hook: z.string().min(1),
  draft: z.string().min(1),
  msgTs: z.string().optional().default(""),
  imgLink: z.string().optional().default(""),
  payload: z.record(z.string(), z.unknown()).optional()
});

export const internalGeneratedPostsRouter = Router();

internalGeneratedPostsRouter.post("/generated-posts", async (req, res) => {
  const parsed = generatedPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  try {
    const row = await prisma.generatedPost.create({
      data: {
        tenantId: parsed.data.tenantId,
        userId: parsed.data.userId,
        conversationId: parsed.data.conversationId,
        type: parsed.data.type,
        hook: parsed.data.hook,
        draft: parsed.data.draft,
        messageTs: parsed.data.msgTs || null,
        imageUrl: parsed.data.imgLink || null,
        payload: parsed.data.payload as Prisma.InputJsonValue
      }
    });

    return res.status(201).json({
      id: row.id,
      createdAt: row.createdAt.toISOString()
    });
  } catch (error) {
    console.error("POST internal generated posts failed", error);
    return res.status(500).json({ error: "Failed to persist generated post" });
  }
});