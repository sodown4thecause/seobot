/**
 * AI stock-footage adapter.
 *
 * The blog/case-study surfaces want a short looping video. Rather than couple
 * the UI to one vendor, this module defines a small provider interface plus a
 * zero-dependency fallback so the surfaces render today and a real generative
 * video provider can be dropped in later (e.g. Runway, Luma, Pika, or a hosted
 * stock-footage API) without touching components.
 *
 * Wire a real provider by implementing `StockFootageProvider` and passing it to
 * `resolveStockFootage`, or set `STOCK_FOOTAGE_PROVIDER` env + extend the
 * `getProvider()` switch below.
 */

export type StockFootageRequest = {
  /** Natural-language description of the desired clip */
  prompt: string
  /** Aspect ratio hint, defaults to 16:9 */
  aspectRatio?: '16:9' | '9:16' | '1:1'
  /** Target duration in seconds (best-effort) */
  durationSeconds?: number
}

export type StockFootageResult = {
  /** Playable video URL (mp4/webm) or null when only a poster is available */
  videoUrl: string | null
  /** Poster/thumbnail image URL to show before/instead of playback */
  posterUrl: string
  /** True when this is the built-in fallback (no generative provider ran) */
  isPlaceholder: boolean
  /** Which provider produced the result */
  provider: string
}

export interface StockFootageProvider {
  readonly name: string
  generate(request: StockFootageRequest): Promise<StockFootageResult>
}

/** Brand poster used when no generative provider is configured. */
const FALLBACK_POSTER = '/marketing/flowintent-modes-hero.png'

/**
 * Built-in placeholder provider. Returns the brand poster and no video, so the
 * UI can render a static hero immediately with zero external calls.
 */
export const placeholderProvider: StockFootageProvider = {
  name: 'placeholder',
  async generate(): Promise<StockFootageResult> {
    return {
      videoUrl: null,
      posterUrl: FALLBACK_POSTER,
      isPlaceholder: true,
      provider: 'placeholder',
    }
  },
}

function getProvider(): StockFootageProvider {
  // Extend this switch when a real provider is wired. Keeping the env read here
  // (not in components) preserves the adapter boundary.
  switch (process.env.STOCK_FOOTAGE_PROVIDER) {
    // case 'runway':
    //   return runwayProvider
    // case 'luma':
    //   return lumaProvider
    default:
      return placeholderProvider
  }
}

/**
 * Resolve footage for a request. Falls back to the placeholder poster on any
 * provider error so marketing surfaces never break on a media failure.
 */
export async function resolveStockFootage(
  request: StockFootageRequest,
  provider: StockFootageProvider = getProvider(),
): Promise<StockFootageResult> {
  try {
    return await provider.generate(request)
  } catch {
    return {
      videoUrl: null,
      posterUrl: FALLBACK_POSTER,
      isPlaceholder: true,
      provider: `${provider.name}:error-fallback`,
    }
  }
}
