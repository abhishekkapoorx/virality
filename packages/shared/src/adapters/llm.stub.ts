import {
  HookSelectionSchema,
  PostDraftOutputSchema,
  PostTypeSelectionSchema
} from "../schemas/workflowOutputs.js";
import type {
  LlmAdapter,
  LlmGenerateImagePromptInput,
  LlmGenerateInput,
  LlmGeneratePostInput,
  LlmWorkflowInput
} from "./llm.js";
import type { HookSelection, PostDraftOutput, PostTypeSelection } from "../schemas/workflowOutputs.js";

export class LlmStub implements LlmAdapter {
  async generateDraft(input: LlmGenerateInput): Promise<string> {
    const promptPreview = input.prompt.slice(0, 80).replace(/\s+/g, " ").trim();
    return `STUB_DRAFT[conversation=${input.conversationId}]: ${promptPreview}`;
  }

  async selectPostType(input: LlmWorkflowInput): Promise<PostTypeSelection> {
    return PostTypeSelectionSchema.parse({
      type: "Belief Reversal",
      goal: "reach and comments",
      description: `Stub post type for ${input.context.todayDay} (${input.conversationId})`
    });
  }

  async chooseHook(
    input: LlmWorkflowInput & { postType: PostTypeSelection }
  ): Promise<HookSelection> {
    return HookSelectionSchema.parse({
      hook_type: "Curiosity Gap",
      sample_hook: `What if ${input.postType.type} could change how you post on LinkedIn?`
    });
  }

  async generatePost(input: LlmGeneratePostInput): Promise<PostDraftOutput> {
    return PostDraftOutputSchema.parse({
      draft: [
        `STUB_POST[${input.conversationId}]`,
        `Hook (${input.hook.hook_type}): ${input.hook.sample_hook}`,
        `Type: ${input.postType.type}`,
        `Feedback: ${input.context.userFeedback}`
      ].join("\n\n")
    });
  }

  async generateImagePrompt(input: LlmGenerateImagePromptInput): Promise<string> {
    return [
      "A professional minimalist LinkedIn post graphic in 4:3 aspect ratio.",
      `Concept for ${input.postType.type} on black background with neon blue (#00D9FF) accents.`,
      `Inspired by draft excerpt: ${input.draft.slice(0, 120)}...`
    ].join(" ");
  }
}
