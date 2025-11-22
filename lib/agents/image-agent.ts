/**
 * Image Generation Agent
 * Generates relevant images for content using Google Gemini Flash Image
 */

import { experimental_generateImage as generateImage } from 'ai';
import { vercelGateway } from '@/lib/ai/gateway-provider';
import type { GatewayModelId } from '@ai-sdk/gateway';

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
      const { image } = await generateImage({
        model: vercelGateway.imageModel('google/gemini-2.5-flash-image' as GatewayModelId),
        prompt: params.prompt,
        aspectRatio: params.aspectRatio || "16:9",
      });

      console.log('[Image Agent] ✓ Image generated via Gemini');
      return image.base64; 
    } catch (error) {
      console.error('[Image Agent] Error generating image:', error);
      throw error;
    }
  }
}










