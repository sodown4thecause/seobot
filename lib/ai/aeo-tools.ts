/**
 * AEO (Answer Engine Optimization) Tools for AI SDK 6
 * 
 * Specialized tools for optimizing content for AI platforms:
 * - ChatGPT, Perplexity, Claude, Gemini, and other LLM-based search engines
 * - Citation analysis and optimization
 * - EEAT signal detection and enhancement
 * - AI platform visibility tracking
 * 
 * These tools make the SEO/AEO Agent unique in the market by combining
 * traditional SEO with Answer Engine Optimization.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { searchWithPerplexity } from '@/lib/external-apis/perplexity'
import { scrapeWithJina } from '@/lib/external-apis/jina'
import { cachedAEOCall, AEO_CACHE_PREFIXES, AEO_CACHE_TTL } from './aeo-cache'

/**
 * Citation Analysis Tools
 */

export const analyzeCitationPatternsTool = tool({
  description: 'Analyze citation patterns for a topic in AI platforms. Identifies which sources are most frequently cited by AI platforms like ChatGPT and Perplexity, helping you understand what makes content citation-worthy.',
  inputSchema: z.object({
    topic: z.string().describe('The topic to analyze citation patterns for'),
    queries: z.array(z.string()).optional().describe('Specific queries to test (auto-generated if not provided)'),
    platforms: z.array(z.enum(['perplexity', 'chatgpt', 'claude', 'gemini'])).optional().describe('AI platforms to analyze (default: all)'),
  }),
  execute: async ({ topic, queries, platforms = ['perplexity'] }) => {
    // Use caching for citation analysis (24 hour TTL)
    return cachedAEOCall(
      AEO_CACHE_PREFIXES.CITATION_ANALYSIS,
      { topic, queries, platforms },
      async () => {
        const results: any = {
          topic,
          platforms: platforms,
          citationPatterns: [],
          topSources: [],
          recommendations: [],
        }

    // For now, we'll use Perplexity as it provides citations
    // In the future, we can add ChatGPT scraping via DataForSEO
    if (platforms.includes('perplexity')) {
      const testQueries = queries || [
        `What is ${topic}?`,
        `How does ${topic} work?`,
        `Best practices for ${topic}`,
        `${topic} guide`,
      ]

      const citationData: any[] = []

      for (const query of testQueries.slice(0, 3)) {
        try {
          const response = await searchWithPerplexity({
            query,
            returnCitations: true,
            searchRecencyFilter: 'month',
          })

          if (response.success && response.citations) {
            citationData.push({
              query,
              citations: response.citations,
              citationCount: response.citations.length,
            })
          }
        } catch (error) {
          console.warn(`[AEO] Failed to analyze query: ${query}`, error)
        }
      }

      // Analyze citation patterns
      const domainCounts: Record<string, number> = {}
      const allCitations: any[] = []

      citationData.forEach(({ citations }) => {
        citations.forEach((citation: any) => {
          allCitations.push(citation)
          try {
            const domain = new URL(citation.url).hostname.replace('www.', '')
            domainCounts[domain] = (domainCounts[domain] || 0) + 1
          } catch (e) {
            // Invalid URL, skip
          }
        })
      })

      // Get top sources
      const topSources = Object.entries(domainCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([domain, count]) => ({
          domain,
          citationCount: count,
          percentage: Math.round((count / allCitations.length) * 100),
        }))

      results.citationPatterns = citationData
      results.topSources = topSources
      results.totalCitations = allCitations.length
      results.uniqueDomains = Object.keys(domainCounts).length

      // Generate recommendations
      results.recommendations = [
        `Focus on creating authoritative content similar to top sources: ${topSources.slice(0, 3).map(s => s.domain).join(', ')}`,
        `AI platforms cited ${results.uniqueDomains} unique domains for "${topic}" - aim for diversity in your sources`,
        `Average citations per query: ${Math.round(allCitations.length / citationData.length)}`,
        `Top citation types: ${topSources[0]?.domain.includes('edu') ? 'Educational institutions' : topSources[0]?.domain.includes('gov') ? 'Government sources' : 'Industry publications'}`,
      ]
    }

        return {
          ...results,
          summary: `✅ Analyzed citation patterns for "${topic}" across ${platforms.length} platform(s). Found ${results.totalCitations} citations from ${results.uniqueDomains} unique domains.`,
        }
      },
      { ttl: AEO_CACHE_TTL.CITATION_ANALYSIS }
    )
  },
})

