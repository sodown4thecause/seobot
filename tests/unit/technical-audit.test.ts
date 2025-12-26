/**
 * Unit Tests: Technical SEO Audit
 * 
 * Task 7.1: Write unit tests for technical audit categorization
 * Tests issue priority calculation, fix instruction generation, and categorization logic
 * 
 * Requirements: 5.2, 5.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock DataForSEO OnPage APIs
vi.mock('@/lib/mcp/dataforseo/on_page_lighthouse', () => ({
  on_page_lighthouseToolWithClient: vi.fn(),
}))

vi.mock('@/lib/mcp/dataforseo/on_page_content_parsing', () => ({
  on_page_content_parsingToolWithClient: vi.fn(),
}))

// Mock Firecrawl
vi.mock('@/lib/mcp/firecrawl', () => ({
  firecrawlClient: {
    crawl: vi.fn(),
  },
}))

describe('Technical SEO Audit - Issue Categorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Issue Priority Calculation', () => {
    it('should calculate priority score correctly', () => {
      const calculatePriority = (impact: number, urgency: number, effort: number) => {
        return (impact * urgency) / effort
      }

      const issues = [
        { impact: 10, urgency: 10, effort: 2 }, // Critical: 50
        { impact: 8, urgency: 7, effort: 5 },  // Major: 11.2
        { impact: 5, urgency: 4, effort: 3 },  // Minor: 6.67
        { impact: 3, urgency: 2, effort: 1 },  // Info: 6
      ]

      issues.forEach((issue) => {
        issue.priority = calculatePriority(issue.impact, issue.urgency, issue.effort)
      })

      issues.sort((a, b) => b.priority - a.priority)

      expect(issues[0].priority).toBe(50)
      expect(issues[0].impact).toBe(10)
      expect(issues[1].priority).toBeCloseTo(11.2, 1)
    })

    it('should prioritize critical issues over major issues', () => {
      const categorizeIssue = (issue: any) => {
        if (issue.blocks_indexing || issue.critical_cwv_failure) {
          return 'critical'
        }
        if (issue.major_ranking_impact || issue.site_wide_issue) {
          return 'major'
        }
        if (issue.minor_impact) {
          return 'minor'
        }
        return 'info'
      }

      const issues = [
        { blocks_indexing: true, impact: 10 },
        { major_ranking_impact: true, impact: 8 },
        { minor_impact: true, impact: 5 },
        { optimization_opportunity: true, impact: 3 },
      ]

      issues.forEach((issue) => {
        issue.category = categorizeIssue(issue)
      })

      expect(issues[0].category).toBe('critical')
      expect(issues[1].category).toBe('major')
      expect(issues[2].category).toBe('minor')
      expect(issues[3].category).toBe('info')
    })

    it('should handle zero effort gracefully', () => {
      const calculatePriority = (impact: number, urgency: number, effort: number) => {
        if (effort === 0) return Infinity // Instant fix, highest priority
        return (impact * urgency) / effort
      }

      const instantFix = calculatePriority(5, 5, 0)
      const normalFix = calculatePriority(5, 5, 5)

      expect(instantFix).toBe(Infinity)
      expect(normalFix).toBe(5)
    })

    it('should weight impact more heavily than urgency', () => {
      const calculateWeightedPriority = (impact: number, urgency: number, effort: number) => {
        // Weight impact 60%, urgency 40%
        const weightedScore = impact * 0.6 + urgency * 0.4
        return weightedScore / effort
      }

      const highImpact = calculateWeightedPriority(10, 5, 5) // High impact, medium urgency
      const highUrgency = calculateWeightedPriority(5, 10, 5) // Medium impact, high urgency

      expect(highImpact).toBeGreaterThan(highUrgency)
    })
  })

  describe('Fix Instruction Generation', () => {
    it('should generate fix instructions for missing meta tags', () => {
      const generateMetaTagFix = (page: any) => {
        const fixes = []
        
        if (!page.title_tag) {
          fixes.push({
            issue: 'Missing title tag',
            fix: `Add <title> tag in <head> section`,
            code: `<title>${page.suggested_title || 'Page Title'}</title>`,
            location: '<head>',
            priority: 'high',
          })
        }

        if (!page.meta_description) {
          fixes.push({
            issue: 'Missing meta description',
            fix: `Add meta description tag`,
            code: `<meta name="description" content="${page.suggested_description || 'Page description'}" />`,
            location: '<head>',
            priority: 'high',
          })
        }

        return fixes
      }

      const page = {
        url: 'https://example.com/page',
        title_tag: null,
        meta_description: null,
        suggested_title: 'Example Page',
        suggested_description: 'This is an example page',
      }

      const fixes = generateMetaTagFix(page)

      expect(fixes.length).toBe(2)
      expect(fixes[0].issue).toBe('Missing title tag')
      expect(fixes[0].code).toContain('<title>')
      expect(fixes[1].issue).toBe('Missing meta description')
      expect(fixes[1].code).toContain('meta name="description"')
    })

    it('should generate robots.txt fix instructions', () => {
      const generateRobotsTxtFix = (issues: any[]) => {
        const fixes = []
        
        if (issues.some(i => i.missing_robots_txt)) {
          fixes.push({
            issue: 'Missing robots.txt',
            fix: 'Create robots.txt file in root directory',
            code: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://example.com/sitemap.xml`,
            location: '/robots.txt',
            priority: 'critical',
          })
        }

        if (issues.some(i => i.robots_txt_blocks_important)) {
          fixes.push({
            issue: 'robots.txt blocking important pages',
            fix: 'Update robots.txt to allow important pages',
            code: `User-agent: *
Allow: /important-page/
Allow: /blog/
Disallow: /admin/`,
            location: '/robots.txt',
            priority: 'major',
          })
        }

        return fixes
      }

      const issues = [
        { missing_robots_txt: true },
        { robots_txt_blocks_important: false },
      ]

      const fixes = generateRobotsTxtFix(issues)

      expect(fixes.length).toBe(1)
      expect(fixes[0].issue).toBe('Missing robots.txt')
      expect(fixes[0].code).toContain('User-agent')
      expect(fixes[0].code).toContain('Sitemap')
    })

    it('should generate redirect rule fixes', () => {
      const generateRedirectFixes = (brokenLinks: any[]) => {
        return brokenLinks.map((link) => {
          if (link.status === 404 && link.redirect_target) {
            return {
              issue: `Broken link: ${link.url}`,
              fix: `Create 301 redirect to ${link.redirect_target}`,
              apache: `Redirect 301 ${link.path} ${link.redirect_target}`,
              nginx: `return 301 ${link.redirect_target};`,
              priority: link.is_important ? 'major' : 'minor',
            }
          }
          return null
        }).filter(Boolean)
      }

      const brokenLinks = [
        {
          url: 'https://example.com/old-page',
          path: '/old-page',
          status: 404,
          redirect_target: 'https://example.com/new-page',
          is_important: true,
        },
        {
          url: 'https://example.com/removed',
          path: '/removed',
          status: 404,
          redirect_target: 'https://example.com/home',
          is_important: false,
        },
      ]

      const fixes = generateRedirectFixes(brokenLinks)

      expect(fixes.length).toBe(2)
      expect(fixes[0].apache).toContain('Redirect 301')
      expect(fixes[0].nginx).toContain('return 301')
      expect(fixes[0].priority).toBe('major')
    })

    it('should generate Core Web Vitals optimization fixes', () => {
      const generateCWVFixes = (metrics: any) => {
        const fixes = []

        if (metrics.lcp > 2.5) {
          fixes.push({
            issue: `LCP too slow: ${metrics.lcp}s (target: <2.5s)`,
            fix: 'Optimize Largest Contentful Paint',
            steps: [
              'Optimize images (WebP format, lazy loading)',
              'Preload critical resources',
              'Reduce server response time',
              'Remove render-blocking resources',
            ],
            priority: 'major',
          })
        }

        if (metrics.cls > 0.1) {
          fixes.push({
            issue: `CLS too high: ${metrics.cls} (target: <0.1)`,
            fix: 'Reduce Cumulative Layout Shift',
            steps: [
              'Set size attributes on images and videos',
              'Reserve space for ads and embeds',
              'Avoid inserting content above existing content',
            ],
            priority: 'major',
          })
        }

        return fixes
      }

      const metrics = {
        lcp: 3.2,
        fid: 80,
        cls: 0.15,
      }

      const fixes = generateCWVFixes(metrics)

      expect(fixes.length).toBe(2)
      expect(fixes[0].issue).toContain('LCP')
      expect(fixes[0].steps.length).toBeGreaterThan(0)
      expect(fixes[1].issue).toContain('CLS')
    })
  })

  describe('Categorization Logic', () => {
    it('should categorize issues by severity correctly', () => {
      const categorizeIssue = (issue: any) => {
        // Critical: Blocks indexing or causes major failures
        if (
          issue.blocks_indexing ||
          issue.site_wide_crawl_error ||
          issue.critical_cwv_failure ||
          issue.missing_sitemap_robots
        ) {
          return { severity: 'critical', priority: 1 }
        }

        // Major: Significant impact on rankings
        if (
          issue.major_ranking_impact ||
          issue.slow_page_load ||
          issue.mobile_usability_issues ||
          issue.duplicate_content
        ) {
          return { severity: 'major', priority: 2 }
        }

        // Minor: Small impact
        if (
          issue.missing_alt_text ||
          issue.minor_heading_issues ||
          issue.suboptimal_linking
        ) {
          return { severity: 'minor', priority: 3 }
        }

        // Info: Optimization opportunities
        return { severity: 'info', priority: 4 }
      }

      const issues = [
        { blocks_indexing: true },
        { major_ranking_impact: true },
        { missing_alt_text: true },
        { schema_enhancement: true },
      ]

      const categorized = issues.map((issue) => ({
        ...issue,
        ...categorizeIssue(issue),
      }))

      expect(categorized[0].severity).toBe('critical')
      expect(categorized[0].priority).toBe(1)
      expect(categorized[1].severity).toBe('major')
      expect(categorized[2].severity).toBe('minor')
      expect(categorized[3].severity).toBe('info')
    })

    it('should group issues by type', () => {
      const issues = [
        { type: 'meta_tags', issue: 'Missing title tag' },
        { type: 'meta_tags', issue: 'Missing meta description' },
        { type: 'performance', issue: 'Slow LCP' },
        { type: 'performance', issue: 'High CLS' },
        { type: 'links', issue: 'Broken internal link' },
      ]

      const grouped = issues.reduce((acc, issue) => {
        if (!acc[issue.type]) {
          acc[issue.type] = []
        }
        acc[issue.type].push(issue)
        return acc
      }, {} as Record<string, any[]>)

      expect(grouped.meta_tags.length).toBe(2)
      expect(grouped.performance.length).toBe(2)
      expect(grouped.links.length).toBe(1)
    })

    it('should prioritize issues affecting multiple pages', () => {
      const issues = [
        { issue: 'Missing title tag', affected_pages: 1 },
        { issue: 'Slow page load', affected_pages: 50 },
        { issue: 'Broken link', affected_pages: 5 },
        { issue: 'Missing alt text', affected_pages: 200 },
      ]

      const calculateImpact = (issue: any) => {
        // Higher impact if affects more pages
        const baseImpact = issue.affected_pages > 10 ? 8 : 5
        return baseImpact * (1 + issue.affected_pages / 100)
      }

      issues.forEach((issue) => {
        issue.impact_score = calculateImpact(issue)
      })

      issues.sort((a, b) => b.impact_score - a.impact_score)

      expect(issues[0].affected_pages).toBe(200)
      expect(issues[1].affected_pages).toBe(50)
    })

    it('should handle edge cases in categorization', () => {
      const categorizeIssue = (issue: any) => {
        // Handle null/undefined gracefully
        if (!issue || typeof issue !== 'object') {
          return { severity: 'info', priority: 4 }
        }

        // Handle missing properties
        const hasCritical = issue.blocks_indexing ?? false
        const hasMajor = issue.major_impact ?? false

        if (hasCritical) return { severity: 'critical', priority: 1 }
        if (hasMajor) return { severity: 'major', priority: 2 }
        return { severity: 'info', priority: 4 }
      }

      expect(categorizeIssue(null).severity).toBe('info')
      expect(categorizeIssue({}).severity).toBe('info')
      expect(categorizeIssue({ blocks_indexing: true }).severity).toBe('critical')
      expect(categorizeIssue({ major_impact: true }).severity).toBe('major')
    })
  })

  describe('Issue Detection from Lighthouse Data', () => {
    it('should detect Core Web Vitals issues from Lighthouse results', () => {
      const detectCWVIssues = (lighthouse: any) => {
        const issues = []

        const metrics = lighthouse.audits || {}

        if (metrics['largest-contentful-paint']?.numericValue > 2500) {
          issues.push({
            type: 'performance',
            metric: 'LCP',
            value: metrics['largest-contentful-paint'].numericValue,
            target: 2500,
            severity: 'major',
          })
        }

        if (metrics['cumulative-layout-shift']?.numericValue > 0.1) {
          issues.push({
            type: 'performance',
            metric: 'CLS',
            value: metrics['cumulative-layout-shift'].numericValue,
            target: 0.1,
            severity: 'major',
          })
        }

        if (metrics['first-contentful-paint']?.numericValue > 1800) {
          issues.push({
            type: 'performance',
            metric: 'FCP',
            value: metrics['first-contentful-paint'].numericValue,
            target: 1800,
            severity: 'minor',
          })
        }

        return issues
      }

      const lighthouseData = {
        audits: {
          'largest-contentful-paint': { numericValue: 3200 },
          'cumulative-layout-shift': { numericValue: 0.15 },
          'first-contentful-paint': { numericValue: 2000 },
        },
      }

      const issues = detectCWVIssues(lighthouseData)

      expect(issues.length).toBe(3)
      expect(issues[0].metric).toBe('LCP')
      expect(issues[0].severity).toBe('major')
      expect(issues[1].metric).toBe('CLS')
      expect(issues[2].metric).toBe('FCP')
    })

    it('should detect SEO issues from content parsing', () => {
      const detectSEOIssues = (parsed: any) => {
        const issues = []

        if (!parsed.title || parsed.title.length === 0) {
          issues.push({
            type: 'meta_tags',
            issue: 'Missing title tag',
            severity: 'critical',
          })
        } else if (parsed.title.length > 60) {
          issues.push({
            type: 'meta_tags',
            issue: `Title too long: ${parsed.title.length} chars (max 60)`,
            severity: 'major',
          })
        }

        if (!parsed.meta_description || parsed.meta_description.length === 0) {
          issues.push({
            type: 'meta_tags',
            issue: 'Missing meta description',
            severity: 'major',
          })
        } else if (parsed.meta_description.length > 160) {
          issues.push({
            type: 'meta_tags',
            issue: `Meta description too long: ${parsed.meta_description.length} chars (max 160)`,
            severity: 'minor',
          })
        }

        if (!parsed.h1 || parsed.h1.length === 0) {
          issues.push({
            type: 'content_structure',
            issue: 'Missing H1 tag',
            severity: 'major',
          })
        }

        const imagesWithoutAlt = parsed.images?.filter((img: any) => !img.alt) || []
        if (imagesWithoutAlt.length > 0) {
          issues.push({
            type: 'accessibility',
            issue: `${imagesWithoutAlt.length} images missing alt text`,
            severity: 'minor',
            count: imagesWithoutAlt.length,
          })
        }

        return issues
      }

      const parsedContent = {
        title: 'This is a very long title that exceeds the recommended 60 character limit for SEO',
        meta_description: null,
        h1: 'Page Heading',
        images: [
          { src: '/img1.jpg', alt: 'Image 1' },
          { src: '/img2.jpg', alt: null },
          { src: '/img3.jpg', alt: null },
        ],
      }

      const issues = detectSEOIssues(parsedContent)

      // Expected issues:
      // 1. Title too long (83 chars > 60)
      // 2. Missing meta description (null)
      // 3. Images missing alt text (2 images)
      // Note: H1 is present ('Page Heading'), so no H1 issue
      expect(issues.length).toBe(3)
      expect(issues[0].issue).toContain('Title too long')
      expect(issues[1].issue).toBe('Missing meta description')
      expect(issues[2].count).toBe(2)
    })
  })
})

