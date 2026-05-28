import type { DraftStoreAdapter, DraftStoreInsertInput } from "./draftStore.js";

export class HttpDraftStoreAdapter implements DraftStoreAdapter {
  constructor(private readonly apiBaseUrl: string) {}

  async insertRow(input: DraftStoreInsertInput): Promise<void> {
    const url = `${this.apiBaseUrl.replace(/\/$/, "")}/internal/v1/generated-posts`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HttpDraftStoreAdapter: ${res.status} persisting generated post — ${text}`);
    }
  }
}