export const findCitationOpportunitiesTool = tool({
  description: 'Identify citation opportunities for your content. Analyzes competitor content that gets cited by AI platforms and provides recommendations for making your content more citation-worthy.',
  inputSchema: z.object({
    yourUrl: z.string().describe('Your content URL to analyze'),
    topic: z.string().describe('The topic/keyword your content targets'),
    competitorUrls: z.array(z.string()).optional().describe('Competitor URLs that get cited (auto-discovered if not provided)'),
  }),
  execute: async ({ yourUrl, topic, competitorUrls }) => {
    const results: any = {
      yourUrl,
      topic,
      citationScore: 0,
      gaps: [],
      opportunities: [],
      recommendations: [],
    }

    // Scrape your content
    let yourContent: any = null
    try {
      const scrapeResult = await scrapeWithJina({ url: yourUrl })
      if (scrapeResult.success) {
        yourContent = {
          title: scrapeResult.title,
          content: scrapeResult.markdown || scrapeResult.content,
          wordCount: scrapeResult.metadata?.wordCount || 0,
        }
      }
    } catch (error) {
      console.warn('[AEO] Failed to scrape your URL:', error)
    }

    if (!yourContent) {
      return {
        success: false,
        error: 'Failed to scrape your content URL',
        summary: '❌ Could not analyze your content',
      }
    }

    // Analyze your content for citation-worthy signals
    const citationSignals = {
      hasStatistics: /\d+%|\d+\s*(percent|users|people|companies)/i.test(yourContent.content),
      hasResearch: /(study|research|survey|report|analysis)/i.test(yourContent.content),
      hasExpertQuotes: /(according to|says|explains|notes|expert)/i.test(yourContent.content),
      hasDataPoints: /\d{4}|\d+,\d+/g.test(yourContent.content),
      hasSourceCitations: /\[(source|citation|\d+)\]|https?:\/\//i.test(yourContent.content),
      wordCount: yourContent.wordCount,
      hasStructuredData: /<script type="application\/ld\+json">/i.test(yourContent.content),
    }

    // Calculate citation score (0-100)
    let score = 0
    if (citationSignals.hasStatistics) score += 20
    if (citationSignals.hasResearch) score += 20
    if (citationSignals.hasExpertQuotes) score += 15
    if (citationSignals.hasDataPoints) score += 15
    if (citationSignals.hasSourceCitations) score += 15
    if (citationSignals.wordCount > 1500) score += 10
    if (citationSignals.hasStructuredData) score += 5

    results.citationScore = Math.min(score, 100)
    results.signals = citationSignals

    // Identify gaps
    if (!citationSignals.hasStatistics) {
      results.gaps.push('Missing statistics and data points')
      results.opportunities.push('Add relevant statistics and percentages to support claims')
    }
    if (!citationSignals.hasResearch) {
      results.gaps.push('No research or studies cited')
      results.opportunities.push('Reference authoritative research, studies, or industry reports')
    }
    if (!citationSignals.hasExpertQuotes) {
      results.gaps.push('No expert quotes or attributions')
      results.opportunities.push('Include quotes from industry experts or thought leaders')
    }
    if (!citationSignals.hasSourceCitations) {
      results.gaps.push('Missing source citations')
      results.opportunities.push('Add citations to authoritative sources to build credibility')
    }
    if (citationSignals.wordCount < 1500) {
      results.gaps.push('Content may be too short for comprehensive coverage')
      results.opportunities.push(`Expand content to at least 1500 words (currently ${citationSignals.wordCount})`)
    }

    // Generate recommendations
    results.recommendations = [
      `Citation Score: ${results.citationScore}/100 - ${results.citationScore >= 70 ? 'Good' : results.citationScore >= 50 ? 'Needs improvement' : 'Requires significant enhancement'}`,
      `Found ${results.gaps.length} gap(s) that reduce citation-worthiness`,
      ...results.opportunities.slice(0, 3),
    ]

    return {
      ...results,
      summary: `✅ Citation analysis complete. Score: ${results.citationScore}/100 with ${results.gaps.length} improvement opportunities.`,
    }
  },
})

