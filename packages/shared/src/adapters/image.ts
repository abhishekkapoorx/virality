/** Replaces n8n "Generate an image" (OpenAI DALL-E). */
export interface ImageGenerateInput {
  prompt: string;
  conversationId: string;
}

export interface ImageGenerateResult {
  /** Binary or URL depending on implementation; stub uses a fake URL. */
  imageUrl: string;
  mimeType: string;
}

export interface ImageAdapter {
  generate(input: ImageGenerateInput): Promise<ImageGenerateResult>;
}
