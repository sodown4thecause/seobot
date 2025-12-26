// Workflow: Link Building Campaign
// Complete workflow for discovering prospects, preparing outreach, executing campaigns, and tracking results

import { Workflow } from '../types'

export const linkBuildingCampaignWorkflow: Workflow = {
  id: 'link-building-campaign',
  name: 'Link Building Campaign',
  description: 'End-to-end link building workflow: prospect discovery, outreach preparation, execution, and tracking',
  icon: '🔗',
  category: 'seo',
  estimatedTime: '10-15 minutes',
  tags: ['Link Building', 'Outreach', 'Backlinks', 'SEO'],
  requiredTools: [
    'n8n_backlinks',
    'dataforseo_labs_google_page_intersection',
    'firecrawl_crawl',
    'firecrawl_extract',
    'perplexity_search',
  ],
  requiredAPIs: ['firecrawl', 'perplexity', 'n8n'],
  
  parameters: {
    targetDomain: {
      type: 'string',
      description: 'Domain to build links for',
      required: true,
      example: 'example.com',
    },
    competitorDomains: {
      type: 'array',
      description: 'Competitor domains to analyze for backlink opportunities',
      required: true,
      example: ['competitor1.com', 'competitor2.com'],
    },
    targetKeywords: {
      type: 'array',
      description: 'Keywords related to content needing backlinks',
      required: false,
      example: ['seo tools', 'content marketing'],
    },
  },

  steps: [
    // PHASE 1: PROSPECT DISCOVERY
    {
      id: 'discovery-competitor-backlinks',
      name: 'Competitor Backlink Analysis',
      description: 'Analyze competitor backlinks to find link opportunities',
      agent: 'research',
      parallel: true,
      tools: [
        {
          name: 'n8n_backlinks',
          params: {
            domain: '{{competitorDomains[0]}}',
            action: 'analyze',
          },
          required: true,
        },
        {
          name: 'n8n_backlinks',
          params: {
            domain: '{{competitorDomains[1]}}',
            action: 'analyze',
          },
        },
      ],
      systemPrompt: `You are analyzing competitor backlinks to identify link building opportunities.

For each competitor, identify:
1. High-quality referring domains
2. Content types that get linked (blog posts, guides, resources)
3. Anchor text patterns
4. Link context and placement
5. Domain authority of linking sites

Create a list of potential link prospects based on competitor analysis.`,
      outputFormat: 'json',
    },

    {
      id: 'discovery-content-intersection',
      name: 'Content Intersection Analysis',
      description: 'Find pages that link to competitors but not to target domain',
      agent: 'research',
      parallel: false,
      dependencies: ['discovery-competitor-backlinks'],
      tools: [
        {
          name: 'dataforseo_labs_google_page_intersection',
          params: {
            targets: '{{competitorDomains}}',
            location_name: 'United States',
            limit: 100,
          },
          required: true,
        },
      ],
      systemPrompt: `You are finding pages that link to competitors but not to the target domain.

This identifies:
1. Pages that could potentially link to target domain
2. Content gaps where target domain should be mentioned
3. Resource pages that list competitors but not target domain

Prioritize prospects by:
- Domain authority
- Relevance to target keywords
- Content quality
- Link context`,
      outputFormat: 'json',
    },

    {
      id: 'discovery-broken-links',
      name: 'Broken Link Discovery',
      description: 'Find broken links on relevant pages that could be replaced',
      agent: 'research',
      parallel: false,
      dependencies: ['discovery-content-intersection'],
      tools: [
        {
          name: 'firecrawl_crawl',
          params: {
            url: '{{prospect_url}}',
            limit: 10,
            scrapeOptions: {
              formats: ['links'],
            },
          },
        },
      ],
      systemPrompt: `You are finding broken links on prospect pages that could be replaced with target domain links.

Identify:
1. Broken external links (404 errors)
2. Outdated resource links
3. Links to removed/deleted content
4. Opportunities to suggest replacement links

This is a powerful link building tactic - offering to replace broken links.`,
      outputFormat: 'json',
    },

    // PHASE 2: OUTREACH PREPARATION
    {
      id: 'preparation-contact-discovery',
      name: 'Contact Discovery',
      description: 'Extract contact information from prospect pages',
      agent: 'research',
      parallel: true,
      dependencies: ['discovery-broken-links'],
      tools: [
        {
          name: 'firecrawl_extract',
          params: {
            url: '{{prospect_url_1}}',
            extractionSchema: {
              contacts: {
                emails: 'array',
                names: 'array',
                social: 'object',
              },
            },
          },
        },
        {
          name: 'firecrawl_extract',
          params: {
            url: '{{prospect_url_2}}',
            extractionSchema: {
              contacts: {
                emails: 'array',
                names: 'array',
                social: 'object',
              },
            },
          },
        },
      ],
      systemPrompt: `You are extracting contact information from prospect pages.

Extract:
1. Email addresses (contact, author, editor)
2. Names of content creators/editors
3. Social media profiles
4. Contact forms or pages
5. Author bio information

This information will be used for personalized outreach.`,
      outputFormat: 'json',
    },

    {
      id: 'preparation-personalization-research',
      name: 'Personalization Research',
      description: 'Research prospects for personalized outreach',
      agent: 'research',
      parallel: false,
      dependencies: ['preparation-contact-discovery'],
      tools: [
        {
          name: 'perplexity_search',
          params: {
            query: 'Recent content and interests of {{prospect_name}} at {{prospect_domain}}',
            search_recency_filter: 'month',
          },
        },
      ],
      systemPrompt: `You are researching prospects to personalize outreach emails.

Gather:
1. Recent content they've published
2. Topics they're interested in
3. Their writing style and preferences
4. Recent achievements or mentions
5. Common ground with target domain

This research enables highly personalized, effective outreach.`,
      outputFormat: 'json',
    },

    {
      id: 'preparation-pitch-generation',
      name: 'Pitch Template Generation',
      description: 'Generate personalized pitch templates for each prospect',
      agent: 'strategy',
      parallel: false,
      dependencies: ['preparation-personalization-research'],
      tools: [],
      systemPrompt: `You are creating personalized pitch templates for link building outreach.

For each prospect, create a pitch that:
1. References their recent content or interests
2. Explains why target domain content is relevant
3. Offers value (resource, broken link replacement, etc.)
4. Is concise and respectful
5. Includes a clear call-to-action

Make each pitch unique and personalized - avoid generic templates.`,
      outputFormat: 'component',
      componentType: 'OutreachPitches',
    },

    // PHASE 3: OUTREACH EXECUTION
    {
      id: 'execution-email-preparation',
      name: 'Email Template Preparation',
      description: 'Prepare final email templates with personalization',
      agent: 'content',
      parallel: false,
      dependencies: ['preparation-pitch-generation'],
      tools: [],
      systemPrompt: `You are preparing final email templates for outreach.

Ensure each email:
1. Has personalized subject line
2. Includes personalized opening
3. Clearly states the value proposition
4. Has a soft, non-spammy call-to-action
5. Includes signature with contact info
6. Follows email best practices (length, formatting)

Prepare emails ready to send via email service.`,
      outputFormat: 'json',
    },

    {
      id: 'execution-followup-sequence',
      name: 'Follow-up Sequence Setup',
      description: 'Create follow-up email sequence for non-responders',
      agent: 'strategy',
      parallel: false,
      dependencies: ['execution-email-preparation'],
      tools: [],
      systemPrompt: `You are creating a follow-up email sequence for link building outreach.

Create 2-3 follow-up emails:
1. First follow-up (5-7 days): Gentle reminder
2. Second follow-up (10-14 days): Additional value or angle
3. Final follow-up (20+ days): Last attempt, very soft

Each follow-up should:
- Add new value or angle
- Not be pushy or spammy
- Respect their time
- Make it easy to respond or opt-out`,
      outputFormat: 'json',
    },

    {
      id: 'execution-scheduling',
      name: 'Outreach Scheduling',
      description: 'Schedule emails and follow-ups for optimal timing',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['execution-followup-sequence'],
      tools: [],
      systemPrompt: `You are scheduling outreach emails for optimal timing.

Schedule considerations:
1. Best days: Tuesday-Thursday
2. Best times: 9-11 AM or 2-4 PM (recipient's timezone)
3. Space out emails to avoid spam patterns
4. Consider timezone differences
5. Avoid holidays and weekends

Create a schedule for initial emails and follow-ups.`,
      outputFormat: 'json',
    },

    // PHASE 4: CAMPAIGN TRACKING
    {
      id: 'tracking-response-monitoring',
      name: 'Response Monitoring Setup',
      description: 'Set up system to monitor email responses',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['execution-scheduling'],
      tools: [],
      systemPrompt: `You are setting up response monitoring for the link building campaign.

Create a tracking system that monitors:
1. Email opens and clicks
2. Response rates
3. Positive responses (agreed to link)
4. Negative responses (declined)
5. No responses (need follow-up)

Set up alerts for:
- High-value prospect responses
- Unusual response patterns
- Campaign milestones`,
      outputFormat: 'json',
    },

    {
      id: 'tracking-backlink-detection',
      name: 'Backlink Detection Setup',
      description: 'Set up automated backlink detection for new links',
      agent: 'research',
      parallel: false,
      dependencies: ['tracking-response-monitoring'],
      tools: [
        {
          name: 'n8n_backlinks',
          params: {
            domain: '{{targetDomain}}',
            action: 'monitor',
            checkInterval: 'weekly',
          },
        },
      ],
      systemPrompt: `You are setting up automated backlink detection.

Configure monitoring to:
1. Check for new backlinks weekly
2. Verify link quality and context
3. Track anchor text used
4. Monitor link health (no-follow, removed, etc.)
5. Alert on new high-quality links

This enables tracking campaign success and identifying which outreach worked.`,
      outputFormat: 'component',
      componentType: 'BacklinkTracking',
    },
  ],

  output: {
    type: 'structured',
    components: ['OutreachPitches', 'BacklinkTracking'],
  },
}