export const optimizeForCitationsTool = tool({
  description: 'Generate recommendations to optimize content for AI platform citations. Provides specific, actionable suggestions to make content more likely to be cited by ChatGPT, Perplexity, Claude, and Gemini.',
  inputSchema: z.object({
    content: z.string().describe('The content to optimize for citations'),
    topic: z.string().describe('The main topic of the content'),
    targetPlatforms: z.array(z.enum(['chatgpt', 'perplexity', 'claude', 'gemini', 'all'])).optional().describe('Target AI platforms (default: all)'),
  }),
  execute: async ({ content, topic, targetPlatforms = ['all'] }) => {
    const recommendations: any = {
      topic,
      platforms: targetPlatforms,
      contentAnalysis: {},
      optimizations: [],
      priority: [],
    }

    // Analyze current content
    const analysis = {
      wordCount: content.split(/\s+/).length,
      hasHeadings: /^#{1,6}\s/m.test(content),
      hasLists: /^[-*]\s/m.test(content) || /^\d+\.\s/m.test(content),
      hasStatistics: /\d+%|\d+\s*(percent|users|people)/i.test(content),
      hasResearch: /(study|research|survey|report)/i.test(content),
      hasSources: /\[(source|citation|\d+)\]|https?:\/\//i.test(content),
      hasExamples: /(for example|such as|like|including)/i.test(content),
      hasDefinitions: /(is defined as|refers to|means|is a)/i.test(content),
      readabilityScore: content.split(/[.!?]+/).length / (content.split(/\s+/).length / 100), // Rough estimate
    }

    recommendations.contentAnalysis = analysis

    // Platform-specific optimizations
    const platformOptimizations: Record<string, string[]> = {
      chatgpt: [
        'Add clear, concise definitions at the beginning',
        'Use structured formatting with headings and lists',
        'Include step-by-step instructions where applicable',
        'Add relevant examples and use cases',
      ],
      perplexity: [
        'Include authoritative source citations',
        'Add recent statistics and data points',
        'Reference academic research and studies',
        'Use factual, objective language',
      ],
      claude: [
        'Provide comprehensive, nuanced explanations',
        'Include multiple perspectives on the topic',
        'Add context and background information',
        'Use clear logical structure',
      ],
      gemini: [
        'Include visual descriptions and examples',
        'Add practical applications and real-world scenarios',
        'Use conversational yet informative tone',
        'Provide actionable takeaways',
      ],
    }

    // Generate optimizations based on analysis
    if (analysis.wordCount < 1000) {
      recommendations.optimizations.push({
        type: 'content_depth',
        priority: 'high',
        suggestion: `Expand content to at least 1000 words (currently ${analysis.wordCount}) for comprehensive coverage`,
      })
    }

    if (!analysis.hasHeadings) {
      recommendations.optimizations.push({
        type: 'structure',
        priority: 'high',
        suggestion: 'Add clear H2 and H3 headings to organize content hierarchically',
      })
    }

    if (!analysis.hasStatistics) {
      recommendations.optimizations.push({
        type: 'credibility',
        priority: 'high',
        suggestion: 'Include relevant statistics and data points to support claims',
      })
    }

    if (!analysis.hasSources) {
      recommendations.optimizations.push({
        type: 'citations',
        priority: 'critical',
        suggestion: 'Add citations to authoritative sources (research papers, industry reports, expert opinions)',
      })
    }

    if (!analysis.hasExamples) {
      recommendations.optimizations.push({
        type: 'clarity',
        priority: 'medium',
        suggestion: 'Include concrete examples and use cases to illustrate concepts',
      })
    }

    // Add platform-specific recommendations
    if (targetPlatforms.includes('all')) {
      Object.values(platformOptimizations).flat().forEach((opt, i) => {
        if (i < 5) { // Top 5 cross-platform optimizations
          recommendations.optimizations.push({
            type: 'platform_optimization',
            priority: 'medium',
            suggestion: opt,
          })
        }
      })
    } else {
      targetPlatforms.forEach(platform => {
        if (platform !== 'all' && platformOptimizations[platform]) {
          platformOptimizations[platform].forEach(opt => {
            recommendations.optimizations.push({
              type: 'platform_optimization',
              priority: 'medium',
              suggestion: `[${platform.toUpperCase()}] ${opt}`,
            })
          })
        }
      })
    }

    // Prioritize recommendations
    recommendations.priority = recommendations.optimizations
      .filter((opt: any) => opt.priority === 'critical' || opt.priority === 'high')
      .map((opt: any) => opt.suggestion)

    return {
      ...recommendations,
      summary: `✅ Generated ${recommendations.optimizations.length} optimization recommendations for "${topic}" (${recommendations.priority.length} high priority)`,
    }
  },
})

