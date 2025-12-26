/**
 * Local SEO Guide Tutorial
 * Beginner tutorial covering GBP optimization, citations, and local search
 */

import type { Tutorial } from '../types'

export const localSEOGuideTutorial: Tutorial = {
  id: 'local-seo-guide',
  title: 'Local SEO Guide: Dominate Local Search',
  description: 'Learn how to optimize your Google Business Profile, build citations, and rank in local search',
  difficulty: 'beginner',
  estimatedTime: '30 minutes',
  prerequisites: ['seo-fundamentals-101'],
  enabled: true,
  linkedWorkflow: 'local-seo-campaign',
  outcomes: [
    {
      concept: 'Google Business Profile',
      skillGained: 'Optimizing your GBP listing for maximum visibility in local search',
      realWorldApplication: 'Appear in local pack results when customers search for your services'
    },
    {
      concept: 'Local Citations',
      skillGained: 'Building consistent citations across directories and platforms',
      realWorldApplication: 'Improve local search rankings through consistent NAP (Name, Address, Phone) data'
    },
    {
      concept: 'Local Keywords',
      skillGained: 'Targeting location-based keywords that drive local traffic',
      realWorldApplication: 'Rank for searches like "[service] near me" and "[service] [city]"'
    }
  ],
  steps: [
    {
      id: 'understanding-local-seo',
      title: 'What is Local SEO?',
      content: `Local SEO helps businesses appear in local search results and the "local pack" (map results).

**Why Local SEO Matters:**
- 46% of Google searches are local
- "Near me" searches have grown 500%+ in recent years
- Local pack results get 44% of clicks
- Most local searches lead to a visit or call

**Key Components:**
1. **Google Business Profile (GBP)** - Your free business listing
2. **Citations** - Business listings on directories (Yelp, Yellow Pages, etc.)
3. **Local Content** - Location-specific pages and content
4. **Reviews** - Customer reviews and ratings
5. **NAP Consistency** - Name, Address, Phone consistency across platforms

If you have a physical location or serve a specific area, local SEO is essential.`,
      action: 'EXPLAIN',
      interactive: {
        question: 'What percentage of clicks do local pack results receive?',
        options: ['22%', '33%', '44%', '55%'],
        correct: '44%',
        explanation: 'Local pack results (the map results with 3 businesses) receive 44% of clicks for local searches. This is why optimizing your GBP is so important.'
      },
      estimatedTime: '5 minutes'
    },
    {
      id: 'optimizing-gbp',
      title: 'Optimizing Your Google Business Profile',
      content: `Your Google Business Profile is the foundation of local SEO.

**Complete Your Profile:**
1. **Business Information** - Name, address, phone (NAP)
2. **Categories** - Primary and secondary categories
3. **Hours** - Accurate business hours
4. **Description** - 750-character keyword-rich description
5. **Photos** - Logo, cover photo, interior, exterior, team photos
6. **Products/Services** - List all offerings
7. **Attributes** - Features like "Wheelchair accessible", "Outdoor seating"

**Optimization Tips:**
- Use local keywords naturally in description
- Add photos regularly (Google favors active profiles)
- Respond to all reviews (good and bad)
- Post updates regularly (events, offers, news)
- Add Q&A section with common questions

Let's use FlowIntent's local SEO workflow to optimize your GBP.`,
      action: 'TOOL_DEMO',
      tool: 'local-seo-campaign',
      highlightParams: ['businessName', 'businessAddress', 'businessCategory'],
      liveDemo: true,
      estimatedTime: '8 minutes'
    },
    {
      id: 'building-citations',
      title: 'Building Local Citations',
      content: `Citations are mentions of your business name, address, and phone (NAP) on other websites.

**Why Citations Matter:**
- Help Google verify your business location
- Improve local search rankings
- Increase online visibility
- Build trust with search engines

**Citation Sources:**
1. **General Directories** - Yelp, Yellow Pages, BBB, Foursquare
2. **Industry-Specific** - Directories for your industry
3. **Local Directories** - City/regional business directories
4. **Social Platforms** - Facebook, LinkedIn business pages

**Citation Best Practices:**
- **Consistency** - Use exact same NAP everywhere
- **Completeness** - Fill out all available fields
- **Accuracy** - Double-check all information
- **Relevance** - Focus on directories your customers use

**Common Mistakes:**
- Inconsistent business name (e.g., "Joe's Plumbing" vs "Joes Plumbing")
- Different phone number formats
- Missing or incorrect address
- Incomplete profiles

Use FlowIntent to audit your citations and find new opportunities.`,
      action: 'PRACTICE',
      estimatedTime: '8 minutes'
    },
    {
      id: 'managing-reviews',
      title: 'Managing Reviews & Reputation',
      content: `Reviews are crucial for local SEO and customer trust.

**Review Impact:**
- Higher ratings = better local pack rankings
- More reviews = more trust signals
- Review responses show engagement
- Review keywords help with local SEO

**Getting More Reviews:**
1. **Ask at the Right Time** - Right after a positive interaction
2. **Make it Easy** - Send direct links to review pages
3. **Follow Up** - Send reminder emails/SMS
4. **Incentivize** - Offer small discounts for reviews (but don't pay for reviews)

**Responding to Reviews:**
- **Positive Reviews** - Thank them, mention specific details
- **Negative Reviews** - Apologize, offer to fix the issue, take conversation offline
- **All Reviews** - Respond within 24-48 hours
- **Be Professional** - Even if review is unfair, stay professional

**Review Response Templates:**
- Positive: "Thank you [Name]! We're thrilled you had a great experience. We appreciate your business!"
- Negative: "Hi [Name], we're sorry to hear about your experience. We'd like to make this right. Please contact us at [phone/email]."

Remember: Reviews are public. Every response reflects on your business.`,
      action: 'REVIEW',
      estimatedTime: '9 minutes'
    }
  ]
}
