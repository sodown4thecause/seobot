/**
 * Link Building Fundamentals Tutorial
 * Beginner tutorial covering outreach, prospecting, and link building strategies
 */

import type { Tutorial } from '../types'

export const linkBuildingFundamentalsTutorial: Tutorial = {
  id: 'link-building-fundamentals',
  title: 'Link Building Fundamentals: Getting Quality Backlinks',
  description: 'Learn how to find link opportunities, craft outreach emails, and build quality backlinks',
  difficulty: 'intermediate',
  estimatedTime: '25 minutes',
  prerequisites: ['seo-fundamentals-101'],
  enabled: true,
  linkedWorkflow: 'link-building-campaign',
  outcomes: [
    {
      concept: 'Link Building',
      skillGained: 'Understanding how backlinks improve domain authority and rankings',
      realWorldApplication: 'Build a strategy to earn quality backlinks that boost your search rankings'
    },
    {
      concept: 'Outreach',
      skillGained: 'Crafting personalized outreach emails that get responses',
      realWorldApplication: 'Successfully reach out to website owners and earn backlinks'
    },
    {
      concept: 'Link Prospecting',
      skillGained: 'Finding websites that are likely to link to your content',
      realWorldApplication: 'Identify high-quality link opportunities efficiently'
    }
  ],
  steps: [
    {
      id: 'why-links-matter',
      title: 'Why Backlinks Matter',
      content: `Backlinks are links from other websites to yours. They're like votes of confidence.

**How backlinks help:**
1. **Domain Authority** - More quality links = higher domain authority
2. **Rankings** - Pages with more backlinks tend to rank higher
3. **Traffic** - Links bring referral traffic from other sites
4. **Trust Signals** - Search engines see links as endorsements

**Quality over Quantity:**
- 1 link from a high-authority site > 100 links from low-quality sites
- Relevance matters - links from related sites are more valuable
- Natural links from great content perform best

Remember: Focus on earning links, not buying them. Google penalizes manipulative link building.`,
      action: 'EXPLAIN',
      interactive: {
        question: 'What makes a backlink "high quality"?',
        options: [
          'It comes from a high-authority domain',
          'It\'s from a relevant, related website',
          'The linking page has good traffic',
          'All of the above'
        ],
        correct: 'All of the above',
        explanation: 'High-quality backlinks combine domain authority, relevance, and traffic. A link from a relevant, high-authority site with good traffic is ideal.'
      },
      estimatedTime: '5 minutes'
    },
    {
      id: 'finding-link-prospects',
      title: 'Finding Link Opportunities',
      content: `There are several ways to find websites that might link to you:

**1. Competitor Backlink Analysis**
- See where your competitors get links
- Use FlowIntent's link building workflow to analyze competitor backlinks
- Target the same sites (if relevant)

**2. Broken Link Building**
- Find broken links on relevant sites
- Offer your content as a replacement
- This provides value to the site owner

**3. Resource Page Links**
- Find "Resources" or "Links" pages in your niche
- These pages exist to link to useful content
- If your content fits, reach out

**4. Unlinked Mentions**
- Find places that mention your brand but don't link
- Reach out and ask for a link
- Easy win since they already know you

Let's use FlowIntent's link building tools to find prospects.`,
      action: 'TOOL_DEMO',
      tool: 'link-building-campaign',
      highlightParams: ['targetDomain', 'competitorDomains'],
      liveDemo: true,
      estimatedTime: '7 minutes'
    },
    {
      id: 'crafting-outreach',
      title: 'Crafting Effective Outreach Emails',
      content: `Your outreach email determines whether you get a response. Here's how to write effective emails:

**Subject Line Best Practices:**
- Be specific and relevant
- Mention their site or content
- Avoid spammy words ("free", "guaranteed", etc.)
- Example: "Quick fix for broken link on your [Topic] guide"

**Email Structure:**
1. **Personalized Opening** - Reference their content specifically
2. **Value Proposition** - Explain what's in it for them
3. **Clear Ask** - Be direct about what you want
4. **Easy Next Steps** - Make it simple to say yes

**Common Mistakes:**
- Generic templates without personalization
- Asking for too much (link + guest post + social share)
- Not explaining why your content is valuable
- Being pushy or demanding

**Example Good Email:**
"Hi [Name],

I was reading your excellent guide on [Topic] and noticed the link to [Resource] appears to be broken.

Since you were linking to content about [Topic], I thought you might find my guide helpful as a replacement: [Your URL] - [Brief description]

Either way, wanted to give you a heads up about the broken link!

Best,
[Your Name]"`,
      action: 'PRACTICE',
      estimatedTime: '8 minutes'
    },
    {
      id: 'following-up',
      title: 'Following Up Effectively',
      content: `Most people don't respond to the first email. Follow-ups are essential.

**Follow-up Timing:**
- First follow-up: 3-5 days after initial email
- Second follow-up: 7-10 days after first follow-up
- Final follow-up: 2 weeks after second (if still interested)

**Follow-up Best Practices:**
- Keep it brief - just a gentle reminder
- Add new value if possible (updated content, new angle)
- Don't be pushy - respect their time
- If no response after 3 attempts, move on

**When to Stop:**
- They explicitly say no
- They ask to be removed from your list
- No response after 3 follow-ups
- The opportunity is no longer relevant

Remember: Link building is a numbers game. Not everyone will respond, but consistent outreach leads to quality links.`,
      action: 'REVIEW',
      estimatedTime: '5 minutes'
    }
  ]
}
