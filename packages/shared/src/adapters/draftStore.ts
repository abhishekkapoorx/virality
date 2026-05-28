/** Replaces n8n "Insert row" (data table). */
export interface DraftStoreInsertInput {
  tenantId: string;
  userId: string;
  conversationId: string;
  type: string;
  hook: string;
  draft: string;
  msgTs: string;
  imgLink: string;
  payload?: Record<string, unknown>;
}

export interface DraftStoreAdapter {
  insertRow(input: DraftStoreInsertInput): Promise<void>;
}
