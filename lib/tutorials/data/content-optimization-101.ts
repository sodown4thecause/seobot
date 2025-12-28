/**
 * Content Optimization 101 Tutorial
 * Beginner tutorial covering EEAT, keyword placement, and content best practices
 */

import type { Tutorial } from '../types'

export const contentOptimization101Tutorial: Tutorial = {
  id: 'content-optimization-101',
  title: 'Content Optimization 101: Writing for Rankings',
  description: 'Learn how to optimize content for search engines while maintaining quality and EEAT signals',
  difficulty: 'beginner',
  estimatedTime: '25 minutes',
  prerequisites: ['seo-fundamentals-101'],
  enabled: true,
  linkedWorkflow: 'ranking-campaign',
  outcomes: [
    {
      concept: 'EEAT',
      skillGained: 'Understanding Experience, Expertise, Authoritativeness, and Trustworthiness signals',
      realWorldApplication: 'Create content that demonstrates expertise and builds trust with readers and search engines'
    },
    {
      concept: 'Keyword Optimization',
      skillGained: 'Placing keywords naturally throughout content for optimal SEO',
      realWorldApplication: 'Rank higher by optimizing keyword placement without keyword stuffing'
    },
    {
      concept: 'Content Structure',
      skillGained: 'Organizing content with proper headings, formatting, and structure',
      realWorldApplication: 'Create scannable, well-structured content that ranks well and engages readers'
    }
  ],
  steps: [
    {
      id: 'understanding-eeat',
      title: 'Understanding EEAT Signals',
      content: `EEAT stands for Experience, Expertise, Authoritativeness, and Trustworthiness.

**Experience** - First-hand experience with the topic
- Share personal stories and case studies
- Include "I've tried this" or "In my experience" statements
- Show real results and outcomes

**Expertise** - Demonstrated knowledge and skills
- Show credentials, certifications, or qualifications
- Provide detailed, accurate information
- Cite authoritative sources

**Authoritativeness** - Recognition as an authority
- Get mentioned or cited by other sites
- Build backlinks from authoritative sources
- Establish yourself as a thought leader

**Trustworthiness** - Reliability and accuracy
- Use accurate information and cite sources
- Be transparent about affiliations
- Show contact information and credentials
- Fix errors promptly

Google uses EEAT to evaluate content quality, especially for YMYL (Your Money Your Life) topics.`,
      action: 'EXPLAIN',
      interactive: {
        question: 'Which of these demonstrates Experience in content?',
        options: [
          'Citing statistics from a research study',
          'Sharing a personal case study with real results',
          'Listing credentials and certifications',
          'Getting backlinks from other sites'
        ],
        correct: 'Sharing a personal case study with real results',
        explanation: 'Experience is about first-hand knowledge. Sharing personal case studies with real results demonstrates you\'ve actually done what you\'re writing about.'
      },
      estimatedTime: '6 minutes'
    },
    {
      id: 'keyword-placement',
      title: 'Natural Keyword Placement',
      content: `Keywords should appear naturally throughout your content, not forced.

**Keyword Placement Guidelines:**

1. **Title Tag** - Include primary keyword near the beginning
   - Example: "Best SEO Tools 2024: Complete Guide"

2. **H1 Heading** - Use primary keyword in main heading
   - Example: "Best SEO Tools for Small Businesses"

3. **First Paragraph** - Mention primary keyword naturally in first 100 words
   - Don't force it - write naturally

4. **H2/H3 Headings** - Use related keywords in subheadings
   - Example: "How to Choose SEO Tools" (uses related keyword)

5. **Body Content** - Use keyword 3-5 times naturally throughout
   - Include variations and synonyms
   - Don't keyword stuff

6. **Alt Text** - Include keywords in image alt text
   - Example: "SEO tools dashboard screenshot"

**Keyword Density:**
- Aim for 1-2% keyword density
- Too high = keyword stuffing (penalized)
- Too low = may not rank for target keyword
- Focus on natural usage over exact match

**Related Keywords:**
- Use semantic keywords (related terms)
- Include LSI (Latent Semantic Indexing) keywords
- Use synonyms and variations

Let's optimize a piece of content together.`,
      action: 'PRACTICE',
      estimatedTime: '7 minutes'
    },
    {
      id: 'content-structure',
      title: 'Content Structure Best Practices',
      content: `Well-structured content ranks better and engages readers.

**Content Structure Elements:**

1. **Headings Hierarchy**
   - H1: Main title (one per page)
   - H2: Major sections
   - H3: Subsections
   - Use descriptive headings that include keywords

2. **Paragraphs**
   - Keep paragraphs short (2-4 sentences)
   - Use white space for readability
   - One idea per paragraph

3. **Lists**
   - Use bullet points for scannability
   - Numbered lists for step-by-step processes
   - Lists help with featured snippets

4. **Internal Links**
   - Link to related content on your site
   - Use descriptive anchor text
   - Help users and search engines navigate

5. **Images**
   - Include relevant images
   - Optimize file names and alt text
   - Use proper image formats (WebP, optimized)

**Content Length:**
- Aim for comprehensive content (2000+ words for competitive topics)
- Longer content often ranks better
- But quality > quantity - don't pad with fluff

**Featured Snippet Optimization:**
- Answer questions directly
- Use lists and tables
- Keep answers concise (40-60 words)
- Structure content to match snippet formats

Good structure = better rankings + better user experience.`,
      action: 'EXPLAIN',
      estimatedTime: '7 minutes'
    },
    {
      id: 'optimizing-existing-content',
      title: 'Optimizing Existing Content',
      content: `You don't always need to create new content - optimize what you have.

**Content Audit Process:**

1. **Identify Underperforming Pages**
   - Pages with low traffic
   - Pages ranking on page 2-3 (close to page 1)
   - Pages with high bounce rates

2. **Update Content**
   - Refresh outdated information
   - Add new sections or examples
   - Improve keyword optimization
   - Update statistics and data

3. **Improve Structure**
   - Add better headings
   - Break up long paragraphs
   - Add images and visual elements
   - Improve internal linking

4. **Enhance EEAT Signals**
   - Add author bio with credentials
   - Include publication/update dates
   - Add citations and sources
   - Include real examples and case studies

**When to Update:**
- Content is outdated (6+ months old)
- Rankings are declining
- Competitors have better content
- New information is available

**Content Refresh Checklist:**
- Update statistics and data
- Add new examples or case studies
- Improve headings and structure
- Add internal links to newer content
- Update meta tags
- Fix broken links
- Add new images or update existing ones

Regular content updates signal freshness to search engines.`,
      action: 'REVIEW',
      estimatedTime: '5 minutes'
    }
  ]
}
