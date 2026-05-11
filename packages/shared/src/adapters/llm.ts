/**
 * LlmAdapter — provider-agnostic interface for draft generation.
 *
 * Workflow nodes MUST depend on this interface, not on a vendor SDK.
 * Real implementations (OpenAI, Anthropic, etc.) land in later slices and are
 * injected through the worker DI container.
 */
export interface LlmGenerateInput {
  prompt: string;
  conversationId: string;
  tenantId?: string;
  userId?: string;
}

export interface LlmAdapter {
  generateDraft(input: LlmGenerateInput): Promise<string>;
}
