/**
 * AEO Getting Cited Tutorial
 * Beginner tutorial on Answer Engine Optimization
 */

import type { Tutorial } from '../types'

export const aeoGettingCitedTutorial: Tutorial = {
  id: 'aeo-getting-cited',
  title: 'AEO 101: Getting Your Content Cited by ChatGPT',
  description: 'Learn how to optimize your content to be cited by AI search engines like ChatGPT and Perplexity',
  difficulty: 'beginner',
  estimatedTime: '20 minutes',
  prerequisites: ['seo-fundamentals-101'],
  enabled: true,
  linkedWorkflow: 'rank-on-chatgpt',
  outcomes: [
    {
      concept: 'Answer Engine Optimization',
      skillGained: 'Understanding how AI search engines work and what they look for',
      realWorldApplication: 'Get your content cited as a source in AI responses, driving qualified traffic'
    },
    {
      concept: 'Citation Signals',
      skillGained: 'Identifying what makes content citation-worthy',
      realWorldApplication: 'Structure your content to be more likely to be cited by AI platforms'
    },
    {
      concept: 'AI Search Volume',
      skillGained: 'Understanding AI search volume vs traditional search volume',
      realWorldApplication: 'Target keywords that AI assistants frequently answer, even if traditional search volume is low'
    }
  ],
  steps: [
    {
      id: 'what-is-aeo',
      title: 'What is Answer Engine Optimization?',
      content: `Answer Engine Optimization (AEO) is the practice of optimizing content to be cited by AI search engines like ChatGPT, Perplexity, and Google's AI Overview.

Unlike traditional SEO where you rank in search results, AEO focuses on:
- Being cited as a source in AI responses
- Providing authoritative, factual information
- Structuring content for AI consumption
- Building domain authority and trust signals

AI assistants prefer content that is:
- Accurate and well-researched
- From authoritative sources
- Clearly structured with facts and data
- Recent and up-to-date`,
      action: 'EXPLAIN',
      estimatedTime: '4 minutes'
    },
    {
      id: 'citation-signals',
      title: 'What Makes Content Citation-Worthy?',
      content: `AI platforms look for specific signals when deciding what to cite:

1. **Authority** - Is the source trusted and reputable?
2. **Accuracy** - Is the information factual and verifiable?
3. **Structure** - Is the content well-organized with clear facts?
4. **Recency** - Is the information current and up-to-date?
5. **Completeness** - Does it thoroughly cover the topic?

Let's analyze your existing content to see how citation-worthy it is.`,
      action: 'TOOL_DEMO',
      tool: 'aeo_audit',
      highlightParams: ['url', 'analyze_citations'],
      liveDemo: true,
      estimatedTime: '6 minutes'
    },
    {
      id: 'optimizing-for-citations',
      title: 'Optimizing Your Content for Citations',
      content: `To improve your citation chances:

1. **Add Statistics and Data** - AI loves concrete numbers
2. **Cite Your Sources** - Show where your information comes from
3. **Use Clear Headings** - Structure helps AI parse your content
4. **Answer Questions Directly** - Match how AI formulates answers
5. **Update Regularly** - Fresh content is preferred

Let's use FlowIntent's AEO optimization tool to improve your content.`,
      action: 'PRACTICE',
      tool: 'aeo_optimization',
      estimatedTime: '7 minutes'
    },
    {
      id: 'measuring-success',
      title: 'Measuring AEO Success',
      content: `Unlike traditional SEO, AEO success is measured differently:

- **Citation Rate** - How often your content is cited
- **AI Search Volume** - Keywords AI assistants frequently answer
- **Traffic from AI** - Visitors coming from AI platforms
- **Brand Mentions** - Your brand mentioned in AI responses

Track these metrics to see if your AEO efforts are working.`,
      action: 'REVIEW',
      estimatedTime: '3 minutes'
    }
  ]
}

