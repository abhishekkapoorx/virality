/** Replaces n8n "Upload file" (Google Drive). */
export interface StorageUploadInput {
  conversationId: string;
  fileName: string;
  imageUrl: string;
}

export interface StorageUploadResult {
  webViewLink: string;
}

export interface StorageAdapter {
  uploadImage(input: StorageUploadInput): Promise<StorageUploadResult>;
}
