/**
 * Link Building Types
 * Types for link prospecting, outreach, and campaign management
 */

export type LinkOpportunityType = 
  | 'guest_post' 
  | 'resource_page' 
  | 'broken_link' 
  | 'unlinked_mention' 
  | 'competitor_link'
  | 'digital_pr'
  | 'expert_roundup'
  | 'skyscraper'

export type ProspectStatus = 
  | 'discovered' 
  | 'researching' 
  | 'qualified' 
  | 'outreach_sent' 
  | 'follow_up' 
  | 'negotiating' 
  | 'won' 
  | 'lost' 
  | 'not_interested'

export type OutreachEmailType = 
  | 'guest_post_pitch' 
  | 'resource_link_pitch' 
  | 'broken_link_pitch' 
  | 'unlinked_mention_pitch'
  | 'expert_roundup_pitch'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'final_follow_up'

export interface LinkProspect {
  id: string
  domain: string
  url: string
  title?: string
  
  // Quality metrics
  domainAuthority: number
  pageAuthority?: number
  domainRank?: number
  spamScore?: number
  
  // Relevance
  relevanceScore: number
  topicMatch: string[]
  
  // Opportunity details
  opportunityType: LinkOpportunityType
  reason: string
  
  // Contact info
  contactEmail?: string
  contactName?: string
  contactRole?: string
  socialProfiles?: {
    twitter?: string
    linkedin?: string
  }
  
  // Status tracking
  status: ProspectStatus
  score: number // Combined opportunity score
  
  // Metadata
  discoveredAt: Date
  lastUpdated: Date
  notes?: string
}

export interface LinkProspectFinderParams {
  yourDomain: string
  competitorDomains?: string[]
  niche?: string
  keywords?: string[]
  brandName?: string
  location?: string
  minDomainRank?: number
  maxResults?: number
}

export interface IntersectionOpportunity {
  domain: string
  url: string
  linksToCompetitors: number
  competitorDomains: string[]
  domainAuthority: number
  relevanceScore: number
}

export interface UnlinkedMention {
  domain: string
  url: string
  title: string
  snippet: string
  mentionContext: string
  domainAuthority: number
  publishedDate?: string
}

export interface BrokenLinkOpportunity {
  sourceDomain: string
  sourceUrl: string
  brokenUrl: string
  anchorText: string
  suggestedReplacement?: string
  domainAuthority: number
}

export interface GuestPostOpportunity {
  domain: string
  submissionUrl: string
  guidelines?: string
  domainAuthority: number
  topics: string[]
  acceptanceRate?: 'high' | 'medium' | 'low'
  responseTime?: string
}

export interface ResourcePageOpportunity {
  domain: string
  url: string
  pageTitle: string
  existingLinks: number
  relevantCategories: string[]
  domainAuthority: number
  lastUpdated?: string
}

export interface LinkProspectResults {
  intersectionOpportunities: IntersectionOpportunity[]
  unlinkedMentions: UnlinkedMention[]
  brokenLinkOpportunities: BrokenLinkOpportunity[]
  guestPostOpportunities: GuestPostOpportunity[]
  resourcePageOpportunities: ResourcePageOpportunity[]
  
  summary: {
    totalProspects: number
    byType: Record<LinkOpportunityType, number>
    averageDomainAuthority: number
    topOpportunities: LinkProspect[]
  }
}

export interface OutreachEmail {
  id: string
  type: OutreachEmailType
  subject: string
  body: string
  personalization: {
    prospectName?: string
    siteName: string
    recentArticle?: string
    specificValue: string
  }
  followUpSequence?: OutreachEmail[]
  templateVariables: Record<string, string>
}

export interface OutreachEmailParams {
  prospectInfo: {
    siteUrl: string
    siteName: string
    contactName?: string
    recentContent?: string[]
    siteTopics?: string[]
  }
  opportunityType: OutreachEmailType
  yourAsset: {
    url: string
    title: string
    description?: string
    uniqueValue?: string
  }
  brandVoice?: {
    tone: 'professional' | 'friendly' | 'casual'
    companyName: string
    senderName: string
    senderTitle?: string
  }
}

// Additional fields for template personalization
export interface EmailPersonalization {
  prospectName: string
  siteName: string
  yourName: string
  yourTitle: string
  yourCompany: string
  yourUrl: string
  yourDescription?: string
  specificValue?: string
  recentArticle?: string
  recentTopics?: string[]
  yourTone: string
  todayDate: string
  topic?: string
  mentionContext?: string
  pageWithBrokenLink?: string
  brokenUrl?: string
  previousSubject?: string
}


export interface LinkCampaign {
  id: string
  name: string
  targetDomain: string
  targetKeywords: string[]
  
  prospects: LinkProspect[]
  
  metrics: {
    totalProspects: number
    outreachSent: number
    responses: number
    linksEarned: number
    responseRate: number
    conversionRate: number
  }
  
  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface LinkMetrics {
  totalBacklinks: number
  referringDomains: number
  domainAuthority: number
  backlinksGrowth: number
  domainsGrowth: number
  daGrowth: number
  linksThisMonth: number
  monthlyTarget: number
}
