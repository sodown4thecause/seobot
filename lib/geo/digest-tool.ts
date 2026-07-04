import { tool } from 'ai'
import { z } from 'zod'
import { resolveLatestGeoDigest, resolveGeoDigestTrends } from '@/lib/geo/digest-service'

export function getGEODigestTools() {
  return {
    geo_daily_digest: tool({
      description: 'Fetch the latest nightly GEO/AEO digest synced from geomode (mentions, citations, SERP movers, AI suggestions).',
      inputSchema: z.object({
        days: z.number().int().min(1).max(30).optional().describe('When set, return trend summaries for the past N days instead of only the latest digest'),
      }),
      execute: async ({ days }) => {
        if (days && days > 1) {
          const trends = await resolveGeoDigestTrends(days)
          return {
            mode: 'trends',
            days,
            count: trends.length,
            digests: trends.map(item => ({
              digestDate: item.digestDate,
              brand: item.brand,
              degradedSections: item.degradedSections,
              topActions: item.suggestions?.actions?.slice(0, 3) ?? [],
              rankMovers: item.digest.serp.rankMovers.slice(0, 5),
              engineHighlights: item.digest.geomode.engines,
            })),
          }
        }

        const latest = await resolveLatestGeoDigest()
        if (!latest) {
          return {
            mode: 'latest',
            available: false,
            message: 'No geomode digest has synced yet. The companion nightly pipeline may still be pending.',
          }
        }

        return {
          mode: 'latest',
          available: true,
          source: latest.source,
          digestDate: latest.digestDate,
          brand: latest.brand,
          degradedSections: latest.degradedSections,
          digest: latest.digest,
          suggestions: latest.suggestions,
        }
      },
    }),
  }
}
