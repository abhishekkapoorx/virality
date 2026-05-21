import { z } from "zod";

/** Mirrors n8n "Parser for Post Type" structured output. */
export const PostTypeSelectionSchema = z.object({
  type: z.string(),
  goal: z.string(),
  description: z.string()
});
export type PostTypeSelection = z.infer<typeof PostTypeSelectionSchema>;

/** Mirrors n8n "Parser for Best Hook" structured output. */
export const HookSelectionSchema = z.object({
  hook_type: z.string(),
  sample_hook: z.string()
});
export type HookSelection = z.infer<typeof HookSelectionSchema>;

/** Mirrors n8n "Structured Output Parser" for Generate Post. */
export const PostDraftOutputSchema = z.object({
  draft: z.string()
});
export type PostDraftOutput = z.infer<typeof PostDraftOutputSchema>;
