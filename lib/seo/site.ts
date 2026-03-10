const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flowintent.com'

function normalizeSiteUrl(siteUrl: string): string {
  const withProtocol = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  return withProtocol.replace(/\/+$/, '')
}

export const SITE_URL = normalizeSiteUrl(rawSiteUrl)
export const SITE_NAME = 'FlowIntent'
export const DEFAULT_OG_IMAGE_PATH = '/logo-new.png'

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}
