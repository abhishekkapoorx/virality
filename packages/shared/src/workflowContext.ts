import { z } from "zod";

/**
 * Per-user prompt context stored in Postgres (replaces n8n Google Docs).
 *
 * Field names match the LangGraph / n8n "Concated Context" bundle.
 */
export const UserWorkflowContextSchema = z.object({
  userId: z.string().min(1),
  configText: z.string(),
  styleText: z.string(),
  scheduleText: z.string(),
  hookSystemText: z.string(),
  carouselDesignLanguage: z.string(),
  cronExpression: z.string().min(1),
  updatedAt: z.string()
});

export type UserWorkflowContext = z.infer<typeof UserWorkflowContextSchema>;

export const UserWorkflowContextUpsertSchema = UserWorkflowContextSchema.omit({
  updatedAt: true
});

export type UserWorkflowContextUpsert = z.infer<typeof UserWorkflowContextUpsertSchema>;
