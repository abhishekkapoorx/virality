import { Router } from "express";
import { z } from "zod";

import { getAuth } from "../types/auth.js";
import {
  createHookForUser,
  createPostStyleForUser,
  deleteHookForUser,
  deletePostStyleForUser,
  getHookById,
  getMarketplaceSelections,
  getPostStyleById,
  listHooksForUser,
  listPostStylesForUser,
  updateHookForUser,
  updateMarketplaceSelections,
  updatePostStyleForUser
} from "../services/marketplaceService.js";

const marketplaceItemSchema = z.object({
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
  visibility: z.enum(["public", "private"]),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  whenToUse: z.string().optional(),
  psychologicalEffect: z.string().optional(),
  structure: z.string().optional(),
  expectedHooks: z.array(z.string()).optional(),
  outcome: z.string().optional()
});

const weekdaySelectionSchema = z
  .object({
    monday: z.string().nullable().optional().default(null),
    tuesday: z.string().nullable().optional().default(null),
    wednesday: z.string().nullable().optional().default(null),
    thursday: z.string().nullable().optional().default(null),
    friday: z.string().nullable().optional().default(null),
    saturday: z.string().nullable().optional().default(null),
    sunday: z.string().nullable().optional().default(null)
  })
  .strict();

const timeSelectionSchema = z
  .object({
    monday: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional().default(null),
    tuesday: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional().default(null),
    wednesday: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional().default(null),
    thursday: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional().default(null),
    friday: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional().default(null),
    saturday: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional().default(null),
    sunday: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional().default(null)
  })
  .strict();

const selectionSchema = z.object({
  selectedHookIds: z.array(z.string()),
  selectedPostStyleIdsByDay: weekdaySelectionSchema,
  selectedPostStyleSendTimesByDay: timeSelectionSchema
});

export const meMarketplaceRouter = Router();

meMarketplaceRouter.get("/marketplace/hooks", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    return res.json(await listHooksForUser(userId, search));
  } catch (error) {
    console.error("GET marketplace hooks failed", error);
    return res.status(500).json({ error: "Failed to load hooks" });
  }
});

meMarketplaceRouter.get("/marketplace/post-styles", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    return res.json(await listPostStylesForUser(userId, search));
  } catch (error) {
    console.error("GET marketplace post styles failed", error);
    return res.status(500).json({ error: "Failed to load post styles" });
  }
});

meMarketplaceRouter.get("/marketplace/hooks/:id", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const item = await getHookById(userId, req.params.id);
    if (!item) return res.status(404).json({ error: "Hook not found" });
    return res.json(item);
  } catch (error) {
    console.error("GET marketplace hook failed", error);
    return res.status(500).json({ error: "Failed to load hook" });
  }
});

meMarketplaceRouter.get("/marketplace/post-styles/:id", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const item = await getPostStyleById(userId, req.params.id);
    if (!item) return res.status(404).json({ error: "Post style not found" });
    return res.json(item);
  } catch (error) {
    console.error("GET marketplace post style failed", error);
    return res.status(500).json({ error: "Failed to load post style" });
  }
});

meMarketplaceRouter.post("/marketplace/hooks", async (req, res) => {
  const parsed = marketplaceItemSchema
    .pick({ title: true, shortDescription: true, longDescription: true, visibility: true, icon: true, tags: true, examples: true, whenToUse: true, psychologicalEffect: true })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  try {
    const userId = getAuth(req).internalUserId;
    return res.status(201).json(await createHookForUser(userId, parsed.data));
  } catch (error) {
    console.error("POST marketplace hook failed", error);
    return res.status(500).json({ error: "Failed to create hook" });
  }
});

meMarketplaceRouter.post("/marketplace/post-styles", async (req, res) => {
  const parsed = marketplaceItemSchema
    .pick({ title: true, shortDescription: true, longDescription: true, visibility: true, icon: true, tags: true, structure: true, expectedHooks: true, outcome: true })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  try {
    const userId = getAuth(req).internalUserId;
    return res.status(201).json(await createPostStyleForUser(userId, parsed.data));
  } catch (error) {
    console.error("POST marketplace post style failed", error);
    return res.status(500).json({ error: "Failed to create post style" });
  }
});

meMarketplaceRouter.put("/marketplace/hooks/:id", async (req, res) => {
  const parsed = marketplaceItemSchema
    .pick({ title: true, shortDescription: true, longDescription: true, visibility: true, icon: true, tags: true, examples: true, whenToUse: true, psychologicalEffect: true })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  try {
    const userId = getAuth(req).internalUserId;
    const item = await updateHookForUser(userId, req.params.id, parsed.data);
    if (!item) return res.status(404).json({ error: "Hook not found" });
    return res.json(item);
  } catch (error) {
    console.error("PUT marketplace hook failed", error);
    return res.status(500).json({ error: "Failed to update hook" });
  }
});

meMarketplaceRouter.put("/marketplace/post-styles/:id", async (req, res) => {
  const parsed = marketplaceItemSchema
    .pick({ title: true, shortDescription: true, longDescription: true, visibility: true, icon: true, tags: true, structure: true, expectedHooks: true, outcome: true })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  try {
    const userId = getAuth(req).internalUserId;
    const item = await updatePostStyleForUser(userId, req.params.id, parsed.data);
    if (!item) return res.status(404).json({ error: "Post style not found" });
    return res.json(item);
  } catch (error) {
    console.error("PUT marketplace post style failed", error);
    return res.status(500).json({ error: "Failed to update post style" });
  }
});

meMarketplaceRouter.delete("/marketplace/hooks/:id", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const deleted = await deleteHookForUser(userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Hook not found" });
    return res.status(204).send();
  } catch (error) {
    console.error("DELETE marketplace hook failed", error);
    return res.status(500).json({ error: "Failed to delete hook" });
  }
});

meMarketplaceRouter.delete("/marketplace/post-styles/:id", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    const deleted = await deletePostStyleForUser(userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Post style not found" });
    return res.status(204).send();
  } catch (error) {
    console.error("DELETE marketplace post style failed", error);
    return res.status(500).json({ error: "Failed to delete post style" });
  }
});

meMarketplaceRouter.get("/marketplace/selections", async (req, res) => {
  try {
    const userId = getAuth(req).internalUserId;
    return res.json(await getMarketplaceSelections(userId));
  } catch (error) {
    console.error("GET marketplace selections failed", error);
    return res.status(500).json({ error: "Failed to load marketplace selections" });
  }
});

meMarketplaceRouter.put("/marketplace/selections", async (req, res) => {
  const parsed = selectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  try {
    const userId = getAuth(req).internalUserId;
    return res.json(
      await updateMarketplaceSelections(
        userId,
        parsed.data.selectedHookIds,
        parsed.data.selectedPostStyleIdsByDay,
        parsed.data.selectedPostStyleSendTimesByDay
      )
    );
  } catch (error) {
    console.error("PUT marketplace selections failed", error);
    return res.status(500).json({
      error: "Failed to save marketplace selections",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});