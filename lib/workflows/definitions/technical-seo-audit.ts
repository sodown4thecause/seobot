// Workflow: Technical SEO Audit
// Comprehensive technical SEO audit workflow: crawling, issue detection, action plans, asset generation, and monitoring

import { Workflow } from '../types'

export const technicalSEOAuditWorkflow: Workflow = {
  id: 'technical-seo-audit',
  name: 'Technical SEO Audit',
  description: 'Complete technical SEO audit: site crawling, issue detection, action plans, asset generation, and monitoring',
  icon: '🔧',
  category: 'seo',
  estimatedTime: '10-15 minutes',
  tags: ['Technical SEO', 'Audit', 'Core Web Vitals', 'Site Health'],
  requiredTools: [
    'firecrawl_crawl',
    'on_page_lighthouse',
    'on_page_content_parsing',
    'on_page_instant_pages',
  ],
  requiredAPIs: ['firecrawl', 'dataforseo'],
  
  parameters: {
    targetUrl: {
      type: 'string',
      description: 'URL of the website to audit',
      required: true,
      example: 'https://example.com',
    },
    crawlDepth: {
      type: 'number',
      description: 'Maximum depth to crawl (default: 3)',
      required: false,
      example: 3,
    },
    includeSubdomains: {
      type: 'boolean',
      description: 'Whether to include subdomains in crawl',
      required: false,
      example: false,
    },
  },

  steps: [
    // PHASE 1: SITE CRAWLING
    {
      id: 'crawl-site-structure',
      name: 'Site Structure Crawling',
      description: 'Crawl website structure to map all pages and links',
      agent: 'research',
      parallel: false,
      tools: [
        {
          name: 'firecrawl_crawl',
          params: {
            url: '{{targetUrl}}',
            limit: 100,
            maxDepth: '{{crawlDepth}}',
            scrapeOptions: {
              formats: ['markdown', 'html', 'links'],
            },
          },
          required: true,
        },
      ],
      systemPrompt: `You are crawling a website to map its structure.

Document:
1. All discovered URLs and their hierarchy
2. Internal linking structure
3. Broken links (404s, redirects)
4. Duplicate content issues
5. Missing pages (orphaned pages)
6. Site architecture and navigation

Create a comprehensive site map of the website structure.`,
      outputFormat: 'json',
    },

    {
      id: 'crawl-core-web-vitals',
      name: 'Core Web Vitals Analysis',
      description: 'Analyze Core Web Vitals for key pages',
      agent: 'research',
      parallel: true,
      dependencies: ['crawl-site-structure'],
      tools: [
        {
          name: 'on_page_lighthouse',
          params: {
            url: '{{homepage_url}}',
            enable_javascript: true,
          },
          required: true,
        },
        {
          name: 'on_page_lighthouse',
          params: {
            url: '{{top_page_1}}',
            enable_javascript: true,
          },
        },
        {
          name: 'on_page_lighthouse',
          params: {
            url: '{{top_page_2}}',
            enable_javascript: true,
          },
        },
      ],
      systemPrompt: `You are analyzing Core Web Vitals and page performance.

For each page, analyze:
1. Largest Contentful Paint (LCP) - target < 2.5s
2. First Input Delay (FID) - target < 100ms
3. Cumulative Layout Shift (CLS) - target < 0.1
4. Time to First Byte (TTFB)
5. Total Blocking Time (TBT)
6. Speed Index

Identify performance bottlenecks and optimization opportunities.`,
      outputFormat: 'json',
    },

    {
      id: 'crawl-content-parsing',
      name: 'Content Parsing Analysis',
      description: 'Parse content structure and SEO elements',
      agent: 'research',
      parallel: true,
      dependencies: ['crawl-site-structure'],
      tools: [
        {
          name: 'on_page_content_parsing',
          params: {
            url: '{{homepage_url}}',
          },
        },
        {
          name: 'on_page_content_parsing',
          params: {
            url: '{{key_page_1}}',
          },
        },
      ],
      systemPrompt: `You are parsing page content to identify SEO elements.

For each page, check:
1. Title tags (presence, length, uniqueness)
2. Meta descriptions (presence, length, uniqueness)
3. Heading structure (H1, H2, H3 hierarchy)
4. Image alt text (presence, quality)
5. Internal links (anchor text, context)
6. Schema markup (presence, correctness)
7. Canonical tags
8. Robots meta tags

Identify missing or incorrect SEO elements.`,
      outputFormat: 'json',
    },

    // PHASE 2: ISSUE DETECTION
    {
      id: 'detection-issue-categorization',
      name: 'Issue Categorization',
      description: 'Categorize detected issues by severity and type',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['crawl-core-web-vitals', 'crawl-content-parsing'],
      tools: [],
      systemPrompt: `You are categorizing technical SEO issues by severity and type.

Categorize issues as:
1. **Critical** - Blocks indexing, causes major ranking drops
   - Broken sitemap/robots.txt
   - Site-wide crawl errors
   - Critical Core Web Vitals failures

2. **Major** - Significant impact on rankings/UX
   - Missing meta tags on key pages
   - Slow page load times
   - Mobile usability issues
   - Duplicate content

3. **Minor** - Small impact, should be fixed
   - Missing alt text on some images
   - Minor heading structure issues
   - Suboptimal internal linking

4. **Info** - Best practices, optimization opportunities
   - Schema markup enhancements
   - Internal linking improvements
   - Content optimization suggestions

Create a prioritized list of issues.`,
      outputFormat: 'json',
    },

    {
      id: 'detection-priority-scoring',
      name: 'Priority Scoring',
      description: 'Calculate priority scores based on impact and effort',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['detection-issue-categorization'],
      tools: [],
      systemPrompt: `You are calculating priority scores for each issue.

Priority Score = Impact × Urgency / Effort

Where:
- Impact: How much it affects rankings/traffic (1-10)
- Urgency: How quickly it needs fixing (1-10)
- Effort: How difficult/time-consuming to fix (1-10)

Rank issues by priority score (highest first).

Also estimate:
- Time to fix
- Expected improvement
- Risk if not fixed`,
      outputFormat: 'json',
    },

    // PHASE 3: ACTION PLAN GENERATION
    {
      id: 'action-plan-generation',
      name: 'Action Plan Generation',
      description: 'Generate step-by-step fix instructions for each issue',
      agent: 'strategy',
      parallel: false,
      dependencies: ['detection-priority-scoring'],
      tools: [],
      systemPrompt: `You are creating actionable fix instructions for each technical SEO issue.

For each issue, provide:
1. **Issue Description** - Clear explanation of the problem
2. **Impact** - How it affects SEO/rankings
3. **Step-by-Step Fix** - Detailed instructions
4. **Code Examples** - If applicable, provide code snippets
5. **Testing** - How to verify the fix worked
6. **Timeline** - Estimated time to implement
7. **Resources** - Links to documentation/tools

Make instructions clear and actionable for developers.`,
      outputFormat: 'component',
      componentType: 'TechnicalSEOActions',
    },

    {
      id: 'action-plan-code-snippets',
      name: 'Code Snippet Generation',
      description: 'Generate code snippets for fixable issues',
      agent: 'content',
      parallel: false,
      dependencies: ['action-plan-generation'],
      tools: [],
      systemPrompt: `You are generating code snippets for technical SEO fixes.

Provide ready-to-use code for:
1. robots.txt fixes
2. Meta tag additions
3. Schema markup
4. Redirect rules (.htaccess, nginx)
5. Sitemap XML structure
6. Canonical tag implementations

Ensure code is:
- Production-ready
- Well-commented
- Follows best practices
- Includes error handling where needed`,
      outputFormat: 'json',
    },

    // PHASE 4: ASSET GENERATION
    {
      id: 'asset-robots-txt',
      name: 'Robots.txt Generation',
      description: 'Generate or fix robots.txt file',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['action-plan-code-snippets'],
      tools: [],
      systemPrompt: `You are generating a robots.txt file for the website.

Create robots.txt that:
1. Allows important crawlers
2. Blocks unnecessary paths (admin, private)
3. Points to sitemap location
4. Handles crawl delays if needed
5. Follows robots.txt best practices

Provide the complete robots.txt content.`,
      outputFormat: 'text',
    },

    {
      id: 'asset-sitemap-generation',
      name: 'XML Sitemap Generation',
      description: 'Generate XML sitemap structure',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['crawl-site-structure'],
      tools: [],
      systemPrompt: `You are generating an XML sitemap for the website.

Create sitemap that:
1. Includes all important pages (from crawl)
2. Has correct priority and changefreq values
3. Includes lastmod dates
4. Follows XML sitemap protocol
5. Is split into multiple sitemaps if >50,000 URLs

Provide XML sitemap structure and instructions for generation.`,
      outputFormat: 'text',
    },

    {
      id: 'asset-redirect-rules',
      name: 'Redirect Rules Generation',
      description: 'Generate redirect rules for broken/moved pages',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['crawl-site-structure'],
      tools: [],
      systemPrompt: `You are generating redirect rules for broken or moved pages.

Create redirect rules for:
1. 404 errors found during crawl
2. HTTP to HTTPS redirects
3. www to non-www (or vice versa)
4. Trailing slash consistency
5. Old URLs to new URLs

Provide redirect rules in multiple formats:
- Apache (.htaccess)
- Nginx
- JavaScript (for client-side)
- Meta refresh (fallback)

Ensure 301 redirects for SEO value preservation.`,
      outputFormat: 'json',
    },

    // PHASE 5: MONITORING SETUP
    {
      id: 'monitoring-health-checks',
      name: 'Health Check Setup',
      description: 'Set up periodic health checks for ongoing monitoring',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['asset-redirect-rules'],
      tools: [],
      systemPrompt: `You are setting up ongoing health checks for technical SEO.

Create monitoring plan for:
1. **Weekly Checks**
   - Core Web Vitals monitoring
   - Broken link detection
   - Sitemap accessibility
   - Robots.txt accessibility

2. **Monthly Checks**
   - Full site crawl (structure changes)
   - Performance trends
   - Mobile usability
   - Index coverage (Google Search Console)

3. **Alert Thresholds**
   - Core Web Vitals degradation
   - Increase in 404 errors
   - Sitemap errors
   - Significant performance drops

Provide actionable monitoring checklist and alert configuration.`,
      outputFormat: 'component',
      componentType: 'MonitoringPlan',
    },

    {
      id: 'monitoring-improvement-tracking',
      name: 'Improvement Tracking Setup',
      description: 'Set up tracking to measure improvement over time',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['monitoring-health-checks'],
      tools: [],
      systemPrompt: `You are setting up tracking to measure technical SEO improvements.

Track metrics:
1. Core Web Vitals scores (before/after)
2. Page load times
3. Index coverage
4. Crawl errors
5. Mobile usability issues
6. Schema markup coverage

Create baseline metrics and set up tracking dashboard.

Provide:
- Baseline metrics snapshot
- Tracking intervals
- Success criteria
- Reporting format`,
      outputFormat: 'json',
    },
  ],

  output: {
    type: 'structured',
    components: ['TechnicalSEOActions', 'MonitoringPlan'],
  },
}

