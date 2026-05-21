import type { StorageAdapter, StorageUploadInput, StorageUploadResult } from "./storage.js";

export class StorageStub implements StorageAdapter {
  async uploadImage(input: StorageUploadInput): Promise<StorageUploadResult> {
    return {
      webViewLink: `https://stub.drive.local/${input.conversationId}/${input.fileName}`
    };
  }
}
