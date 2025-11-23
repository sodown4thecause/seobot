/**
 * Image Generation Agent
 * Generates relevant images for content using Google Gemini Flash Image
 */

import { Buffer } from 'node:buffer';
import { generateImageWithGemini } from '@/lib/ai/image-generation';

export interface ImageGenerationParams {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16";
}

export class ImageAgent {
  /**
   * Generate an image based on a prompt using Gemini via Vercel AI Gateway
   * Falls back to Google API if gateway is not available
   */
  async generate(params: ImageGenerationParams): Promise<string> {
    console.log('[Image Agent] Generating image for:', params.prompt);

    try {
      const geminiImage = await generateImageWithGemini({
        prompt: params.prompt,
        type: 'blog',
        style: 'artistic',
        size: 'large',
      });

      console.log('[Image Agent] ✓ Image generated via Gemini');
      return Buffer.from(geminiImage.data).toString('base64');
    } catch (error) {
      console.error('[Image Agent] Error generating image:', error);
      throw error;
    }
  }
}












