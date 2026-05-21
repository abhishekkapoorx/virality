import type {
  HookSelection,
  PostDraftOutput,
  PostTypeSelection
} from "../schemas/workflowOutputs.js";
import type { WorkflowContextBundle } from "../prompts/workflowContext.js";

export interface LlmGenerateInput {
  prompt: string;
  conversationId: string;
  tenantId?: string;
  userId?: string;
}

export interface LlmWorkflowInput {
  conversationId: string;
  tenantId: string;
  userId: string;
  context: WorkflowContextBundle;
}

export interface LlmGeneratePostInput extends LlmWorkflowInput {
  postType: PostTypeSelection;
  hook: HookSelection;
}

export interface LlmGenerateImagePromptInput extends LlmWorkflowInput {
  postType: PostTypeSelection;
  draft: string;
}

/**
 * LlmAdapter — provider-agnostic interface for the LinkedIn-Agent n8n workflow.
 *
 * Each method maps to one n8n LangChain agent + structured output parser pair.
 * Workflow nodes MUST depend on this interface, not on a vendor SDK.
 */
export interface LlmAdapter {
  /** @deprecated Use generatePost; kept for backward-compatible tests. */
  generateDraft(input: LlmGenerateInput): Promise<string>;

  selectPostType(input: LlmWorkflowInput): Promise<PostTypeSelection>;
  chooseHook(
    input: LlmWorkflowInput & { postType: PostTypeSelection }
  ): Promise<HookSelection>;
  generatePost(input: LlmGeneratePostInput): Promise<PostDraftOutput>;
  generateImagePrompt(input: LlmGenerateImagePromptInput): Promise<string>;
}
