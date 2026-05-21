import type { WorkflowContextBundle } from "../prompts/workflowContext.js";
import type { ConfigSourceAdapter, ConfigSourceInput } from "./configSource.js";

/**
 * Loads per-user prompt context from the API (Postgres-backed).
 * Used by the worker graph instead of Google Docs or ConfigSourceStub.
 */
export class HttpConfigSourceAdapter implements ConfigSourceAdapter {
  constructor(private readonly apiBaseUrl: string) {}

  async loadContext(input: ConfigSourceInput): Promise<WorkflowContextBundle> {
    const params = new URLSearchParams({ userId: input.userId });
    if (input.userFeedback) {
      params.set("userFeedback", input.userFeedback);
    }

    const url = `${this.apiBaseUrl.replace(/\/$/, "")}/internal/v1/workflow-context?${params}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `HttpConfigSourceAdapter: ${res.status} loading workflow context — ${text}`
      );
    }

    return (await res.json()) as WorkflowContextBundle;
  }
}
