// Workflow: Local SEO Campaign
// Complete workflow for local businesses: audit, optimization, citations, and review strategy

import { Workflow } from '../types'

export const localSEOCampaignWorkflow: Workflow = {
  id: 'local-seo-campaign',
  name: 'Local SEO Campaign',
  description: 'Complete local SEO optimization workflow: presence audit, GBP optimization, citation building, and review strategy',
  icon: '📍',
  category: 'local',
  estimatedTime: '35-45 minutes',
  tags: ['Local SEO', 'Google Business Profile', 'Citations', 'Reviews', 'Local Search'],
  requiredTools: [
    'business_data_business_listings_search',
    'dataforseo_labs_google_keyword_ideas',
    'serp_organic_live_advanced',
    'upsertLocalSEOProfile',
    'generateLocalContentIdeas',
  ],
  requiredAPIs: ['dataforseo'],
  
  parameters: {
    businessName: {
      type: 'string',
      description: 'Business name',
      required: true,
      example: 'Joe\'s Plumbing Services',
    },
    businessCategory: {
      type: 'string',
      description: 'Primary business category',
      required: true,
      example: 'Plumber',
    },
    businessAddress: {
      type: 'object',
      description: 'Business address with street, city, state, zip, country',
      required: true,
      example: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'United States',
      },
    },
    businessPhone: {
      type: 'string',
      description: 'Business phone number',
      required: true,
      example: '(555) 123-4567',
    },
    businessWebsite: {
      type: 'string',
      description: 'Business website URL',
      required: false,
      example: 'https://joesplumbing.com',
    },
    servicesOffered: {
      type: 'array',
      description: 'List of services offered',
      required: true,
      example: ['Emergency plumbing', 'Drain cleaning', 'Water heater repair'],
    },
    serviceAreas: {
      type: 'array',
      description: 'Geographic service areas',
      required: true,
      example: ['San Francisco', 'Oakland', 'Berkeley'],
    },
  },

  steps: [
    // PHASE 1: LOCAL PRESENCE AUDIT
    {
      id: 'audit-gbp-analysis',
      name: 'Google Business Profile Analysis',
      description: 'Analyze current GBP listing and identify optimization opportunities',
      agent: 'research',
      parallel: true,
      tools: [
        {
          id: 'business_data_business_listings_search_3',
          name: 'business_data_business_listings_search',
          params: {
            keyword: '{{competitorName}}',
            location_name: '{{businessAddress.city}}, {{businessAddress.state}}',
            depth: 2,
          },
          required: true,
        },
        {
          id: 'dataforseo_labs_google_ranked_keywords_2',
          name: 'dataforseo_labs_google_ranked_keywords',
          params: {
            keywords: '{{localKeywords}}',
            location_name: '{{businessAddress.city}}, {{businessAddress.state}}',
            limit: 100,
          },
          required: true,
        },
      ],
      systemPrompt: `You are analyzing a Google Business Profile listing for optimization opportunities.

Review:
1. Profile completeness (name, address, phone, hours, description, photos)
2. Category selection (primary and secondary categories)
3. Business description quality and keyword usage
4. Photo quality and quantity
5. Q&A section completeness
6. Review count and average rating
7. Review response rate and quality

Identify specific gaps and optimization opportunities.`,
      outputFormat: 'json',
    },

    {
      id: 'audit-local-keyword-research',
      name: 'Local Keyword Research',
      description: 'Research local keywords relevant to the business',
      agent: 'research',
      parallel: true,
      tools: [
        {
          id: 'dataforseo_labs_google_keyword_ideas',
          name: 'dataforseo_labs_google_keyword_ideas',
          params: {
            keywords: [
              '{{businessCategory}} {{businessAddress.city}}',
              '{{businessCategory}} near me',
              'best {{businessCategory}} {{businessAddress.city}}',
              '{{businessCategory}} {{businessAddress.neighborhood}}',
            ],
            location_name: '{{businessAddress.city}}, {{businessAddress.state}}',
            limit: 100,
          },
          required: true,
        },
      ],
      systemPrompt: `You are researching local keywords for a business.

Analyze:
1. Search volume for local variations
2. Keyword difficulty for local searches
3. Intent classification (informational vs transactional)
4. Long-tail local keyword opportunities
5. Service-specific keyword variations

Create a prioritized list of local keywords to target.`,
      outputFormat: 'json',
    },

    {
      id: 'audit-local-pack-analysis',
      name: 'Local Pack Analysis',
      description: 'Analyze local pack rankings and competitor positioning',
      agent: 'research',
      parallel: false,
      dependencies: ['audit-local-keyword-research'],
      tools: [
        {
          id: 'serp_google_organic_search',
          name: 'serp_google_organic_search',
          params: {
            keyword: '{{primary_local_keyword}}',
            location_name: '{{businessAddress.city}}, {{businessAddress.state}}',
            device: 'mobile',
            analyze: ['local_pack', 'organic_results'],
          },
          required: true,
        },
      ],
      systemPrompt: `You are analyzing local pack (map pack) results for competitive positioning.

Review:
1. Current position in local pack (if ranking)
2. Competitor analysis (who's ranking and why)
3. Review count and rating comparison
4. Distance from searcher
5. Profile completeness comparison
6. SERP features (local pack, organic, maps)

Identify what's needed to improve local pack visibility.`,
      outputFormat: 'json',
    },

    {
      id: 'audit-competitor-analysis',
      name: 'Local Competitor Analysis',
      description: 'Analyze local competitors and their online presence',
      agent: 'research',
      parallel: false,
      dependencies: ['audit-local-pack-analysis'],
      tools: [
        {
          id: 'business_data_business_listings_search_4',
          name: 'business_data_business_listings_search',
          params: {
            keyword: '{{businessCategory}} {{businessAddress.city}}',
            location_name: '{{businessAddress.city}}, {{businessAddress.state}}',
            depth: 10,
          },
        },
      ],
      systemPrompt: `You are analyzing local competitors to identify competitive advantages and gaps.

Compare:
1. GBP optimization level
2. Review count and ratings
3. Citation consistency
4. Website quality
5. Content strategy
6. Service offerings

Identify opportunities to outperform competitors.`,
      outputFormat: 'json',
    },

    // PHASE 2: OPTIMIZATION
    {
      id: 'optimization-gbp-checklist',
      name: 'GBP Optimization Checklist',
      description: 'Generate comprehensive GBP optimization checklist',
      agent: 'strategy',
      parallel: false,
      dependencies: ['audit-gbp-analysis', 'audit-competitor-analysis'],
      tools: [
        {
          id: 'gbp_optimization',
          name: 'gbp_optimization',
          params: {
            businessName: '{{businessName}}',
            businessCategory: '{{businessCategory}}',
            businessAddress: '{{businessAddress}}',
            businessPhone: '{{businessPhone}}',
            businessWebsite: '{{businessWebsite}}',
            servicesOffered: '{{servicesOffered}}',
            serviceAreas: '{{serviceAreas}}',
          },
          required: true,
        },
      ],
      systemPrompt: `You are creating a comprehensive GBP optimization checklist.

Generate actionable tasks for:
1. Complete business information (name, address, phone, hours)
2. Primary & secondary category optimization
3. Business description (750 chars, keyword-rich)
4. Products/services list
5. Photo optimization (logo, cover, interior, exterior, team, work samples)
6. Q&A pre-population with common questions
7. Review response templates
8. Posts and updates strategy

Make each task specific and actionable.`,
      outputFormat: 'json',
    },

    {
      id: 'optimization-local-schema',
      name: 'Local Business Schema Generation',
      description: 'Generate LocalBusiness schema markup',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['optimization-gbp-checklist'],
      tools: [],
      systemPrompt: `You are generating LocalBusiness schema.org structured data.

Create schema markup including:
1. LocalBusiness type with appropriate subtype
2. Opening hours specification
3. Geographic coordinates
4. Area served
5. Aggregate rating and reviews
6. Price range
7. Payment accepted
8. Service area

Ensure all required fields are populated with accurate data.`,
      outputFormat: 'json',
    },

    {
      id: 'optimization-local-content',
      name: 'Local Content Generation',
      description: 'Generate local landing pages and content ideas',
      agent: 'content',
      parallel: false,
      dependencies: ['optimization-local-schema'],
      tools: [
        {
          id: 'local_content_generator',
          name: 'local_content_generator',
          params: {
            businessName: '{{businessName}}',
            businessCategory: '{{businessCategory}}',
            businessAddress: '{{businessAddress}}',
            servicesOffered: '{{servicesOffered}}',
            localKeywords: '{{localKeywords}}',
          },
          required: true,
        },
      ],
      systemPrompt: `You are generating local SEO content ideas.

Create:
1. Service-area specific landing pages
2. Local blog post ideas
3. Community-focused content
4. Local testimonials and case studies
5. Neighborhood-specific content

Each content idea should target specific local keywords and include local relevance signals.`,
      outputFormat: 'json',
    },

    // PHASE 3: CITATION BUILDING
    {
      id: 'citations-audit',
      name: 'Citation Audit',
      description: 'Audit existing citations for consistency and accuracy',
      agent: 'research',
      parallel: false,
      dependencies: ['optimization-local-content'],
      tools: [],
      systemPrompt: `You are auditing existing citations for consistency.

Check:
1. Name consistency across platforms
2. Address accuracy (NAP - Name, Address, Phone)
3. Phone number consistency
4. Website URL consistency
5. Category consistency
6. Duplicate listings
7. Incomplete profiles

Identify citation inconsistencies that need fixing.`,
      outputFormat: 'json',
    },

    {
      id: 'citations-opportunities',
      name: 'Citation Opportunities Discovery',
      description: 'Find new citation opportunities',
      agent: 'research',
      parallel: false,
      dependencies: ['citations-audit'],
      tools: [],
      systemPrompt: `You are finding citation opportunities.

Identify:
1. General directories (Yelp, Yellow Pages, BBB, Foursquare)
2. Industry-specific directories
3. Local chamber of commerce
4. City-specific directories
5. Niche directories for the business category
6. Competitor citations to match

Prioritize by:
- Domain authority
- Local relevance
- Industry authority
- Citation completeness potential`,
      outputFormat: 'json',
    },

    // PHASE 4: REVIEW STRATEGY
    {
      id: 'reviews-analysis',
      name: 'Review Analysis',
      description: 'Analyze current reviews and competitor reviews',
      agent: 'research',
      parallel: false,
      dependencies: ['citations-opportunities'],
      tools: [],
      systemPrompt: `You are analyzing review performance.

Review:
1. Current review count and average rating
2. Review sentiment analysis
3. Common keywords in reviews
4. Competitor review comparison
5. Review response rate and quality
6. Review recency

Identify:
- Review generation opportunities
- Response template needs
- Common complaints to address
- Positive themes to emphasize`,
      outputFormat: 'json',
    },

    {
      id: 'reviews-generation-strategy',
      name: 'Review Generation Strategy',
      description: 'Create review generation templates and strategy',
      agent: 'strategy',
      parallel: false,
      dependencies: ['reviews-analysis'],
      tools: [],
      systemPrompt: `You are creating a review generation strategy.

Generate:
1. Email templates for post-service review requests
2. SMS templates for review requests
3. In-person review request scripts
4. Review response templates (positive, neutral, negative)
5. Timing recommendations (when to ask)
6. Follow-up sequences

Make templates personalized, professional, and compliant with platform guidelines.`,
      outputFormat: 'json',
    },
  ],

  output: {
    type: 'structured',
    components: ['OptimizationChecklist', 'ReviewStrategy'],
  },
}
