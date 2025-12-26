import { ActionTemplate, ActionCategory, ActionDifficulty } from '@/types/actions'

/**
 * Action Templates Library
 * 
 * Pre-defined templates for common SEO actions that can be customized
 * based on analysis results and user context.
 */

export const ACTION_TEMPLATES: ActionTemplate[] = [
  // Keyword-related templates
  {
    id: 'keyword-gap-content',
    name: 'Create Content for Keyword Gaps',
    description: 'Develop new content targeting keyword opportunities identified in competitor analysis',
    category: 'content',
    difficulty: 'intermediate',
    titleTemplate: 'Create content targeting {{keywords.length}} keyword opportunities',
    descriptionTemplate: 'Develop comprehensive content pieces targeting high-opportunity keywords: {{keywords.join(", ")}}',
    stepsTemplate: [
      {
        id: 'research',
        title: 'Research keyword intent and competition',
        description: 'Analyze search intent and competitive landscape for target keywords',
        instructions: [
          'Use keyword research tools to analyze search volume and difficulty',
          'Study top-ranking pages for each keyword',
          'Identify content gaps and opportunities',
          'Document user intent for each keyword'
        ],
        estimatedTime: '2 hours',
        tools: ['SEMrush', 'Ahrefs', 'Google Keyword Planner']
      },
      {
        id: 'outline',
        title: 'Create detailed content outlines',
        description: 'Develop comprehensive outlines that address user intent',
        instructions: [
          'Create H1-H6 heading structure',
          'Plan content sections based on competitor analysis',
          'Include related keywords and semantic terms',
          'Add internal linking opportunities'
        ],
        estimatedTime: '1 hour'
      },
      {
        id: 'create',
        title: 'Write and optimize content',
        description: 'Create high-quality, SEO-optimized content',
        instructions: [
          'Write comprehensive, valuable content',
          'Optimize title tags and meta descriptions',
          'Include target keywords naturally',
          'Add relevant images and media',
          'Implement proper heading structure'
        ],
        estimatedTime: '4-6 hours'
      },
      {
        id: 'publish',
        title: 'Publish and promote content',
        description: 'Launch content and begin promotion activities',
        instructions: [
          'Publish content on website',
          'Submit to Google Search Console',
          'Share on social media channels',
          'Notify email subscribers',
          'Build internal links from existing content'
        ],
        estimatedTime: '1 hour'
      }
    ],
    variables: [
      { name: 'keywords', type: 'array', description: 'Target keywords', required: true },
      { name: 'priority', type: 'string', description: 'Action priority', required: false, defaultValue: 'medium' }
    ],
    triggers: [
      { type: 'keyword_gap', conditions: { minGaps: 3 }, weight: 0.8 },
      { type: 'content_opportunity', conditions: { minOpportunities: 2 }, weight: 0.6 }
    ],
    tags: ['content-creation', 'keyword-targeting', 'seo'],
    usageCount: 0,
    successRate: 0.75
  },

  {
    id: 'keyword-optimization',
    name: 'Optimize Existing Content for Keywords',
    description: 'Improve existing pages to better target specific keywords',
    category: 'content',
    difficulty: 'beginner',
    titleTemplate: 'Optimize {{keywords.length}} pages for better keyword targeting',
    descriptionTemplate: 'Improve existing content to better target: {{keywords.join(", ")}}',
    stepsTemplate: [
      {
        id: 'audit',
        title: 'Audit current keyword performance',
        description: 'Analyze how existing pages currently perform for target keywords',
        instructions: [
          'Check current rankings for target keywords',
          'Analyze on-page optimization gaps',
          'Review content quality and relevance',
          'Identify optimization opportunities'
        ],
        estimatedTime: '1 hour',
        tools: ['Google Search Console', 'SEMrush', 'Screaming Frog']
      },
      {
        id: 'optimize',
        title: 'Implement on-page optimizations',
        description: 'Update content and meta elements for better keyword targeting',
        instructions: [
          'Update title tags to include target keywords',
          'Optimize meta descriptions for click-through rate',
          'Improve heading structure (H1, H2, H3)',
          'Add target keywords naturally throughout content',
          'Optimize images with relevant alt text'
        ],
        estimatedTime: '2-3 hours'
      },
      {
        id: 'monitor',
        title: 'Monitor performance improvements',
        description: 'Track ranking and traffic improvements',
        instructions: [
          'Set up rank tracking for target keywords',
          'Monitor organic traffic changes',
          'Track click-through rates from search results',
          'Document improvements and learnings'
        ],
        estimatedTime: '30 minutes',
        tools: ['Google Analytics', 'Google Search Console']
      }
    ],
    variables: [
      { name: 'keywords', type: 'array', description: 'Keywords to optimize for', required: true },
      { name: 'pages', type: 'array', description: 'Pages to optimize', required: false }
    ],
    triggers: [
      { type: 'keyword_gap', conditions: { existingContent: true }, weight: 0.7 }
    ],
    tags: ['on-page-seo', 'keyword-optimization', 'content-improvement'],
    usageCount: 0,
    successRate: 0.85
  },

  // Technical SEO templates
  {
    id: 'page-speed-optimization',
    name: 'Improve Page Speed Performance',
    description: 'Optimize website loading speed for better user experience and SEO',
    category: 'technical',
    difficulty: 'intermediate',
    titleTemplate: 'Improve page speed from {{currentScore}} to 80+',
    descriptionTemplate: 'Optimize website performance to achieve faster loading times and better Core Web Vitals scores',
    stepsTemplate: [
      {
        id: 'audit',
        title: 'Conduct comprehensive speed audit',
        description: 'Analyze current performance and identify bottlenecks',
        instructions: [
          'Run PageSpeed Insights for key pages',
          'Test with GTmetrix and WebPageTest',
          'Analyze Core Web Vitals in Search Console',
          'Identify largest performance issues'
        ],
        estimatedTime: '1 hour',
        tools: ['PageSpeed Insights', 'GTmetrix', 'WebPageTest']
      },
      {
        id: 'images',
        title: 'Optimize images and media',
        description: 'Compress and optimize all images for web',
        instructions: [
          'Compress images without quality loss',
          'Convert to modern formats (WebP, AVIF)',
          'Implement lazy loading',
          'Add proper image dimensions',
          'Optimize video and other media files'
        ],
        estimatedTime: '2-3 hours',
        tools: ['TinyPNG', 'ImageOptim', 'Squoosh']
      },
      {
        id: 'code',
        title: 'Optimize code and resources',
        description: 'Minify and optimize CSS, JavaScript, and HTML',
        instructions: [
          'Minify CSS and JavaScript files',
          'Remove unused code and dependencies',
          'Optimize critical rendering path',
          'Implement resource preloading',
          'Enable browser caching'
        ],
        estimatedTime: '3-4 hours',
        tools: ['Webpack', 'Gulp', 'Critical CSS tools']
      },
      {
        id: 'server',
        title: 'Optimize server and hosting',
        description: 'Improve server response times and hosting configuration',
        instructions: [
          'Enable gzip compression',
          'Optimize database queries',
          'Implement CDN if not already using',
          'Upgrade hosting if necessary',
          'Configure server-side caching'
        ],
        estimatedTime: '2-4 hours'
      }
    ],
    variables: [
      { name: 'currentScore', type: 'number', description: 'Current PageSpeed score', required: true },
      { name: 'priority', type: 'string', description: 'Priority level', required: false }
    ],
    triggers: [
      { type: 'technical_issue', conditions: { type: 'page_speed', severity: 'high' }, weight: 0.9 }
    ],
    tags: ['technical-seo', 'page-speed', 'core-web-vitals', 'performance'],
    usageCount: 0,
    successRate: 0.80
  },

  {
    id: 'core-web-vitals',
    name: 'Improve Core Web Vitals',
    description: 'Optimize Largest Contentful Paint, First Input Delay, and Cumulative Layout Shift',
    category: 'technical',
    difficulty: 'intermediate',
    titleTemplate: 'Optimize Core Web Vitals for better user experience',
    descriptionTemplate: 'Improve LCP, FID, and CLS metrics to meet Google\'s Core Web Vitals thresholds',
    stepsTemplate: [
      {
        id: 'measure',
        title: 'Measure current Core Web Vitals',
        description: 'Get baseline measurements for all three metrics',
        instructions: [
          'Check Core Web Vitals in Search Console',
          'Use PageSpeed Insights for detailed analysis',
          'Set up real user monitoring',
          'Identify pages with poor scores'
        ],
        estimatedTime: '1 hour',
        tools: ['Google Search Console', 'PageSpeed Insights', 'Chrome DevTools']
      },
      {
        id: 'lcp',
        title: 'Optimize Largest Contentful Paint (LCP)',
        description: 'Improve loading performance of largest content element',
        instructions: [
          'Identify LCP element on each page',
          'Optimize images and media in LCP element',
          'Preload critical resources',
          'Optimize server response times',
          'Remove render-blocking resources'
        ],
        estimatedTime: '2-3 hours'
      },
      {
        id: 'fid',
        title: 'Optimize First Input Delay (FID)',
        description: 'Improve page responsiveness to user interactions',
        instructions: [
          'Minimize JavaScript execution time',
          'Break up long-running tasks',
          'Use web workers for heavy computations',
          'Optimize third-party scripts',
          'Implement code splitting'
        ],
        estimatedTime: '2-4 hours'
      },
      {
        id: 'cls',
        title: 'Optimize Cumulative Layout Shift (CLS)',
        description: 'Prevent unexpected layout shifts',
        instructions: [
          'Add size attributes to images and videos',
          'Reserve space for ads and embeds',
          'Avoid inserting content above existing content',
          'Use CSS aspect-ratio for responsive media',
          'Preload fonts to prevent font swapping'
        ],
        estimatedTime: '1-2 hours'
      }
    ],
    variables: [
      { name: 'currentScore', type: 'number', description: 'Current CWV score', required: true }
    ],
    triggers: [
      { type: 'technical_issue', conditions: { type: 'core_web_vitals' }, weight: 0.85 }
    ],
    tags: ['core-web-vitals', 'technical-seo', 'user-experience', 'performance'],
    usageCount: 0,
    successRate: 0.75
  },

  // Link building templates
  {
    id: 'easy-link-building',
    name: 'Pursue Easy Link Building Opportunities',
    description: 'Target low-difficulty, high-value link building opportunities',
    category: 'links',
    difficulty: 'beginner',
    titleTemplate: 'Build {{opportunities.length}} high-quality backlinks',
    descriptionTemplate: 'Pursue easy link building opportunities with high success probability',
    stepsTemplate: [
      {
        id: 'research',
        title: 'Research and validate opportunities',
        description: 'Verify link opportunities and gather contact information',
        instructions: [
          'Verify domain authority and relevance',
          'Check for existing relationships',
          'Find contact information for outreach',
          'Prepare personalized outreach templates',
          'Research content that would provide value'
        ],
        estimatedTime: '2-3 hours',
        tools: ['Ahrefs', 'Hunter.io', 'LinkedIn']
      },
      {
        id: 'content',
        title: 'Create linkable content assets',
        description: 'Develop content that naturally attracts links',
        instructions: [
          'Create valuable resources (guides, tools, data)',
          'Develop infographics or visual content',
          'Write expert roundups or interviews',
          'Produce original research or case studies',
          'Ensure content is easily shareable'
        ],
        estimatedTime: '4-6 hours'
      },
      {
        id: 'outreach',
        title: 'Execute outreach campaign',
        description: 'Contact prospects with personalized pitches',
        instructions: [
          'Send personalized outreach emails',
          'Follow up appropriately (not too aggressive)',
          'Provide value before asking for links',
          'Track responses and engagement',
          'Build genuine relationships'
        ],
        estimatedTime: '2-4 hours',
        tools: ['Email client', 'CRM system', 'Outreach tools']
      }
    ],
    variables: [
      { name: 'opportunities', type: 'array', description: 'Link opportunities', required: true }
    ],
    triggers: [
      { type: 'link_opportunity', conditions: { difficulty: 'low' }, weight: 0.8 }
    ],
    tags: ['link-building', 'outreach', 'relationship-building'],
    usageCount: 0,
    successRate: 0.65
  },

  {
    id: 'internal-linking',
    name: 'Optimize Internal Link Structure',
    description: 'Improve internal linking to distribute page authority and improve navigation',
    category: 'links',
    difficulty: 'beginner',
    titleTemplate: 'Optimize internal linking structure',
    descriptionTemplate: 'Improve internal links to boost page authority distribution and user navigation',
    stepsTemplate: [
      {
        id: 'audit',
        title: 'Audit current internal linking',
        description: 'Analyze existing internal link structure',
        instructions: [
          'Crawl website to map internal links',
          'Identify orphaned pages',
          'Find pages with too few internal links',
          'Analyze anchor text distribution',
          'Identify linking opportunities'
        ],
        estimatedTime: '2 hours',
        tools: ['Screaming Frog', 'Ahrefs Site Audit', 'Google Analytics']
      },
      {
        id: 'strategy',
        title: 'Develop internal linking strategy',
        description: 'Plan strategic internal linking improvements',
        instructions: [
          'Identify high-authority pages to link from',
          'Plan links to important target pages',
          'Create topic clusters and pillar pages',
          'Design logical site architecture',
          'Plan contextual linking opportunities'
        ],
        estimatedTime: '1 hour'
      },
      {
        id: 'implement',
        title: 'Implement internal linking improvements',
        description: 'Add strategic internal links throughout the site',
        instructions: [
          'Add contextual links within content',
          'Update navigation menus if needed',
          'Create related posts sections',
          'Add breadcrumb navigation',
          'Implement topic cluster linking'
        ],
        estimatedTime: '3-4 hours'
      }
    ],
    variables: [],
    triggers: [
      { type: 'technical_issue', conditions: { type: 'internal_linking' }, weight: 0.6 }
    ],
    tags: ['internal-linking', 'site-architecture', 'page-authority'],
    usageCount: 0,
    successRate: 0.90
  },

  // Content templates
  {
    id: 'content-gap-analysis',
    name: 'Address Content Gaps',
    description: 'Create content to fill identified gaps in your content strategy',
    category: 'content',
    difficulty: 'intermediate',
    titleTemplate: 'Fill {{gaps.length}} content gaps to improve topical authority',
    descriptionTemplate: 'Create comprehensive content to address gaps in your topical coverage',
    stepsTemplate: [
      {
        id: 'analyze',
        title: 'Analyze content gaps in detail',
        description: 'Deep dive into identified content gaps and opportunities',
        instructions: [
          'Research competitor content in gap areas',
          'Analyze search volume and difficulty for gap topics',
          'Identify user intent for each gap topic',
          'Prioritize gaps by business impact',
          'Plan content types for each gap'
        ],
        estimatedTime: '2-3 hours',
        tools: ['Content gap analysis tools', 'Keyword research tools']
      },
      {
        id: 'plan',
        title: 'Create content production plan',
        description: 'Develop detailed plan for gap content creation',
        instructions: [
          'Create editorial calendar for gap content',
          'Assign content types (blog, guide, video, etc.)',
          'Plan internal linking between gap content',
          'Identify content promotion strategies',
          'Set success metrics for each piece'
        ],
        estimatedTime: '1-2 hours'
      },
      {
        id: 'create',
        title: 'Produce gap content',
        description: 'Create high-quality content for identified gaps',
        instructions: [
          'Research and write comprehensive content',
          'Optimize for target keywords and user intent',
          'Include relevant images and media',
          'Implement proper on-page SEO',
          'Plan content promotion and distribution'
        ],
        estimatedTime: '6-10 hours per piece'
      }
    ],
    variables: [
      { name: 'gaps', type: 'array', description: 'Content gaps to address', required: true }
    ],
    triggers: [
      { type: 'content_opportunity', conditions: { minGaps: 3 }, weight: 0.75 }
    ],
    tags: ['content-strategy', 'topical-authority', 'content-gaps'],
    usageCount: 0,
    successRate: 0.70
  },

  {
    id: 'featured-snippet-optimization',
    name: 'Optimize for Featured Snippets',
    description: 'Structure content to capture featured snippet positions',
    category: 'content',
    difficulty: 'intermediate',
    titleTemplate: 'Optimize content for featured snippets',
    descriptionTemplate: 'Structure content to capture position zero for target keywords',
    stepsTemplate: [
      {
        id: 'research',
        title: 'Research featured snippet opportunities',
        description: 'Identify keywords with featured snippet potential',
        instructions: [
          'Find keywords where competitors have snippets',
          'Identify question-based keywords',
          'Analyze current snippet formats (paragraph, list, table)',
          'Check your current rankings for snippet keywords',
          'Prioritize by traffic potential and difficulty'
        ],
        estimatedTime: '1-2 hours',
        tools: ['SEMrush', 'Ahrefs', 'AnswerThePublic']
      },
      {
        id: 'optimize',
        title: 'Optimize content for snippets',
        description: 'Structure content to match snippet formats',
        instructions: [
          'Add clear, concise answers to target questions',
          'Use proper heading structure (H2, H3)',
          'Create bulleted or numbered lists when appropriate',
          'Add tables for comparison data',
          'Include FAQ sections with structured data'
        ],
        estimatedTime: '2-3 hours'
      },
      {
        id: 'monitor',
        title: 'Monitor snippet performance',
        description: 'Track featured snippet wins and optimize further',
        instructions: [
          'Monitor rankings for snippet keywords',
          'Track click-through rates from snippets',
          'Analyze competitor snippet strategies',
          'Continuously optimize based on performance',
          'Expand to related snippet opportunities'
        ],
        estimatedTime: '30 minutes weekly',
        tools: ['Google Search Console', 'Rank tracking tools']
      }
    ],
    variables: [
      { name: 'targetKeywords', type: 'array', description: 'Keywords to target for snippets', required: true }
    ],
    triggers: [
      { type: 'content_opportunity', conditions: { type: 'featured_snippet' }, weight: 0.7 }
    ],
    tags: ['featured-snippets', 'serp-features', 'content-optimization'],
    usageCount: 0,
    successRate: 0.60
  },

  // Competitor analysis templates
  {
    id: 'competitor-content-gap',
    name: 'Analyze Competitor Content Gaps',
    description: 'Identify and capitalize on content opportunities from competitor analysis',
    category: 'content',
    difficulty: 'intermediate',
    titleTemplate: 'Capitalize on competitor content advantages',
    descriptionTemplate: 'Create content to compete with {{competitors.join(" and ")}} in key topic areas',
    stepsTemplate: [
      {
        id: 'analyze',
        title: 'Analyze competitor content strategies',
        description: 'Deep dive into competitor content that outperforms yours',
        instructions: [
          'Identify top-performing competitor content',
          'Analyze content depth and quality',
          'Study their content promotion strategies',
          'Identify gaps in their content',
          'Map their content to customer journey stages'
        ],
        estimatedTime: '3-4 hours',
        tools: ['Ahrefs Content Explorer', 'SEMrush', 'BuzzSumo']
      },
      {
        id: 'plan',
        title: 'Plan competitive content strategy',
        description: 'Develop strategy to create superior content',
        instructions: [
          'Plan content that\'s 10x better than competitors',
          'Identify unique angles and perspectives',
          'Plan additional value-adds (tools, templates, data)',
          'Design better user experience and formatting',
          'Plan comprehensive promotion strategy'
        ],
        estimatedTime: '2 hours'
      },
      {
        id: 'execute',
        title: 'Create and promote superior content',
        description: 'Execute the competitive content strategy',
        instructions: [
          'Create comprehensive, high-quality content',
          'Include unique data, insights, or tools',
          'Optimize for better user experience',
          'Implement superior on-page SEO',
          'Execute multi-channel promotion strategy'
        ],
        estimatedTime: '8-12 hours'
      }
    ],
    variables: [
      { name: 'competitors', type: 'array', description: 'Competitor domains', required: true },
      { name: 'advantages', type: 'array', description: 'Competitor advantages to address', required: true }
    ],
    triggers: [
      { type: 'competitor_advantage', conditions: { minAdvantages: 2 }, weight: 0.7 }
    ],
    tags: ['competitor-analysis', 'content-strategy', 'competitive-advantage'],
    usageCount: 0,
    successRate: 0.65
  },

  // Additional templates for ActionGenerator compatibility
  {
    id: 'long-tail-expansion',
    name: 'Long-Tail Keyword Expansion',
    description: 'Expand into long-tail keyword variations for broader search coverage',
    category: 'keywords',
    difficulty: 'intermediate',
    titleTemplate: 'Expand into long-tail variations of {{baseKeywords.length}} keywords',
    descriptionTemplate: 'Target long-tail keyword opportunities for improved search visibility',
    stepsTemplate: [
      {
        id: 'research',
        title: 'Research long-tail variations',
        description: 'Identify valuable long-tail keyword opportunities',
        instructions: [
          'Use keyword research tools to find long-tail variations',
          'Analyze search intent for each variation',
          'Check competition levels for long-tail terms',
          'Identify question-based keywords'
        ],
        estimatedTime: '2 hours',
        tools: ['Ahrefs', 'SEMrush', 'AnswerThePublic']
      },
      {
        id: 'prioritize',
        title: 'Prioritize opportunities',
        description: 'Select the most valuable long-tail keywords to target',
        instructions: [
          'Score keywords by search volume and difficulty',
          'Group related keywords into topic clusters',
          'Identify content creation vs optimization opportunities',
          'Create targeting roadmap'
        ],
        estimatedTime: '1 hour'
      }
    ],
    variables: [
      { name: 'baseKeywords', type: 'array', description: 'Base keywords to expand', required: true }
    ],
    triggers: [
      { type: 'keyword_gap', conditions: { type: 'long_tail' }, weight: 0.6 }
    ],
    tags: ['keyword-research', 'long-tail', 'search-visibility'],
    usageCount: 0,
    successRate: 0.70
  },

  {
    id: 'content-optimization',
    name: 'Optimize Low-Performing Content',
    description: 'Improve existing content that is underperforming in search results',
    category: 'content',
    difficulty: 'beginner',
    titleTemplate: 'Optimize {{pages.length}} low-performing pages',
    descriptionTemplate: 'Improve content quality and SEO for underperforming pages',
    stepsTemplate: [
      {
        id: 'analyze',
        title: 'Analyze underperforming content',
        description: 'Identify specific issues with low-performing content',
        instructions: [
          'Review current ranking positions and traffic',
          'Analyze content quality against competitors',
          'Check on-page SEO elements',
          'Identify content gaps and improvement areas'
        ],
        estimatedTime: '1-2 hours',
        tools: ['Google Search Console', 'Google Analytics']
      },
      {
        id: 'improve',
        title: 'Improve content quality',
        description: 'Enhance content to better serve user intent',
        instructions: [
          'Update outdated information',
          'Add more comprehensive coverage',
          'Improve readability and formatting',
          'Add relevant images and media',
          'Strengthen internal linking'
        ],
        estimatedTime: '2-4 hours'
      }
    ],
    variables: [
      { name: 'pages', type: 'array', description: 'Pages to optimize', required: true }
    ],
    triggers: [
      { type: 'content_opportunity', conditions: { performance: 'low' }, weight: 0.7 }
    ],
    tags: ['content-optimization', 'content-quality', 'on-page-seo'],
    usageCount: 0,
    successRate: 0.80
  },

  {
    id: 'broken-link-building',
    name: 'Broken Link Building Campaign',
    description: 'Find and replace broken links on other sites with your content',
    category: 'links',
    difficulty: 'advanced',
    titleTemplate: 'Execute broken link building campaign',
    descriptionTemplate: 'Identify broken links and offer your content as replacements',
    stepsTemplate: [
      {
        id: 'find',
        title: 'Find broken link opportunities',
        description: 'Discover broken links on relevant websites',
        instructions: [
          'Identify resource pages in your niche',
          'Check for broken links on competitor backlink pages',
          'Use broken link finder tools',
          'Verify broken links are relevant to your content'
        ],
        estimatedTime: '3-4 hours',
        tools: ['Ahrefs', 'Check My Links', 'Broken Link Checker']
      },
      {
        id: 'outreach',
        title: 'Conduct replacement outreach',
        description: 'Reach out to site owners with replacement content',
        instructions: [
          'Find contact information for site owners',
          'Create personalized outreach emails',
          'Suggest your content as replacement',
          'Follow up appropriately',
          'Track responses and success rate'
        ],
        estimatedTime: '2-3 hours'
      }
    ],
    variables: [],
    triggers: [
      { type: 'link_opportunity', conditions: { type: 'broken_link' }, weight: 0.5 }
    ],
    tags: ['link-building', 'outreach', 'advanced-seo'],
    usageCount: 0,
    successRate: 0.45
  },

  {
    id: 'competitor-backlink-analysis',
    name: 'Competitor Backlink Analysis',
    description: 'Analyze competitor backlink profiles to find link opportunities',
    category: 'links',
    difficulty: 'intermediate',
    titleTemplate: 'Analyze backlinks of {{competitors.length}} competitors',
    descriptionTemplate: 'Study competitor link profiles to identify replicable opportunities',
    stepsTemplate: [
      {
        id: 'analyze',
        title: 'Analyze competitor backlinks',
        description: 'Export and study competitor backlink profiles',
        instructions: [
          'Export competitor backlink data',
          'Identify high-value linking domains',
          'Categorize link types (editorial, guest post, directory, etc.)',
          'Note acquisition strategies used'
        ],
        estimatedTime: '2-3 hours',
        tools: ['Ahrefs', 'SEMrush', 'Moz']
      },
      {
        id: 'opportunities',
        title: 'Identify replicable opportunities',
        description: 'Find link sources you can also pursue',
        instructions: [
          'Filter for domains that might link to you',
          'Identify content gaps that could attract similar links',
          'Plan outreach to promising prospects',
          'Create a prioritized prospect list'
        ],
        estimatedTime: '1-2 hours'
      }
    ],
    variables: [
      { name: 'competitors', type: 'array', description: 'Competitor domains to analyze', required: true }
    ],
    triggers: [
      { type: 'competitor_advantage', conditions: { type: 'backlinks' }, weight: 0.6 }
    ],
    tags: ['link-building', 'competitor-analysis', 'backlinks'],
    usageCount: 0,
    successRate: 0.60
  }
]
