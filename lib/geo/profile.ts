import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businessProfiles, competitors, userCompetitors } from '@/lib/db/schema'

export interface GeoBusinessProfile {
  userId: string
  brand: string
  websiteUrl: string
  industry?: string | null
  competitors: string[]
}

export function brandFromWebsiteUrl(websiteUrl: string): string {
  try {
    const hostname = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
      .hostname
      .replace(/^www\./, '')
    const firstLabel = hostname.split('.')[0] || hostname
    return firstLabel
      .split(/[-_]/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || hostname
  } catch {
    return websiteUrl
  }
}

export async function getGeoBusinessProfileForUser(userId: string): Promise<GeoBusinessProfile | null> {
  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1)

  if (!profile?.websiteUrl) return null

  return {
    userId,
    brand: brandFromWebsiteUrl(profile.websiteUrl),
    websiteUrl: profile.websiteUrl,
    industry: profile.industry,
    competitors: await getCompetitorsForUser(userId),
  }
}

export async function listGeoBusinessProfiles(limit = 50): Promise<GeoBusinessProfile[]> {
  const profiles = await db.select().from(businessProfiles).limit(limit)
  const profilesByUrl = profiles.filter(p => p.websiteUrl)
  if (profilesByUrl.length === 0) return []

  const userIds = profilesByUrl.map(p => p.userId)
  const competitorMap = await batchGetCompetitorsForUsers(userIds)

  return profilesByUrl.map(profile => ({
    userId: profile.userId,
    brand: brandFromWebsiteUrl(profile.websiteUrl),
    websiteUrl: profile.websiteUrl,
    industry: profile.industry,
    competitors: competitorMap.get(profile.userId) ?? [],
  }))
}

async function getCompetitorsForUser(userId: string): Promise<string[]> {
  const mappings = await db
    .select({ competitorId: userCompetitors.competitorId })
    .from(userCompetitors)
    .where(eq(userCompetitors.userId, userId))

  const ids = mappings.map(mapping => mapping.competitorId)
  if (ids.length === 0) return []

  const rows = await db
    .select({ domain: competitors.domain })
    .from(competitors)
    .where(inArray(competitors.id, ids))

  return rows.map(row => row.domain).filter(Boolean)
}

async function batchGetCompetitorsForUsers(userIds: string[]): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map()

  const mappings = await db
    .select({ userId: userCompetitors.userId, competitorId: userCompetitors.competitorId })
    .from(competitors)
    .innerJoin(userCompetitors, eq(userCompetitors.competitorId, competitors.id))
    .where(inArray(userCompetitors.userId, userIds))

  const competitorIds = [...new Set(mappings.map(m => m.competitorId))]
  const competitorDomains = competitorIds.length > 0
    ? await db
        .select({ id: competitors.id, domain: competitors.domain })
        .from(competitors)
        .where(inArray(competitors.id, competitorIds))
    : []

  const domainById = new Map(competitorDomains.map(c => [c.id, c.domain]))

  const result = new Map<string, string[]>()
  for (const id of userIds) {
    result.set(id, [])
  }
  for (const mapping of mappings) {
    const domain = domainById.get(mapping.competitorId)
    if (domain) {
      result.get(mapping.userId)?.push(domain)
    }
  }

  return result
}
