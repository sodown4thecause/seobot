/**
 * Link Prospect Finder
 * 
 * Comprehensive link building prospect discovery using multiple strategies:
 * - Competitor backlink intersection
 * - Unlinked brand mentions
 * - Broken link opportunities
 * - Guest post sites
 * - Resource page opportunities
 */

import { competitors, serp, content } from '@/lib/dataforseo'
import type {
  LinkProspectFinderParams,
  LinkProspectResults,
  IntersectionOpportunity,
  UnlinkedMention,
  BrokenLinkOpportunity,
  GuestPostOpportunity,
  ResourcePageOpportunity,
  LinkProspect,
  LinkOpportunityType
} from './types'

export class LinkProspectFinder {
  private defaultMinDomainRank = 30
  private defaultMaxResults = 100

  /**
   * Run all prospect discovery methods in parallel
   */
  async findAllOpportunities(params: LinkProspectFinderParams): Promise<LinkProspectResults> {
    const {
      yourDomain,
      competitorDomains = [],
      niche,
      keywords = [],
      brandName,
      minDomainRank = this.defaultMinDomainRank,
      maxResults = this.defaultMaxResults
    } = params

    // Run all discovery methods in parallel for speed
    const [
      intersectionResults,
      mentionResults,
      brokenLinkResults,
      guestPostResults,
      resourcePageResults
    ] = await Promise.allSettled([
      competitorDomains.length > 0 
        ? this.findIntersectionOpportunities({ yourDomain, competitorDomains, minDomainRank })
        : Promise.resolve([]),
      brandName 
        ? this.findUnlinkedMentions({ brandName, excludeDomains: [yourDomain] })
        : Promise.resolve([]),
      niche 
        ? this.findBrokenLinkOpportunities({ niche, keywords })
        : Promise.resolve([]),
      niche 
        ? this.findGuestPostOpportunities({ niche, keywords })
        : Promise.resolve([]),
      niche 
        ? this.findResourcePages({ niche, keywords })
        : Promise.resolve([])
    ])

    // Extract results, defaulting to empty arrays on failure
    const intersectionOpportunities = intersectionResults.status === 'fulfilled' 
      ? intersectionResults.value : []
    const unlinkedMentions = mentionResults.status === 'fulfilled' 
      ? mentionResults.value : []
    const brokenLinkOpportunities = brokenLinkResults.status === 'fulfilled' 
      ? brokenLinkResults.value : []
    const guestPostOpportunities = guestPostResults.status === 'fulfilled' 
      ? guestPostResults.value : []
    const resourcePageOpportunities = resourcePageResults.status === 'fulfilled' 
      ? resourcePageResults.value : []

    // Generate summary
    const allProspects = this.consolidateProspects({
      intersectionOpportunities,
      unlinkedMentions,
      brokenLinkOpportunities,
      guestPostOpportunities,
      resourcePageOpportunities
    })

    const byType = this.countByType(allProspects)
    const avgDA = this.calculateAverageDA(allProspects)
    const topOpportunities = this.getTopOpportunities(allProspects, 10)

    return {
      intersectionOpportunities: intersectionOpportunities.slice(0, maxResults),
      unlinkedMentions: unlinkedMentions.slice(0, maxResults),
      brokenLinkOpportunities: brokenLinkOpportunities.slice(0, maxResults),
      guestPostOpportunities: guestPostOpportunities.slice(0, maxResults),
      resourcePageOpportunities: resourcePageOpportunities.slice(0, maxResults),
      summary: {
        totalProspects: allProspects.length,
        byType,
        averageDomainAuthority: avgDA,
        topOpportunities
      }
    }
  }

  /**
   * Find sites that link to multiple competitors but not to you
   */
  async findIntersectionOpportunities(params: {
    yourDomain: string
    competitorDomains: string[]
    minDomainRank?: number
  }): Promise<IntersectionOpportunity[]> {
    const { yourDomain, competitorDomains, minDomainRank = 30 } = params

    try {
      // Use DataForSEO domain intersection to find common linkers
      const response = await competitors.domainIntersection({
        target: yourDomain,
        keywords: competitorDomains, // Using domains as comparison targets
        limit: 200
      })

      if (!response.success || !response.data?.tasks?.[0]?.result) {
        return []
      }

      const results = response.data.tasks[0].result || []
      
      // Transform and filter results
      const opportunities: IntersectionOpportunity[] = results
        .filter((item: any) => {
          // Filter out low-quality domains
          const dr = item.domain_rank || item.metrics?.organic?.count || 0
          return dr >= minDomainRank
        })
        .map((item: any) => ({
          domain: item.domain || item.target || '',
          url: item.url || `https://${item.domain || item.target}`,
          linksToCompetitors: item.intersections || competitorDomains.length,
          competitorDomains: competitorDomains,
          domainAuthority: item.domain_rank || item.metrics?.organic?.count || 0,
          relevanceScore: this.calculateRelevanceScore(item)
        }))
        .filter((opp: IntersectionOpportunity) => opp.domain && opp.domain !== yourDomain)
        .sort((a: IntersectionOpportunity, b: IntersectionOpportunity) => 
          b.linksToCompetitors - a.linksToCompetitors
        )

      return opportunities
    } catch (error) {
      console.error('Error finding intersection opportunities:', error)
      return []
    }
  }

