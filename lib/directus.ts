import { createDirectus, rest, staticToken } from '@directus/sdk'
import { serverEnv } from '@/lib/config/env'

type AssetOptions = {
  width?: number
  height?: number
  fit?: string
}

export function normalizeDirectusBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

export function buildDirectusAssetUrl(
  baseUrl: string,
  assetId: string,
  options?: AssetOptions
): string | null {
  if (!assetId) return null

  let url = `${normalizeDirectusBaseUrl(baseUrl)}/assets/${assetId}`

  if (options) {
    const params = new URLSearchParams()
    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.fit) params.append('fit', options.fit)

    if (params.toString()) {
      url += `?${params.toString()}`
    }
  }

  return url
}

const directusUrl = serverEnv.DIRECTUS_URL

if (!directusUrl) {
  throw new Error('DIRECTUS_URL environment variable is required')
}

const BACKEND_URL = normalizeDirectusBaseUrl(directusUrl)
const TOKEN = serverEnv.DIRECTUS_TOKEN

let client = createDirectus(BACKEND_URL)

if (TOKEN) {
  client = client.with(staticToken(TOKEN))
}

client = client.with(
  rest({
    onRequest: (options: RequestInit) => ({
      ...options,
      cache: 'no-store',
    }),
  })
)

export default client

export function getAssetUrl(assetId: string, options?: AssetOptions): string | null {
  return buildDirectusAssetUrl(BACKEND_URL, assetId, options)
}
