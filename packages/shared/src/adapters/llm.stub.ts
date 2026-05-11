import type { LlmAdapter, LlmGenerateInput } from "./llm.js";

/**
 * Deterministic stub LLM. Real providers replace this via the worker DI container.
 * The output is intentionally readable so test assertions can pin the shape.
 */
export class LlmStub implements LlmAdapter {
  async generateDraft(input: LlmGenerateInput): Promise<string> {
    const promptPreview = input.prompt.slice(0, 80).replace(/\s+/g, " ").trim();
    return `STUB_DRAFT[conversation=${input.conversationId}]: ${promptPreview}`;
  }
}