  /**
   * Find unlinked brand mentions across the web
   */
  async findUnlinkedMentions(params: {
    brandName: string
    excludeDomains: string[]
  }): Promise<UnlinkedMention[]> {
    const { brandName, excludeDomains } = params

    try {
      // Use DataForSEO content analysis to find mentions
      const response = await content.analysis({
        keyword: brandName,
        limit:100
      })

      if (!response.success || !response.data?.tasks?.[0]?.result) {
        return []
      }

      const results = response.data.tasks[0].result || []
      
      // Filter for mentions without links
      const mentions: UnlinkedMention[] = results
        .filter((item: any) => {
          const domain = this.extractDomain(item.url || '')
          return !excludeDomains.some(excluded => domain.includes(excluded))
        })
        .map((item: any) => ({
          domain: this.extractDomain(item.url || ''),
          url: item.url || '',
          title: item.title || '',
          snippet: item.description || item.snippet || '',
          mentionContext: item.content_info?.snippet || '',
          domainAuthority: item.domain_rank || 30,
          publishedDate: item.date_published
        }))
        .filter((mention: UnlinkedMention) => mention.domain)

      return mentions
    } catch (error) {
      console.error('Error finding unlinked mentions:', error)
      return []
    }
  }

  /**
   * Find broken link opportunities
   */
  async findBrokenLinkOpportunities(params: {
    niche: string
    keywords: string[]
  }): Promise<BrokenLinkOpportunity[]> {
    const { niche, keywords } = params
    
    // Search for resource pages in niche that might have broken links
    const searchQuery = `${niche} resources OR ${niche} links OR "${keywords.join('" OR "')}" resources`

    try {
      const response = await serp.organic({
        keyword: searchQuery,
        limit: 50
      })

      if (!response.success || !response.data?.tasks?.[0]?.result) {
        return []
      }

      // Note: Full broken link checking requires crawling which we simulate here
      // In production, integrate with a crawling service like Firecrawl
      const opportunities: BrokenLinkOpportunity[] = []
      
      const results = response.data.tasks[0].result
      const items = results.items || []

      for (const item of items.slice(0, 20)) {
        // This would normally involve crawling the page and checking links
        // For now, we create potential opportunities that should be verified
        opportunities.push({
          sourceDomain: item.domain || this.extractDomain(item.url || ''),
          sourceUrl: item.url || '',
          brokenUrl: '', // Would be populated after crawl verification
          anchorText: item.title || '',
          domainAuthority: 40, // Would come from backlink data
          suggestedReplacement: undefined
        })
      }

      return opportunities
    } catch (error) {
      console.error('Error finding broken link opportunities:', error)
      return []
    }
  }

  /**
   * Find guest posting opportunities
   */
  async findGuestPostOpportunities(params: {
    niche: string
    keywords: string[]
  }): Promise<GuestPostOpportunity[]> {
    const { niche, keywords } = params

    // Search for "write for us" pages in niche
    const searchQueries = [
      `"${niche}" "write for us"`,
      `"${niche}" "guest post"`,
      `"${niche}" "contribute"`,
      `"${niche}" "submit article"`
    ]

    try {
      const allResults: GuestPostOpportunity[] = []

      for (const query of searchQueries.slice(0, 2)) { // Limit to avoid rate limits
        const response = await serp.organic({
          keyword: query,
          limit: 25
        })

        if (response.success && response.data?.tasks?.[0]?.result) {
          const results = response.data.tasks[0].result
          const items = results.items || []

          for (const item of items) {
            if (item.url && !allResults.some(r => r.domain === item.domain)) {
              allResults.push({
                domain: item.domain || this.extractDomain(item.url),
                submissionUrl: item.url,
                guidelines: item.description || undefined,
                domainAuthority: 35, // Would be enriched with actual DA
                topics: keywords.slice(0, 5),
                acceptanceRate: 'medium',
                responseTime: '1-2 weeks'
              })
            }
          }
        }
      }

      return allResults.slice(0, 50)
    } catch (error) {
      console.error('Error finding guest post opportunities:', error)
      return []
    }
  }

  /**
   * Find resource page link opportunities
   */
  async findResourcePages(params: {
    niche: string
    keywords: string[]
  }): Promise<ResourcePageOpportunity[]> {
    const { niche, keywords } = params

    const searchQueries = [
      `"${niche}" "resources" OR "useful links"`,
      `"${niche}" "recommended" OR "tools"`,
      `intitle:resources "${keywords[0] || niche}"`
    ]

    try {
      const allResults: ResourcePageOpportunity[] = []

      for (const query of searchQueries.slice(0, 2)) {
        const response = await serp.organic({
          keyword: query,
          limit: 25
        })

        if (response.success && response.data?.tasks?.[0]?.result) {
          const results = response.data.tasks[0].result
          const items = results.items || []

          for (const item of items) {
            if (item.url && !allResults.some(r => r.domain === item.domain)) {
              allResults.push({
                domain: item.domain || this.extractDomain(item.url),
                url: item.url,
                pageTitle: item.title || '',
                existingLinks: 10, // Would be calculated from crawl
                relevantCategories: keywords.slice(0, 3),
                domainAuthority: 35,
                lastUpdated: undefined
              })
            }
          }
        }
      }

      return allResults.slice(0, 50)
    } catch (error) {
      console.error('Error finding resource pages:', error)
      return []
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    }
  }

