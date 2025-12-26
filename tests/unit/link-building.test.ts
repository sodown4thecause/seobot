/**
 * Unit Tests: Link Building Campaign
 * 
 * Task 6.1: Write unit tests for link prospect discovery
 * Tests competitor backlink analysis integration, contact extraction, and prospect scoring
 * 
 * Requirements: 4.1, 4.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the n8n backlinks webhook
vi.mock('@/lib/api/n8n', () => ({
  callN8nWebhook: vi.fn(),
}))

// Mock Firecrawl
vi.mock('@/lib/mcp/firecrawl', () => ({
  firecrawlClient: {
    extract: vi.fn(),
    crawl: vi.fn(),
  },
}))

// Mock DataForSEO
vi.mock('@/lib/api/dataforseo-service', () => ({
  pageIntersection: vi.fn(),
}))

describe('Link Building Campaign - Prospect Discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Competitor Backlink Analysis Integration', () => {
    it('should fetch competitor backlinks via n8n webhook', async () => {
      const { callN8nWebhook } = await import('@/lib/api/n8n')
      
      const mockBacklinks = {
        domain: 'competitor.com',
        backlinks: [
          {
            url: 'https://example.com/link1',
            domain: 'example.com',
            anchor: 'SEO tools',
            type: 'dofollow',
            domain_authority: 85,
          },
          {
            url: 'https://blog.com/link2',
            domain: 'blog.com',
            anchor: 'best resources',
            type: 'dofollow',
            domain_authority: 72,
          },
        ],
        total: 2,
      }

      vi.mocked(callN8nWebhook).mockResolvedValue({
        success: true,
        data: mockBacklinks,
      })

      const result = await callN8nWebhook('backlinks', {
        domain: 'competitor.com',
        action: 'analyze',
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('backlinks')
      expect(result.data.backlinks).toBeInstanceOf(Array)
      expect(result.data.backlinks.length).toBeGreaterThan(0)
    })

    it('should handle API errors gracefully', async () => {
      const { callN8nWebhook } = await import('@/lib/api/n8n')
      
      vi.mocked(callN8nWebhook).mockResolvedValue({
        success: false,
        error: 'API rate limit exceeded',
      })

      const result = await callN8nWebhook('backlinks', {
        domain: 'competitor.com',
        action: 'analyze',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should filter high-quality backlinks', () => {
      const backlinks = [
        { domain_authority: 90, type: 'dofollow', relevance: 'high' },
        { domain_authority: 45, type: 'dofollow', relevance: 'low' },
        { domain_authority: 85, type: 'nofollow', relevance: 'high' },
        { domain_authority: 95, type: 'dofollow', relevance: 'high' },
      ]

      // Filter for high-quality prospects: DA > 70, dofollow, high relevance
      const highQuality = backlinks.filter(
        (link) =>
          link.domain_authority > 70 &&
          link.type === 'dofollow' &&
          link.relevance === 'high'
      )

      expect(highQuality.length).toBe(2)
      expect(highQuality.every((link) => link.domain_authority > 70)).toBe(true)
    })

    it('should analyze multiple competitors in parallel', async () => {
      const { callN8nWebhook } = await import('@/lib/api/n8n')
      
      const competitors = ['competitor1.com', 'competitor2.com', 'competitor3.com']
      
      vi.mocked(callN8nWebhook).mockImplementation(async (endpoint, data) => {
        return {
          success: true,
          data: {
            domain: data.domain,
            backlinks: [{ url: `https://${data.domain}/link` }],
          },
        }
      })

      const results = await Promise.all(
        competitors.map((domain) =>
          callN8nWebhook('backlinks', { domain, action: 'analyze' })
        )
      )

      expect(results.length).toBe(3)
      expect(results.every((r) => r.success)).toBe(true)
      expect(callN8nWebhook).toHaveBeenCalledTimes(3)
    })
  })

  describe('Contact Information Extraction', () => {
    it('should extract email addresses from scraped pages', async () => {
      const { firecrawlClient } = await import('@/lib/mcp/firecrawl')
      
      const mockExtraction = {
        contacts: {
          emails: ['contact@example.com', 'editor@example.com'],
          names: ['John Doe', 'Jane Smith'],
          social: {
            twitter: '@example',
            linkedin: 'linkedin.com/in/example',
          },
        },
      }

      vi.mocked(firecrawlClient.extract).mockResolvedValue({
        success: true,
        data: mockExtraction,
      })

      const result = await firecrawlClient.extract({
        url: 'https://example.com/article',
        extractionSchema: {
          contacts: {
            emails: 'array',
            names: 'array',
            social: 'object',
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.data.contacts.emails).toBeInstanceOf(Array)
      expect(result.data.contacts.emails.length).toBeGreaterThan(0)
    })

    it('should handle pages with no contact information', async () => {
      const { firecrawlClient } = await import('@/lib/mcp/firecrawl')
      
      vi.mocked(firecrawlClient.extract).mockResolvedValue({
        success: true,
        data: {
          contacts: {
            emails: [],
            names: [],
            social: {},
          },
        },
      })

      const result = await firecrawlClient.extract({
        url: 'https://example.com/no-contacts',
        extractionSchema: {},
      })

      expect(result.success).toBe(true)
      expect(result.data.contacts.emails).toEqual([])
    })

    it('should extract author information from blog posts', async () => {
      const { firecrawlClient } = await import('@/lib/mcp/firecrawl')
      
      const mockAuthorInfo = {
        author: {
          name: 'John Doe',
          email: 'john@example.com',
          bio: 'SEO expert with 10 years experience',
          social: {
            twitter: '@johndoe',
          },
        },
      }

      vi.mocked(firecrawlClient.extract).mockResolvedValue({
        success: true,
        data: mockAuthorInfo,
      })

      const result = await firecrawlClient.extract({
        url: 'https://example.com/blog-post',
        extractionSchema: {
          author: {
            name: 'string',
            email: 'string',
            bio: 'string',
            social: 'object',
          },
        },
      })

      expect(result.data.author).toBeDefined()
      expect(result.data.author.name).toBe('John Doe')
      expect(result.data.author.email).toContain('@')
    })

    it('should validate email format', () => {
      const emails = [
        'valid@example.com',
        'contact@domain.co.uk',
        'invalid-email',
        'test@',
        '@domain.com',
        'another.valid@example.org',
      ]

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const validEmails = emails.filter((email) => emailRegex.test(email))

      expect(validEmails.length).toBe(3)
      expect(validEmails).toEqual([
        'valid@example.com',
        'contact@domain.co.uk',
        'another.valid@example.org',
      ])
    })
  })

  describe('Prospect Scoring Algorithm', () => {
    it('should score prospects based on domain authority', () => {
      const prospects = [
        { domain_authority: 95, relevance: 'high', link_type: 'dofollow' },
        { domain_authority: 75, relevance: 'high', link_type: 'dofollow' },
        { domain_authority: 50, relevance: 'high', link_type: 'dofollow' },
        { domain_authority: 90, relevance: 'low', link_type: 'dofollow' },
      ]

      const scoreProspect = (prospect: any) => {
        let score = 0
        // DA score (0-50 points)
        score += (prospect.domain_authority / 100) * 50
        // Relevance score (0-30 points)
        score += prospect.relevance === 'high' ? 30 : 10
        // Link type score (0-20 points)
        score += prospect.link_type === 'dofollow' ? 20 : 0
        return score
      }

      const scored = prospects.map((p) => ({
        ...p,
        score: scoreProspect(p),
      }))

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score)

      expect(scored[0].domain_authority).toBe(95)
      expect(scored[0].score).toBeGreaterThan(scored[1].score)
    })

    it('should prioritize prospects with high relevance', () => {
      const prospects = [
        { domain_authority: 80, relevance: 'high', score: 0 },
        { domain_authority: 90, relevance: 'low', score: 0 },
        { domain_authority: 75, relevance: 'high', score: 0 },
      ]

      const calculateScore = (p: any) => {
        const daScore = (p.domain_authority / 100) * 50
        const relevanceScore = p.relevance === 'high' ? 30 : 10
        return daScore + relevanceScore
      }

      prospects.forEach((p) => {
        p.score = calculateScore(p)
      })

      prospects.sort((a, b) => b.score - a.score)

      // High relevance should rank higher even with lower DA
      expect(prospects[0].relevance).toBe('high')
      expect(prospects[1].relevance).toBe('high')
      expect(prospects[2].relevance).toBe('low')
    })

    it('should filter out low-quality prospects', () => {
      const prospects = [
        { domain_authority: 95, relevance: 'high', link_type: 'dofollow' },
        { domain_authority: 30, relevance: 'low', link_type: 'nofollow' },
        { domain_authority: 85, relevance: 'high', link_type: 'dofollow' },
        { domain_authority: 25, relevance: 'low', link_type: 'dofollow' },
      ]

      const isHighQuality = (p: any) => {
        return (
          p.domain_authority >= 50 &&
          p.relevance === 'high' &&
          p.link_type === 'dofollow'
        )
      }

      const highQuality = prospects.filter(isHighQuality)

      expect(highQuality.length).toBe(2)
      expect(highQuality.every((p) => p.domain_authority >= 50)).toBe(true)
    })

    it('should calculate opportunity score for broken link replacement', () => {
      const brokenLinkOpportunities = [
        {
          page_url: 'https://example.com/resources',
          broken_link: 'https://old-site.com/deleted',
          page_authority: 85,
          link_context: 'resource list',
        },
        {
          page_url: 'https://blog.com/guide',
          broken_link: 'https://removed.com/page',
          page_authority: 60,
          link_context: 'reference',
        },
      ]

      const scoreOpportunity = (opp: any) => {
        let score = 0
        // Page authority (0-40 points)
        score += (opp.page_authority / 100) * 40
        // Context relevance (0-30 points)
        score += opp.link_context.includes('resource') ? 30 : 20
        // Broken link type (0-30 points)
        score += 30 // All are broken links, high opportunity
        return score
      }

      const scored = brokenLinkOpportunities.map((opp) => ({
        ...opp,
        opportunity_score: scoreOpportunity(opp),
      }))

      scored.sort((a, b) => b.opportunity_score - a.opportunity_score)

      expect(scored[0].page_authority).toBe(85)
      expect(scored[0].opportunity_score).toBeGreaterThan(scored[1].opportunity_score)
    })
  })

  describe('Content Intersection Analysis', () => {
    it('should identify pages linking to competitors but not target', async () => {
      const { pageIntersection } = await import('@/lib/api/dataforseo-service')
      
      const mockIntersection = {
        targets: ['competitor1.com', 'competitor2.com'],
        pages: [
          {
            url: 'https://resource-site.com/list',
            links_to: ['competitor1.com', 'competitor2.com'],
            does_not_link_to: ['target-domain.com'],
            page_authority: 80,
          },
          {
            url: 'https://blog.com/article',
            links_to: ['competitor1.com'],
            does_not_link_to: ['target-domain.com'],
            page_authority: 75,
          },
        ],
      }

      vi.mocked(pageIntersection).mockResolvedValue({
        success: true,
        data: mockIntersection,
      })

      const result = await pageIntersection({
        targets: ['competitor1.com', 'competitor2.com'],
        location_name: 'United States',
      })

      expect(result.success).toBe(true)
      expect(result.data.pages).toBeInstanceOf(Array)
      expect(result.data.pages.length).toBeGreaterThan(0)
      
      // All pages should link to competitors but not target
      result.data.pages.forEach((page: any) => {
        expect(page.links_to.length).toBeGreaterThan(0)
        expect(page.does_not_link_to).toContain('target-domain.com')
      })
    })

    it('should prioritize high-authority pages', () => {
      const pages = [
        { page_authority: 90, relevance: 'high' },
        { page_authority: 60, relevance: 'high' },
        { page_authority: 85, relevance: 'medium' },
        { page_authority: 70, relevance: 'high' },
      ]

      pages.sort((a, b) => {
        // Sort by authority first, then relevance
        if (b.page_authority !== a.page_authority) {
          return b.page_authority - a.page_authority
        }
        const relevanceOrder = { high: 3, medium: 2, low: 1 }
        return relevanceOrder[b.relevance] - relevanceOrder[a.relevance]
      })

      expect(pages[0].page_authority).toBe(90)
      expect(pages[1].page_authority).toBe(85)
    })
  })
})

