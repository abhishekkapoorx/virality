/** Replaces n8n "Insert row" (data table). */
export interface DraftStoreInsertInput {
  conversationId: string;
  type: string;
  hook: string;
  draft: string;
  msgTs: string;
  imgLink: string;
}

export interface DraftStoreAdapter {
  insertRow(input: DraftStoreInsertInput): Promise<void>;
}