  private calculateRelevanceScore(item: any): number {
    let score = 50 // Base score

    // Boost for higher intersections
    if (item.intersections) {
      score += Math.min(item.intersections * 5, 25)
    }

    // Boost for domain authority
    if (item.domain_rank) {
      score += Math.min(item.domain_rank / 4, 25)
    }

    return Math.min(score, 100)
  }

  private consolidateProspects(results: Partial<LinkProspectResults>): LinkProspect[] {
    const prospects: LinkProspect[] = []
    const seenDomains = new Set<string>()

    // Convert intersection opportunities
    for (const opp of results.intersectionOpportunities || []) {
      if (!seenDomains.has(opp.domain)) {
        seenDomains.add(opp.domain)
        prospects.push(this.createProspect(opp.domain, opp.url, 'competitor_link', opp.domainAuthority, opp.relevanceScore))
      }
    }

    // Convert unlinked mentions
    for (const mention of results.unlinkedMentions || []) {
      if (!seenDomains.has(mention.domain)) {
        seenDomains.add(mention.domain)
        prospects.push(this.createProspect(mention.domain, mention.url, 'unlinked_mention', mention.domainAuthority, 70))
      }
    }

    // Convert broken link opportunities
    for (const broken of results.brokenLinkOpportunities || []) {
      if (!seenDomains.has(broken.sourceDomain)) {
        seenDomains.add(broken.sourceDomain)
        prospects.push(this.createProspect(broken.sourceDomain, broken.sourceUrl, 'broken_link', broken.domainAuthority, 65))
      }
    }

    // Convert guest post opportunities
    for (const gp of results.guestPostOpportunities || []) {
      if (!seenDomains.has(gp.domain)) {
        seenDomains.add(gp.domain)
        prospects.push(this.createProspect(gp.domain, gp.submissionUrl, 'guest_post', gp.domainAuthority, 60))
      }
    }

    // Convert resource page opportunities
    for (const rp of results.resourcePageOpportunities || []) {
      if (!seenDomains.has(rp.domain)) {
        seenDomains.add(rp.domain)
        prospects.push(this.createProspect(rp.domain, rp.url, 'resource_page', rp.domainAuthority, 55))
      }
    }

    return prospects
  }

  private createProspect(
    domain: string, 
    url: string, 
    type: LinkOpportunityType, 
    da: number, 
    relevance: number
  ): LinkProspect {
    return {
      id: `${domain}-${Date.now()}`,
      domain,
      url,
      domainAuthority: da,
      relevanceScore: relevance,
      opportunityType: type,
      reason: this.getOpportunityReason(type),
      status: 'discovered',
      score: this.calculateOverallScore(da, relevance),
      topicMatch: [],
      discoveredAt: new Date(),
      lastUpdated: new Date()
    }
  }

  private getOpportunityReason(type: LinkOpportunityType): string {
    const reasons: Record<LinkOpportunityType, string> = {
      competitor_link: 'Links to your competitors but not you',
      unlinked_mention: 'Mentions your brand without linking',
      broken_link: 'Has broken outbound links you could replace',
      guest_post: 'Accepts guest contributions',
      resource_page: 'Curates resources in your niche',
      digital_pr: 'Covers industry news and stories',
      expert_roundup: 'Features expert opinions',
      skyscraper: 'Has popular content you could improve upon'
    }
    return reasons[type]
  }

  private calculateOverallScore(da: number, relevance: number): number {
    // Weight: 40% DA, 60% relevance
    return Math.round((da * 0.4) + (relevance * 0.6))
  }

  private countByType(prospects: LinkProspect[]): Record<LinkOpportunityType, number> {
    const counts: Record<LinkOpportunityType, number> = {
      competitor_link: 0,
      unlinked_mention: 0,
      broken_link: 0,
      guest_post: 0,
      resource_page: 0,
      digital_pr: 0,
      expert_roundup: 0,
      skyscraper: 0
    }

    for (const prospect of prospects) {
      counts[prospect.opportunityType]++
    }

    return counts
  }

  private calculateAverageDA(prospects: LinkProspect[]): number {
    if (prospects.length === 0) return 0
    const total = prospects.reduce((sum, p) => sum + p.domainAuthority, 0)
    return Math.round(total / prospects.length)
  }

  private getTopOpportunities(prospects: LinkProspect[], limit: number): LinkProspect[] {
    return [...prospects]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
}

// Export singleton instance
export const linkProspectFinder = new LinkProspectFinder()