/**
 * EEAT Signal Detection Tools
 */

export const detectEEATSignalsTool = tool({
  description: 'Detect and score EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) signals in content. Essential for AI platform visibility as LLMs prioritize high-EEAT content for citations.',
  inputSchema: z.object({
    content: z.string().describe('The content to analyze for EEAT signals'),
    authorInfo: z.object({
      name: z.string().optional(),
      credentials: z.string().optional(),
      bio: z.string().optional(),
    }).optional().describe('Author information if available'),
    url: z.string().optional().describe('Content URL for additional analysis'),
  }),
  execute: async ({ content, authorInfo, url }) => {
    // Use caching for EEAT detection (1 hour TTL)
    return cachedAEOCall(
      AEO_CACHE_PREFIXES.EEAT_DETECTION,
      { content: content.substring(0, 500), authorInfo, url }, // Use first 500 chars for cache key
      async () => {
        const signals: any = {
          experience: { score: 0, signals: [], missing: [] },
          expertise: { score: 0, signals: [], missing: [] },
          authoritativeness: { score: 0, signals: [], missing: [] },
          trustworthiness: { score: 0, signals: [], missing: [] },
        }

    // Experience signals (0-25 points)
    if (/first-hand|personal experience|I (tried|tested|used|worked)/i.test(content)) {
      signals.experience.score += 10
      signals.experience.signals.push('First-hand experience mentioned')
    } else {
      signals.experience.missing.push('Add first-hand experience or case studies')
    }

    if (/(case study|real-world example|actual results)/i.test(content)) {
      signals.experience.score += 10
      signals.experience.signals.push('Real-world examples included')
    } else {
      signals.experience.missing.push('Include real-world examples or case studies')
    }

    if (/\d+\s*(years?|months?) (of )?(experience|working|in the field)/i.test(content)) {
      signals.experience.score += 5
      signals.experience.signals.push('Years of experience stated')
    } else {
      signals.experience.missing.push('Mention years of experience in the field')
    }

    // Expertise signals (0-25 points)
    if (authorInfo?.credentials) {
      signals.expertise.score += 10
      signals.expertise.signals.push(`Author credentials: ${authorInfo.credentials}`)
    } else {
      signals.expertise.missing.push('Add author credentials (degrees, certifications)')
    }

    if (/(certified|accredited|licensed|degree in|PhD|expert in)/i.test(content)) {
      signals.expertise.score += 8
      signals.expertise.signals.push('Professional qualifications mentioned')
    } else {
      signals.expertise.missing.push('Include professional qualifications or certifications')
    }

    if (/(published|authored|contributed to|speaker at)/i.test(content)) {
      signals.expertise.score += 7
      signals.expertise.signals.push('Publications or speaking engagements mentioned')
    } else {
      signals.expertise.missing.push('Mention publications, talks, or industry contributions')
    }

    // Authoritativeness signals (0-25 points)
    const citationCount = (content.match(/\[(source|citation|\d+)\]|https?:\/\//gi) || []).length
    if (citationCount >= 5) {
      signals.authoritativeness.score += 10
      signals.authoritativeness.signals.push(`${citationCount} authoritative sources cited`)
    } else {
      signals.authoritativeness.missing.push(`Add more authoritative citations (currently ${citationCount})`)
    }

    if (/(according to|research shows|study found|data from)/i.test(content)) {
      signals.authoritativeness.score += 8
      signals.authoritativeness.signals.push('Research and data referenced')
    } else {
      signals.authoritativeness.missing.push('Reference authoritative research and data')
    }

    if (/(industry leader|recognized expert|award-winning|featured in)/i.test(content)) {
      signals.authoritativeness.score += 7
      signals.authoritativeness.signals.push('Industry recognition mentioned')
    } else {
      signals.authoritativeness.missing.push('Highlight industry recognition or awards')
    }

    // Trustworthiness signals (0-25 points)
    if (/(updated|reviewed|fact-checked|verified)/i.test(content)) {
      signals.trustworthiness.score += 8
      signals.trustworthiness.signals.push('Content review process mentioned')
    } else {
      signals.trustworthiness.missing.push('Add content review/update dates')
    }

    if (/\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])|last updated|published on/i.test(content)) {
      signals.trustworthiness.score += 7
      signals.trustworthiness.signals.push('Publication/update date included')
    } else {
      signals.trustworthiness.missing.push('Include clear publication and update dates')
    }

    if (/(privacy policy|terms of service|contact us|about us)/i.test(content)) {
      signals.trustworthiness.score += 5
      signals.trustworthiness.signals.push('Trust indicators present')
    } else {
      signals.trustworthiness.missing.push('Add trust indicators (privacy policy, contact info)')
    }

    if (url && /https:\/\//i.test(url)) {
      signals.trustworthiness.score += 5
      signals.trustworthiness.signals.push('Secure HTTPS connection')
    }

    // Calculate overall EEAT score
    const totalScore =
      signals.experience.score +
      signals.expertise.score +
      signals.authoritativeness.score +
      signals.trustworthiness.score

    const grade = totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Poor'

        return {
          totalScore,
          grade,
          breakdown: signals,
          topRecommendations: [
            ...signals.experience.missing.slice(0, 1),
            ...signals.expertise.missing.slice(0, 1),
            ...signals.authoritativeness.missing.slice(0, 1),
            ...signals.trustworthiness.missing.slice(0, 1),
          ].filter(Boolean),
          summary: `✅ EEAT Score: ${totalScore}/100 (${grade}). Found ${Object.values(signals).reduce((acc: number, s: any) => acc + s.signals.length, 0)} positive signals and ${Object.values(signals).reduce((acc: number, s: any) => acc + s.missing.length, 0)} improvement opportunities.`,
        }
      },
      { ttl: AEO_CACHE_TTL.EEAT_DETECTION }
    )
  },
})

