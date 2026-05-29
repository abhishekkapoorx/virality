import { ChatGroq } from "@langchain/groq";
import type {
  LlmAdapter,
  LlmGenerateImagePromptInput,
  LlmGenerateInput,
  LlmGeneratePostInput,
  LlmWorkflowInput
} from "./llm.js";
import type {
  HookSelection,
  PostDraftOutput,
  PostTypeSelection
} from "../schemas/workflowOutputs.js";
import {
  HookSelectionSchema,
  PostDraftOutputSchema,
  PostTypeSelectionSchema
} from "../schemas/workflowOutputs.js";
import { buildSelectPostTypePrompt } from "../prompts/selectPostType.js";
import { buildChooseHookPrompt } from "../prompts/chooseHook.js";
import { buildGeneratePostPrompt } from "../prompts/generatePost.js";
import { buildGenerateImagePromptInstruction } from "../prompts/generateImagePrompt.js";

function responseContentToText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function parsePostDraftOutput(rawContent: unknown): PostDraftOutput {
  const text = responseContentToText(rawContent);
  if (!text) {
    throw new Error("Groq generatePost returned an empty response");
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return PostDraftOutputSchema.parse(JSON.parse(jsonMatch[0]));
    } catch {
      // Fall through to the plain-text draft fallback below.
    }
  }

  return PostDraftOutputSchema.parse({ draft: text });
}

export class GroqLlmAdapter implements LlmAdapter {
  private _llm: ChatGroq | null = null;
  private readonly options?: { apiKey?: string; modelName?: string; temperature?: number };

  constructor(options?: { apiKey?: string; modelName?: string; temperature?: number }) {
    this.options = options;
  }

  private getLlm(): ChatGroq {
    if (!this._llm) {
      const apiKey = this.options?.apiKey || process.env.GROQ_API_KEY?.trim();
      if (!apiKey) {
        throw new Error("GROQ_API_KEY is required for GroqLlmAdapter");
      }
      const modelName = this.options?.modelName || process.env.GROQ_MODEL?.trim() || "llama-3.1-70b-versatile";
      this._llm = new ChatGroq({
        apiKey,
        model: modelName,
        temperature: this.options?.temperature ?? 0.2
      });
    }
    return this._llm;
  }

  async generateDraft(input: LlmGenerateInput): Promise<string> {
    const response = await this.getLlm().invoke(input.prompt);
    return typeof response.content === "string" ? response.content : "";
  }

  async selectPostType(input: LlmWorkflowInput): Promise<PostTypeSelection> {
    const prompt = buildSelectPostTypePrompt(input.context);
    const llmWithStructured = this.getLlm().withStructuredOutput(PostTypeSelectionSchema.strict());
    const result = await llmWithStructured.invoke([
      {
        role: "system",
        content: "You select a LinkedIn post type from the weekly schedule based on user feedback. Return a JSON object with exactly these keys: 'type', 'goal', 'description'. Do not include any other fields."
      },
      {
        role: "user",
        content: prompt
      }
    ]);
    return result as PostTypeSelection;
  }

  async chooseHook(
    input: LlmWorkflowInput & { postType: PostTypeSelection }
  ): Promise<HookSelection> {
    const prompt = buildChooseHookPrompt(input.context, input.postType);
    const llmWithStructured = this.getLlm().withStructuredOutput(HookSelectionSchema.strict());
    const result = await llmWithStructured.invoke([
      {
        role: "system",
        content: "You select the best hook type and provide a sample hook. Return a JSON object with exactly these keys: 'hook_type', 'sample_hook'. Do not include any other fields."
      },
      {
        role: "user",
        content: prompt
      }
    ]);
    return result as HookSelection;
  }

  async generatePost(input: LlmGeneratePostInput): Promise<PostDraftOutput> {
    const prompt = buildGeneratePostPrompt(input.context, input.postType, input.hook);
    const result = await this.getLlm().invoke([
      {
        role: "system",
        content:
          "You generate a high-converting LinkedIn post following strict style guide rules. Return either a JSON object with exactly one key: 'draft', or plain text containing the draft. Do not call tools. Do not include commentary."
      },
      {
        role: "user",
        content: prompt
      }
    ]);
    return parsePostDraftOutput(result.content);
  }

  async generateImagePrompt(input: LlmGenerateImagePromptInput): Promise<string> {
    const prompt = buildGenerateImagePromptInstruction(input.context, input.postType, input.draft);
    const response = await this.getLlm().invoke([
      {
        role: "system",
        content: "You create a detailed prompt for generating an image. Return ONLY the prompt text, no JSON or commentary."
      },
      {
        role: "user",
        content: prompt
      }
    ]);
    return typeof response.content === "string" ? response.content.trim() : "";
  }
}
