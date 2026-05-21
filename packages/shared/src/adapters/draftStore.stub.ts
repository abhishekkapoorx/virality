import type { DraftStoreAdapter, DraftStoreInsertInput } from "./draftStore.js";

export class DraftStoreStub implements DraftStoreAdapter {
  readonly rows: DraftStoreInsertInput[] = [];

  async insertRow(input: DraftStoreInsertInput): Promise<void> {
    this.rows.push({ ...input });
  }
}