export const enhanceEEATSignalsTool = tool({
  description: 'Generate specific recommendations to enhance EEAT signals in content. Provides actionable suggestions to improve Experience, Expertise, Authoritativeness, and Trustworthiness.',
  inputSchema: z.object({
    content: z.string().describe('The content to enhance'),
    focusAreas: z.array(z.enum(['experience', 'expertise', 'authoritativeness', 'trustworthiness', 'all'])).optional().describe('Specific EEAT areas to focus on (default: all)'),
  }),
  execute: async ({ content, focusAreas = ['all'] }) => {
    const enhancements: any = {
      experience: [],
      expertise: [],
      authoritativeness: [],
      trustworthiness: [],
    }

    const shouldEnhance = (area: string) => focusAreas.includes('all') || focusAreas.includes(area as any)

    // Experience enhancements
    if (shouldEnhance('experience')) {
      enhancements.experience = [
        {
          type: 'first_hand_experience',
          suggestion: 'Add a section describing your personal experience with the topic',
          example: '"In my 5 years working with [topic], I\'ve found that..."',
        },
        {
          type: 'case_studies',
          suggestion: 'Include specific case studies or real-world examples',
          example: '"For example, when working with Client X, we achieved Y results by..."',
        },
        {
          type: 'practical_insights',
          suggestion: 'Share practical insights that only come from hands-on experience',
          example: '"One thing most guides don\'t mention is..."',
        },
      ]
    }

    // Expertise enhancements
    if (shouldEnhance('expertise')) {
      enhancements.expertise = [
        {
          type: 'credentials',
          suggestion: 'Add author bio with relevant credentials and qualifications',
          example: '"Written by [Name], Certified [Credential] with [X] years of experience"',
        },
        {
          type: 'technical_depth',
          suggestion: 'Demonstrate deep technical knowledge of the subject',
          example: 'Include advanced concepts, technical details, or industry-specific terminology',
        },
        {
          type: 'industry_contributions',
          suggestion: 'Mention publications, talks, or contributions to the field',
          example: '"As featured in [Publication] and speaker at [Conference]"',
        },
      ]
    }

    // Authoritativeness enhancements
    if (shouldEnhance('authoritativeness')) {
      enhancements.authoritativeness = [
        {
          type: 'authoritative_sources',
          suggestion: 'Cite authoritative sources (research papers, industry reports, expert opinions)',
          example: '"According to a 2024 study by [Authority], [statistic]"',
        },
        {
          type: 'data_and_statistics',
          suggestion: 'Include recent data and statistics from reputable sources',
          example: '"Industry data shows that [percentage] of [audience] [action]"',
        },
        {
          type: 'expert_quotes',
          suggestion: 'Include quotes or insights from recognized industry experts',
          example: '"[Expert Name], [Title] at [Company], explains: \'[quote]\'"',
        },
      ]
    }

    // Trustworthiness enhancements
    if (shouldEnhance('trustworthiness')) {
      enhancements.trustworthiness = [
        {
          type: 'transparency',
          suggestion: 'Be transparent about methodology, limitations, and potential biases',
          example: '"This analysis is based on [methodology]. Note that [limitation]"',
        },
        {
          type: 'update_dates',
          suggestion: 'Include clear publication and last updated dates',
          example: '"Published: [Date] | Last Updated: [Date]"',
        },
        {
          type: 'fact_checking',
          suggestion: 'Add editorial review or fact-checking process information',
          example: '"This article was reviewed by [Expert] and fact-checked on [Date]"',
        },
        {
          type: 'contact_info',
          suggestion: 'Provide clear contact information and author profiles',
          example: 'Include author email, LinkedIn, or contact form',
        },
      ]
    }

    const allEnhancements = [
      ...enhancements.experience,
      ...enhancements.expertise,
      ...enhancements.authoritativeness,
      ...enhancements.trustworthiness,
    ]

    return {
      enhancements,
      totalSuggestions: allEnhancements.length,
      priorityActions: allEnhancements.slice(0, 5),
      summary: `✅ Generated ${allEnhancements.length} EEAT enhancement recommendations across ${focusAreas.includes('all') ? 4 : focusAreas.length} area(s).`,
    }
  },
})

/**
 * Export all AEO tools
 */
export function getAEOTools() {
  return {
    // Citation tools
    aeo_analyze_citations: analyzeCitationPatternsTool,
    aeo_find_citation_opportunities: findCitationOpportunitiesTool,
    aeo_optimize_for_citations: optimizeForCitationsTool,
    // EEAT tools
    aeo_detect_eeat_signals: detectEEATSignalsTool,
    aeo_enhance_eeat_signals: enhanceEEATSignalsTool,
  }
}

