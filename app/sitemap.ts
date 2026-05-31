import type { MetadataRoute } from 'next'
import { getIndexableRoutes } from '@/lib/seo/indexable-routes'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getIndexableRoutes()
}
