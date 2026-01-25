const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flowintent.com'
export const SITE_URL = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`
export const SITE_NAME = 'FlowIntent'
export const DEFAULT_OG_IMAGE_PATH = '/logo-new.png'

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}
