/**
 * Image Generation Agent
 * Generates relevant images for content using Google Gemini Flash Image
 */

import { experimental_generateImage as generateImage } from 'ai';
import { vercelGateway } from '@/lib/ai/gateway-provider';
import { serverEnv } from '@/lib/config/env';
import type { GatewayModelId } from '@ai-sdk/gateway';

export interface ImageGenerationParams {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16";
}

export class ImageAgent {
  /**
   * Generate an image based on a prompt
   */
  async generate(params: ImageGenerationParams): Promise<string> {
    console.log('[Image Agent] Generating image for:', params.prompt);

    // Check if Google API key is available for image generation
    if (!serverEnv.GOOGLE_API_KEY) {
      console.warn('[Image Agent] Google API key not available, skipping image generation');
      throw new Error('Google API key required for image generation');
    }

    try {
      const { image } = await generateImage({
        model: vercelGateway.imageModel('google/gemini-2.5-flash-image' as GatewayModelId),
        prompt: params.prompt,
        aspectRatio: params.aspectRatio || "16:9",
      });

      console.log('[Image Agent] ✓ Image generated');
      return image.base64; 
    } catch (error) {
      console.error('[Image Agent] Error generating image:', error);
      throw error;
    }
  }
}









