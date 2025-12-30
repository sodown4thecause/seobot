/**
 * Image Generation Service
 * TODO: Re-implement with updated image generation API during NextPhase migration
 * 
 * This service is temporarily stubbed out. It will be re-implemented to use:
 * - Updated Gemini Image Generation API
 * - Cloudflare R2 storage integration
 * - Drizzle ORM for image metadata persistence
 */

export interface ImageGenerationParams {
  prompt: string
  previousPrompt?: string
  editInstructions?: string
  size?: string
  aspectRatio?: string
  seed?: number
  n?: number
  abortTimeoutMs?: number
}

export interface ImageGenerationResponse {
  images: Array<{
    base64: string
    dataUrl: string
    mediaType: string
  }>
  prompt: string
  warnings?: string[]
}

/**
 * Generate images using Gemini API via gateway
 * @deprecated This function is temporarily disabled during NextPhase migration
 * @throws Error - Always throws as image generation is not yet implemented
 */
export async function generateImageWithGatewayGemini(
  params: ImageGenerationParams
): Promise<ImageGenerationResponse> {
  throw new Error(
    'Image generation is temporarily disabled during NextPhase migration. ' +
    'This service will be re-implemented with Drizzle ORM integration. ' +
    'Please use text-based content generation instead.'
  )
}

/**
 * Generate alt text for images
 * @deprecated This function is temporarily disabled during NextPhase migration
 */
export async function generateImageAltText(prompt: string): Promise<string> {
  throw new Error('Image alt text generation is temporarily disabled')
}

/**
 * Analyze image content
 * @deprecated This function is temporarily disabled during NextPhase migration
 */
export async function analyzeImageContent(imageUrl: string): Promise<Record<string, any>> {
  throw new Error('Image content analysis is temporarily disabled')
}
