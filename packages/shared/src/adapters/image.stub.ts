import type { ImageAdapter, ImageGenerateInput, ImageGenerateResult } from "./image.js";

export class ImageStub implements ImageAdapter {
  async generate(input: ImageGenerateInput): Promise<ImageGenerateResult> {
    return {
      imageUrl: `https://stub.local/linkedin-post/${input.conversationId}.png`,
      mimeType: "image/png"
    };
  }
}
