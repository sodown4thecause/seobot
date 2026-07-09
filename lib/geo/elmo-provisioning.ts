import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { businessProfiles } from '@/lib/db/schema'
import { getBusinessProfile, upsertBusinessProfile } from '@/lib/db/queries'
import {
  analyzeElmoBrand,
  createElmoBrand,
  ElmoApiError,
  getElmoBrand,
  type ElmoBrand,
} from '@/lib/geo/elmo-client'
import { brandFromWebsiteUrl, getGeoBusinessProfileForUser } from '@/lib/geo/profile'

const MAX_PROVISIONING_PROMPTS = 10

export interface EnsureElmoBrandResult {
  brand: ElmoBrand
  created: boolean
  brandId: string
}

function deriveElmoBrandId(userId: string, websiteUrl: string): string {
  let host = websiteUrl
  try {
    host = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname
  } catch {
    host = websiteUrl
  }

  const domainSlug = host
    .replace(/^www\./, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40)

  const userSuffix = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase()
  return `fi-${domainSlug || 'brand'}-${userSuffix || 'user'}`
}

function buildDomainsFromAnalysis(analysis: Awaited<ReturnType<typeof analyzeElmoBrand>>): string[] {
  const domains = [analysis.website, ...analysis.additionalDomains]
  const seen = new Set<string>()
  return domains.filter(domain => {
    const normalized = domain.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

export async function inspectElmoBrandForUser(userId: string): Promise<ElmoBrand | null> {
  const profile = await getBusinessProfile(userId)
  if (!profile?.elmoBrandId) return null
  try {
    return await getElmoBrand(profile.elmoBrandId)
  } catch (error) {
    if (error instanceof ElmoApiError && error.status === 404) return null
    throw error
  }
}

export async function ensureElmoBrandForUser(userId: string): Promise<EnsureElmoBrandResult> {
  const profile = await getBusinessProfile(userId)
  if (!profile?.websiteUrl) {
    throw new Error('Business profile with a website URL is required before Elmo tracking can be provisioned.')
  }

  if (profile.elmoBrandId) {
    try {
      const brand = await getElmoBrand(profile.elmoBrandId)
      return {
        brand,
        created: false,
        brandId: profile.elmoBrandId,
      }
    } catch (error) {
      if (error instanceof ElmoApiError && error.status === 404) {
        await clearElmoBrandIdForUser(userId)
      } else {
        throw error
      }
    }
  }

  const geoProfile = await getGeoBusinessProfileForUser(userId)
  const brandName = geoProfile?.brand ?? brandFromWebsiteUrl(profile.websiteUrl)
  const brandId = deriveElmoBrandId(userId, profile.websiteUrl)

  const analysis = await analyzeElmoBrand({
    website: profile.websiteUrl,
    brandName,
    maxCompetitors: 10,
    maxPrompts: MAX_PROVISIONING_PROMPTS,
  })

  const domains = buildDomainsFromAnalysis(analysis)
  const prompts = analysis.suggestedPrompts
    .slice(0, MAX_PROVISIONING_PROMPTS)
    .map(item => ({
      value: item.prompt,
      tags: item.tags,
      enabled: true,
    }))

  let brand: ElmoBrand
  let created = true

  try {
    brand = await createElmoBrand({
      id: brandId,
      name: analysis.brandName || brandName,
      domains,
      aliases: analysis.aliases,
      competitors: analysis.competitors.map(competitor => ({
        name: competitor.name,
        domains: competitor.domains,
        aliases: competitor.aliases,
      })),
      prompts,
    })
  } catch (error) {
    if (error instanceof ElmoApiError && error.status === 409) {
      brand = await getElmoBrand(brandId)
      created = false
    } else {
      throw error
    }
  }

  await upsertBusinessProfile(userId, { elmoBrandId: brand.id })

  return {
    brand,
    created,
    brandId: brand.id,
  }
}

export async function getStoredElmoBrandId(userId: string): Promise<string | null> {
  const profile = await getBusinessProfile(userId)
  return profile?.elmoBrandId ?? null
}

export async function requireElmoBrandForUser(userId: string): Promise<EnsureElmoBrandResult> {
  return ensureElmoBrandForUser(userId)
}

export async function clearElmoBrandIdForUser(userId: string): Promise<void> {
  await db
    .update(businessProfiles)
    .set({ elmoBrandId: null, updatedAt: new Date() })
    .where(eq(businessProfiles.userId, userId))
}
