/**
 * Guided Workflow Prompts for Dashboard Quick Start Actions
 * 
 * These prompts guide users through complex SEO tasks step-by-step
 * using conversational AI workflows with AI SDK 6
 */

export interface GuidedWorkflow {
  id: string
  title: string
  description: string
  initialPrompt: string
  context?: Record<string, unknown>
}

/**
 * Guided workflow definitions for dashboard quick actions
 */
export const GUIDED_WORKFLOWS: Record<string, GuidedWorkflow> = {
  'seo-tools': {
    id: 'seo-tools',
    title: 'SEO Tools & Analysis',
    description: 'Comprehensive keyword and content gap analysis',
    initialPrompt: `I'd like to use your SEO analysis tools. Let's start with keyword research and content gap analysis.

First, I need to know:
1. What is your website URL?
2. What is your primary target keyword or topic?
3. Who are your top 3 competitors (if known)?

Please provide this information and I'll run a comprehensive SEO analysis including:
- Keyword research with search volume and difficulty
- Content gap analysis comparing you to competitors
- AI search visibility insights
- Actionable recommendations

What's your website URL to get started?`,
    context: {
      workflowType: 'seo-analysis',
      expectedSteps: ['website-url', 'keyword', 'competitors', 'analysis', 'recommendations']
    }
  },

  'complete-ranking-campaign': {
    id: 'complete-ranking-campaign',
    title: 'Create Ranking Content',
    description: 'AI-powered content creation with SEO optimization',
    initialPrompt: `Let's create high-ranking, SEO-optimized content for you! I'll guide you through a proven process that includes research, writing, and optimization.

To get started, I need:
1. What topic or keyword do you want to rank for?
2. What type of content? (blog post, article, landing page, etc.)
3. Target word count (e.g., 1500-2000 words)
4. Any specific competitor URLs to reference?

I'll then:
✓ Research the topic using real-time data
✓ Analyze top-ranking content
✓ Generate SEO-optimized content with proper structure
✓ Include relevant images if needed
✓ Provide EEAT optimization tips

What topic would you like to create content about?`,
    context: {
      workflowType: 'content-creation',
      expectedSteps: ['topic-selection', 'research', 'outline', 'writing', 'optimization', 'review']
    }
  },

  'technical-seo-audit': {
    id: 'technical-seo-audit',
    title: 'Technical SEO Audit',
    description: 'Find and fix technical SEO issues',
    initialPrompt: `I'll perform a comprehensive technical SEO audit of your website to identify and help fix critical issues.

To begin the audit, I need:
1. Your website URL
2. Are there any specific pages or sections you're concerned about?
3. Do you have access to Google Search Console? (helpful but not required)

The audit will cover:
- Page speed and Core Web Vitals
- Mobile responsiveness
- Crawlability and indexation
- Site structure and internal linking
- Technical errors (404s, broken links, etc.)
- Schema markup opportunities
- Security and HTTPS issues

After the audit, I'll provide:
- Prioritized list of issues
- Step-by-step fix instructions
- Impact assessment for each issue

What's your website URL?`,
    context: {
      workflowType: 'technical-audit',
      expectedSteps: ['url-collection', 'crawl', 'analysis', 'issue-detection', 'recommendations']
    }
  },

  'competitor-analysis': {
    id: 'competitor-analysis',
    title: 'Competitor Analysis',
    description: 'Discover what your competitors are doing right',
    initialPrompt: `Let's analyze your competitors to find opportunities and gaps you can exploit!

I need:
1. Your website URL
2. Your main competitors (2-5 URLs if you know them, or I can help identify them)
3. Your industry or niche
4. Primary keywords you're targeting

I'll analyze:
- Their top-performing content
- Keywords they rank for that you don't
- Their backlink profiles
- Content gaps and opportunities
- Traffic estimates and trends
- Social media presence

The goal is to find:
✓ Quick wins (low-hanging fruit keywords)
✓ Content topics they're missing
✓ Link building opportunities
✓ Strategy insights

What's your website URL?`,
    context: {
      workflowType: 'competitor-analysis',
      expectedSteps: ['website-identification', 'competitor-discovery', 'content-analysis', 'gap-analysis', 'recommendations']
    }
  },

  'link-building-campaign': {
    id: 'link-building-campaign',
    title: 'Link Building Campaign',
    description: 'Find quality backlink opportunities',
    initialPrompt: `I'll help you build high-quality backlinks to boost your domain authority and rankings!

To start your link building campaign, tell me:
1. Your website URL
2. Your niche/industry
3. Your target keywords
4. Have you done any link building before? If yes, what worked?

I'll help you find:
- Guest posting opportunities
- Resource page link opportunities
- Broken link building prospects
- Competitor backlink gaps
- Industry directories and listings
- Digital PR opportunities

For each opportunity, I'll provide:
- Domain authority and quality score
- Contact information
- Outreach email templates
- Success probability rating

What's your website URL and niche?`,
    context: {
      workflowType: 'link-building',
      expectedSteps: ['site-analysis', 'opportunity-discovery', 'qualification', 'outreach-prep', 'templates']
    }
  },

  'rank-on-chatgpt': {
    id: 'rank-on-chatgpt',
    title: 'Rank on ChatGPT & AI Engines',
    description: 'Optimize for AI search visibility',
    initialPrompt: `Let's optimize your content for AI search engines like ChatGPT, Perplexity, and Google SGE!

This is the future of search - being cited by AI assistants.

I need:
1. Your website URL
2. Your main topic/expertise area
3. What questions should AI assistants cite you for?

I'll analyze and optimize for:
- AI citation opportunities
- Answer Engine Optimization (AEO)
- Featured snippet optimization
- Structured data for AI understanding
- Authority and trustworthiness signals
- Content clarity and directness

You'll get:
✓ Current AI visibility assessment
✓ Optimization recommendations
✓ Content structure improvements
✓ Citation-worthy content templates
✓ Tracking and measurement strategy

What's your website URL and main expertise area?`,
    context: {
      workflowType: 'aeo-optimization',
      expectedSteps: ['visibility-check', 'content-analysis', 'optimization-plan', 'implementation-guide']
    }
  }
}

/**
 * Get workflow by ID
 */
export function getWorkflowPrompt(workflowId: string): GuidedWorkflow | null {
  return GUIDED_WORKFLOWS[workflowId] || null
}

/**
 * Get all available workflows
 */
export function getAllWorkflows(): GuidedWorkflow[] {
  return Object.values(GUIDED_WORKFLOWS)
}
