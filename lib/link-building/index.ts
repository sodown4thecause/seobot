/**
 * Link Building Module
 * 
 * Comprehensive link building tools including:
 * - Prospect discovery (competitor intersection, unlinked mentions, broken links, etc.)
 * - Outreach email generation with personalization
 * - Campaign management and tracking
 */

// Export types
export type {
  LinkOpportunityType,
  ProspectStatus,
  OutreachEmailType,
  LinkProspect,
  LinkProspectFinderParams,
  IntersectionOpportunity,
  UnlinkedMention,
  BrokenLinkOpportunity,
  GuestPostOpportunity,
  ResourcePageOpportunity,
  LinkProspectResults,
  OutreachEmail,
  OutreachEmailParams,
  EmailPersonalization,
  LinkCampaign,
  LinkMetrics
} from './types'

// Export prospect finder
export { LinkProspectFinder } from './prospect-finder'

// Export outreach generator
export { OutreachEmailGenerator, outreachEmailGenerator } from './outreach-generator'

// Re-import for default export
import { LinkProspectFinder } from './prospect-finder'
import { OutreachEmailGenerator, outreachEmailGenerator } from './outreach-generator'

// Default export with convenience instances
export default {
  LinkProspectFinder,
  OutreachEmailGenerator,
  outreachEmailGenerator
}
