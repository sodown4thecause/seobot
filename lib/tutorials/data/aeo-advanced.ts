/**
 * AEO Advanced Tutorial
 * Advanced tutorial covering AI citation optimization and AEO strategies
 */

import type { Tutorial } from '../types'

export const aeoAdvancedTutorial: Tutorial = {
  id: 'aeo-advanced',
  title: 'AEO Advanced: Getting Cited by AI Search Engines',
  description: 'Learn advanced strategies for optimizing content to be cited by ChatGPT, Perplexity, and other AI search engines',
  difficulty: 'advanced',
  estimatedTime: '30 minutes',
  prerequisites: ['seo-fundamentals-101', 'content-optimization-101'],
  enabled: true,
  linkedWorkflow: 'rank-on-chatgpt',
  outcomes: [
    {
      concept: 'AI Search Optimization',
      skillGained: 'Understanding how AI search engines find and cite content',
      realWorldApplication: 'Get your content cited by ChatGPT, Perplexity, and other AI tools'
    },
    {
      concept: 'Citation Signals',
      skillGained: 'Optimizing content structure and signals for AI citation',
      realWorldApplication: 'Increase chances of being cited in AI responses'
    },
    {
      concept: 'AEO Strategy',
      skillGained: 'Building a comprehensive AEO (AI Engine Optimization) strategy',
      realWorldApplication: 'Capture traffic from AI search engines alongside traditional SEO'
    }
  ],
  steps: [
    {
      id: 'understanding-ai-search',
      title: 'How AI Search Engines Work',
      content: `AI search engines like ChatGPT and Perplexity work differently than Google.

**Key Differences:**
- AI engines synthesize information from multiple sources
- They cite sources directly in responses
- They prioritize authoritative, well-structured content
- They value comprehensive, accurate information

**How AI Finds Content:**
1. **Crawling** - Similar to Google, but focused on high-quality sources
2. **Indexing** - Building knowledge graphs of information
3. **Retrieval** - Finding relevant content when answering queries
4. **Synthesis** - Combining information from multiple sources
5. **Citation** - Attributing information to sources

**What AI Values:**
- Authoritative sources (high domain authority)
- Well-structured content (clear headings, lists)
- Comprehensive coverage of topics
- Accurate, up-to-date information
- Proper citations and references

Understanding this helps you optimize for AI citation.`,
      action: 'EXPLAIN',
      interactive: {
        question: 'What do AI search engines prioritize when selecting content to cite?',
        options: [
          'High keyword density',
          'Authoritative sources with well-structured content',
          'Content with the most backlinks',
          'Content with the highest search volume'
        ],
        correct: 'Authoritative sources with well-structured content',
        explanation: 'AI search engines prioritize authoritative sources with clear structure, comprehensive information, and proper citations. They value quality and accuracy over traditional SEO metrics.'
      },
      estimatedTime: '6 minutes'
    },
    {
      id: 'optimizing-for-citations',
      title: 'Optimizing Content for AI Citations',
      content: `To get cited by AI engines, optimize your content structure and signals.

**Content Structure for AI:**
1. **Clear Headings** - Use descriptive H2/H3 headings
   - AI engines parse headings to understand structure
   - Example: "How to [Action]" instead of "Section 1"

2. **Lists and Tables** - Use structured data formats
   - Bullet points for easy parsing
   - Tables for comparisons
   - Numbered lists for processes

3. **Direct Answers** - Answer questions clearly
   - Put answers near the top
   - Use concise, factual statements
   - Format: Question → Answer → Explanation

4. **Citations and Sources** - Cite authoritative sources
   - Link to research studies
   - Reference statistics with sources
   - Show where information comes from

**EEAT Signals for AI:**
- **Author Bio** - Clear author credentials
- **Publication Date** - Show content freshness
- **Update History** - Show when content was last updated
- **Expertise Indicators** - Certifications, credentials, experience

**Technical Optimization:**
- Schema markup (Article, FAQPage, HowTo)
- Proper HTML structure
- Semantic HTML elements
- Clean, crawlable code

Let's use FlowIntent's AEO optimization workflow to improve your content.`,
      action: 'TOOL_DEMO',
      tool: 'rank-on-chatgpt',
      highlightParams: ['content', 'targetKeywords'],
      liveDemo: true,
      estimatedTime: '8 minutes'
    },
    {
      id: 'ai-search-volume',
      title: 'Understanding AI Search Volume',
      content: `AI search volume is different from traditional search volume.

**AI Search Volume Metrics:**
- **ChatGPT Volume** - How often keyword is used in ChatGPT queries
- **Perplexity Volume** - How often keyword is used in Perplexity
- **Total AI Volume** - Combined volume across AI platforms

**Why It Matters:**
- Some keywords have high AI volume but low traditional volume
- AI-first keywords represent new opportunities
- Optimizing for AI can capture early traffic

**AI Opportunity Score:**
- Combines AI volume, traditional volume, and citation potential
- High score (70+) = prioritize AEO optimization
- Medium score (50-70) = hybrid SEO/AEO approach
- Low score (<50) = focus on traditional SEO

**Finding AI Opportunities:**
- Use FlowIntent's AI search volume tool
- Compare AI vs traditional search volume
- Identify keywords with high AI/Traditional ratio
- Focus on informational queries (AI handles these well)

**Content Strategy:**
- Create comprehensive guides for high AI-volume keywords
- Structure content for easy AI parsing
- Include direct answers to common questions
- Build authority in your niche

Let's analyze AI search volume for your keywords.`,
      action: 'PRACTICE',
      estimatedTime: '8 minutes'
    },
    {
      id: 'building-authority',
      title: 'Building Authority for AI Citation',
      content: `Authority is crucial for AI citation. Here's how to build it:

**Domain Authority Signals:**
1. **Backlinks** - Quality links from authoritative sites
2. **Mentions** - Brand mentions across the web
3. **Social Signals** - Shares, engagement on social media
4. **Content Quality** - Comprehensive, accurate content

**Author Authority:**
- Build author profiles with credentials
- Get cited by other sites
- Publish on authoritative platforms
- Build a following and expertise

**Content Authority:**
- Create comprehensive, in-depth content
- Be the definitive source on topics
- Update content regularly
- Get cited by other content creators

**Technical Authority:**
- Fast, reliable website
- Proper security (HTTPS)
- Mobile-friendly design
- Good user experience

**Building Authority Takes Time:**
- Consistently publish quality content
- Build relationships in your industry
- Get mentioned and cited by others
- Establish yourself as an expert

**Measuring Authority:**
- Domain Authority (DA) score
- Citation count
- Backlink quality
- Social mentions
- AI citation frequency

Remember: Authority is earned, not bought. Focus on creating valuable content that others want to cite.`,
      action: 'REVIEW',
      estimatedTime: '8 minutes'
    }
  ]
}
