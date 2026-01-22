/**
 * Enhanced Content Quality Tools for AI SDK 6
 *
 * Additional tools for SEO/AEO optimization, human-like writing, and fact-checking
 * Extends the existing content-quality-tools.ts
 * Compatible with AI SDK 6 using inputSchema instead of parameters
 */

import { tool } from 'ai'
import { z } from 'zod'

// Note: Install these packages:
// npm install readability text-statistics write-good string-similarity keyword-extractor

// Type definitions (install types if available)
// npm install --save-dev @types/readability @types/write-good

/**
 * Calculate readability score using Flesch-Kincaid
 * Install: npm install text-statistics
 */
async function calculateReadability(text: string) {
  try {
    // Using text-statistics library (default export is a function/class)
    const TextStatisticsModule = await import('text-statistics')
    const TextStatistics = TextStatisticsModule.default || TextStatisticsModule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = new (TextStatistics as any)(text)
    
    return {
      fleschKincaid: stats.fleschKincaidReadingEase ? stats.fleschKincaidReadingEase() : 0,
      fleschKincaidGrade: stats.fleschKincaidGradeLevel ? stats.fleschKincaidGradeLevel() : 0,
      smogIndex: stats.smogIndex ? stats.smogIndex() : 0,
      colemanLiau: stats.colemanLiauIndex ? stats.colemanLiauIndex() : 0,
      automatedReadability: stats.automatedReadabilityIndex ? stats.automatedReadabilityIndex() : 0,
      averageGradeLevel: stats.averageGradeLevel ? stats.averageGradeLevel() : 0,
    }
  } catch (error) {
    console.error('[Readability] Calculation failed:', error)
    // Fallback: simple word/sentence count
    const words = text.split(/\s+/).length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0
    const avgSyllablesPerWord = 1.5 // Rough estimate
    
    return {
      fleschKincaid: Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord))),
      fleschKincaidGrade: Math.max(0, (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59),
      smogIndex: 0,
      colemanLiau: 0,
      automatedReadability: 0,
      averageGradeLevel: avgWordsPerSentence,
    }
  }
}

/**
 * Check writing quality issues
 * Install: npm install write-good
 */
async function checkWritingQuality(text: string) {
  try {
    const writeGoodModule = await import('write-good')
    const writeGood = writeGoodModule.default || writeGoodModule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestions = (writeGood as any)(text)
    
    return {
      issues: Array.isArray(suggestions) ? suggestions : [],
      issueCount: Array.isArray(suggestions) ? suggestions.length : 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hasPassiveVoice: Array.isArray(suggestions) && suggestions.some((s: any) => s.reason?.includes('passive')),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hasWeaselWords: Array.isArray(suggestions) && suggestions.some((s: any) => s.reason?.includes('weasel')),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hasComplexWords: Array.isArray(suggestions) && suggestions.some((s: any) => s.reason?.includes('complex')),
    }
  } catch (error) {
    console.error('[Writing Quality] Check failed:', error)
    return {
      issues: [],
      issueCount: 0,
      hasPassiveVoice: false,
      hasWeaselWords: false,
      hasComplexWords: false,
    }
  }
}

/**
 * Calculate keyword density
 * Install: npm install keyword-extractor
 */
async function calculateKeywordDensity(text: string, keywords: string[]) {
  try {
    const keywordExtractorModule = await import('keyword-extractor')
    const keywordExtractor = keywordExtractorModule.default || keywordExtractorModule
    
    // Extract keywords from text (if extract function exists)
    if (keywordExtractor.extract) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _extracted = keywordExtractor.extract(text, {
          language: 'english',
          remove_digits: true,
          return_changed_case: true,
          remove_duplicates: false,
        })
        // Use extracted for additional analysis if needed
      } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Continue with manual calculation
      }
    }
  } catch (error) {
    // Fallback to manual calculation
    console.warn('[Keyword Density] Using fallback calculation:', error)
  }
  
  // Manual keyword density calculation
  const wordCount = text.split(/\s+/).length
  const keywordAnalysis = keywords.map(keyword => {
    const keywordLower = keyword.toLowerCase()
    const matches = (text.match(new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    const density = wordCount > 0 ? (matches / wordCount) * 100 : 0
    
    return {
      keyword,
      count: matches,
      density: parseFloat(density.toFixed(2)),
      optimal: density >= 1 && density <= 3, // 1-3% is optimal
    }
  })
  
  return {
    wordCount,
    keywordAnalysis,
    averageDensity: keywords.length > 0 
      ? keywordAnalysis.reduce((sum, k) => sum + k.density, 0) / keywords.length 
      : 0,
  }
}

/**
 * Check content similarity
 * Install: npm install string-similarity
 */
async function checkSimilarity(text1: string, text2: string) {
  try {
    const stringSimilarityModule = await import('string-similarity')
    const stringSimilarity = stringSimilarityModule.default || stringSimilarityModule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compareTwoStrings = (stringSimilarity as any).compareTwoStrings
    
    if (typeof compareTwoStrings === 'function') {
      const similarity = compareTwoStrings(text1, text2)
      return {
        similarity: parseFloat((similarity * 100).toFixed(2)),
        isSimilar: similarity > 0.7, // 70% threshold
        recommendation: similarity > 0.7 
          ? 'Content is too similar to existing content. Consider rewriting.'
          : 'Content is sufficiently unique.',
      }
    }
  } catch (error) {
    console.warn('[Similarity] Check failed, using fallback:', error)
  }
  
  // Fallback: simple word overlap calculation
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  const similarity = union.size > 0 ? intersection.size / union.size : 0
  
  return {
    similarity: parseFloat((similarity * 100).toFixed(2)),
    isSimilar: similarity > 0.7,
    recommendation: similarity > 0.7 
      ? 'Content is too similar to existing content. Consider rewriting.'
      : 'Content is sufficiently unique.',
  }
}

/**
 * Analyze heading structure for SEO
 */
function analyzeHeadings(content: string) {
  const h1Matches = content.match(/^#\s+(.+)$/gm) || []
  const h2Matches = content.match(/^##\s+(.+)$/gm) || []
  const h3Matches = content.match(/^###\s+(.+)$/gm) || []
  
  return {
    h1Count: h1Matches.length,
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    hasH1: h1Matches.length > 0,
    hasMultipleH1: h1Matches.length > 1,
    structure: {
      h1: h1Matches.map(m => m.replace(/^#\s+/, '')),
      h2: h2Matches.map(m => m.replace(/^##\s+/, '')),
      h3: h3Matches.map(m => m.replace(/^###\s+/, '')),
    },
    recommendations: generateHeadingRecommendations({
      h1Count: h1Matches.length,
      h2Count: h2Matches.length,
      h3Count: h3Matches.length,
    }),
  }
}

function generateHeadingRecommendations({ h1Count, h2Count, h3Count }: { h1Count: number; h2Count: number; h3Count: number }) {
  const recommendations: string[] = []
  
  if (h1Count === 0) {
    recommendations.push('Add an H1 heading for better SEO')
  } else if (h1Count > 1) {
    recommendations.push('Use only one H1 heading per page for optimal SEO')
  }
  
  if (h2Count === 0 && h3Count > 0) {
    recommendations.push('Add H2 headings before H3 headings for proper hierarchy')
  }
  
  if (h2Count < 2) {
    recommendations.push('Consider adding more H2 headings to improve content structure')
  }
  
  return recommendations
}

/**
 * Comprehensive Content Quality Validation Tool
 */
export const validateContentQualityTool = tool({
  description: 'Comprehensive content quality validation including readability, style, originality, and SEO metrics. Use this to ensure content meets high quality standards.',
  inputSchema: z.object({
    content: z.string().describe('The content text to validate'),
    targetKeywords: z.array(z.string()).optional().default([]).describe('Target keywords for SEO analysis'),
    existingContent: z.string().optional().describe('Existing content to compare against for similarity check')
  }),
  execute: async ({ content, targetKeywords, existingContent }) => {
    try {
      // Readability analysis
      const readability = await calculateReadability(content)
      
      // Writing quality check
      const writingQuality = await checkWritingQuality(content)
      
      // Keyword analysis (if keywords provided)
      const keywordAnalysis = targetKeywords.length > 0
        ? await calculateKeywordDensity(content, targetKeywords)
        : null
      
      // Similarity check (if existing content provided)
      const similarityCheck = existingContent
        ? await checkSimilarity(content, existingContent)
        : null
      
      // Heading structure analysis
      const headingStructure = analyzeHeadings(content)
      
      // Calculate overall quality score
      const qualityScore = calculateOverallQualityScore({
        readability,
        writingQuality,
        keywordAnalysis,
        similarityCheck,
        headingStructure,
      })
      
      // Generate recommendations
      const recommendations = generateQualityRecommendations({
        readability,
        writingQuality,
        keywordAnalysis,
        similarityCheck,
        headingStructure,
      })
      
      return {
        qualityScore,
        readability: {
          score: readability.fleschKincaid,
          gradeLevel: readability.fleschKincaidGrade,
          level: getReadabilityLevel(readability.fleschKincaid),
          allScores: readability,
        },
        writingQuality: {
          issueCount: writingQuality.issueCount,
          issues: writingQuality.issues.slice(0, 5), // Top 5 issues
          hasPassiveVoice: writingQuality.hasPassiveVoice,
          hasWeaselWords: writingQuality.hasWeaselWords,
        },
        keywordAnalysis,
        similarityCheck,
        headingStructure,
        recommendations,
        summary: `Content quality score: ${qualityScore}/100. ${recommendations.length > 0 ? `Key recommendations: ${recommendations.slice(0, 3).join(', ')}` : 'Content meets quality standards.'}`,
      }
    } catch (error) {
      console.error('[Content Quality] Validation failed:', error)
      return {
        error: 'Failed to validate content quality',
        message: error instanceof Error ? error.message : 'Unknown error',
        qualityScore: 0,
        readability: null,
        writingQuality: null,
        keywordAnalysis: null,
        similarityCheck: null,
        headingStructure: null,
        recommendations: [],
        summary: 'Validation failed due to error.',
      }
    }
  },
})

/**
 * SEO Content Analysis Tool
 */
export const analyzeSEOContentTool = tool({
  description: 'Analyze content for SEO optimization including keyword density, meta tags, heading structure, and overall SEO score.',
  inputSchema: z.object({
    content: z.string().describe('The content to analyze'),
    title: z.string().optional().describe('Page title (for meta analysis)'),
    metaDescription: z.string().optional().describe('Meta description (for analysis)'),
    targetKeywords: z.array(z.string()).describe('Target keywords for SEO optimization')
  }),
  execute: async ({ content, title, metaDescription, targetKeywords }) => {
    try {
      // Keyword density analysis
      const keywordAnalysis = await calculateKeywordDensity(content, targetKeywords)
      
      // Title analysis
      const titleAnalysis = title ? {
        length: title.length,
        optimal: title.length >= 50 && title.length <= 60,
        tooShort: title.length < 50,
        tooLong: title.length > 60,
        containsPrimaryKeyword: targetKeywords[0] 
          ? title.toLowerCase().includes(targetKeywords[0].toLowerCase())
          : false,
        recommendations: generateTitleRecommendations(title, targetKeywords[0]),
      } : null
      
      // Meta description analysis
      const metaAnalysis = metaDescription ? {
        length: metaDescription.length,
        optimal: metaDescription.length >= 155 && metaDescription.length <= 160,
        tooShort: metaDescription.length < 155,
        tooLong: metaDescription.length > 160,
        containsKeywords: targetKeywords.some(k => 
          metaDescription.toLowerCase().includes(k.toLowerCase())
        ),
        recommendations: generateMetaRecommendations(metaDescription, targetKeywords),
      } : null
      
      // Heading structure
      const headingStructure = analyzeHeadings(content)
      
      // Calculate SEO score
      const seoScore = calculateSEOScore({
        keywordAnalysis,
        titleAnalysis,
        metaAnalysis,
        headingStructure,
      })
      
      // Generate SEO recommendations
      const recommendations = generateSEORecommendations({
        keywordAnalysis,
        titleAnalysis,
        metaAnalysis,
        headingStructure,
      })
      
      return {
        seoScore,
        keywordAnalysis,
        titleAnalysis,
        metaAnalysis,
        headingStructure,
        recommendations,
        summary: `SEO score: ${seoScore}/100. ${recommendations.length > 0 ? `Top recommendations: ${recommendations.slice(0, 3).join(', ')}` : 'Content is well-optimized for SEO.'}`,
      }
    } catch (error) {
      console.error('[SEO Analysis] Failed:', error)
      return {
        error: 'Failed to analyze SEO content',
        message: error instanceof Error ? error.message : 'Unknown error',
        seoScore: 0,
        keywordAnalysis: null,
        titleAnalysis: null,
        metaAnalysis: null,
        headingStructure: null,
        recommendations: [],
        summary: 'Analysis failed due to error.',
      }
    }
  },
})

/**
 * Fact-Checking Tool (using Perplexity/Jina)
 */
export const factCheckContentTool = tool({
  description: 'Verify factual claims in content using web search and knowledge base. Returns verification results for each claim.',
  inputSchema: z.object({
    content: z.string().describe('Content to fact-check'),
    claims: z.array(z.string()).optional().describe('Specific claims to verify (auto-extracted if not provided)')
  }),
  execute: async ({ content, claims }) => {
    try {
      // Extract claims if not provided (simple extraction - can be improved)
      const extractedClaims = claims || extractClaimsFromContent(content)
      
      if (extractedClaims.length === 0) {
        return {
          totalClaims: 0,
          message: 'No verifiable claims found in content',
          verifiedClaims: 0,
          verificationRate: 0,
          results: [],
          summary: 'No verifiable claims found in content',
          note: '',
        }
      }
      
      // Note: This is a placeholder - integrate with Perplexity API
      // For now, return structure for integration
      const verificationResults = extractedClaims.map((claim, index) => ({
        claim,
        claimIndex: index + 1,
        // TODO: Integrate with Perplexity API for actual verification
        verified: null as boolean | null,
        confidence: null as number | null,
        sources: [] as string[],
        note: 'Fact-checking requires Perplexity API integration',
      }))
      
      return {
        totalClaims: verificationResults.length,
        verifiedClaims: verificationResults.filter(r => r.verified === true).length,
        verificationRate: 0, // Will be calculated after API integration
        results: verificationResults,
        summary: `Found ${extractedClaims.length} claim(s) to verify. Integration with Perplexity API required for actual verification.`,
        note: 'To enable fact-checking, integrate with Perplexity API in the execute function',
      }
    } catch (error) {
      console.error('[Fact Check] Failed:', error)
      return {
        error: 'Failed to fact-check content',
        message: error instanceof Error ? error.message : 'Unknown error',
        totalClaims: 0,
        verifiedClaims: 0,
        verificationRate: 0,
        results: [],
        summary: 'Fact-checking failed due to error.',
        note: '',
      }
    }
  },
})

// Helper functions

function getReadabilityLevel(score: number): string {
  if (score >= 90) return 'Very Easy'
  if (score >= 80) return 'Easy'
  if (score >= 70) return 'Fairly Easy'
  if (score >= 60) return 'Standard'
  if (score >= 50) return 'Fairly Difficult'
  if (score >= 30) return 'Difficult'
  return 'Very Difficult'
}

function calculateOverallQualityScore({
  readability,
  writingQuality,
  keywordAnalysis,
  similarityCheck,
  headingStructure,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any): number {
  let score = 100
  
  // Readability penalty (target: 60-70 Flesch-Kincaid)
  if (readability.fleschKincaid < 50) score -= 15
  else if (readability.fleschKincaid < 60) score -= 10
  else if (readability.fleschKincaid > 80) score -= 5
  
  // Writing quality penalty
  score -= Math.min(writingQuality.issueCount * 2, 20)
  
  // Keyword optimization (if keywords provided)
  if (keywordAnalysis) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const optimalKeywords = keywordAnalysis.keywordAnalysis.filter((k: any) => k.optimal).length
    const totalKeywords = keywordAnalysis.keywordAnalysis.length
    if (totalKeywords > 0) {
      const keywordScore = (optimalKeywords / totalKeywords) * 20
      score -= (20 - keywordScore)
    }
  }
  
  // Similarity penalty
  if (similarityCheck && similarityCheck.isSimilar) {
    score -= 15
  }
  
  // Heading structure penalty
  if (!headingStructure.hasH1) score -= 10
  if (headingStructure.hasMultipleH1) score -= 5
  if (headingStructure.h2Count < 2) score -= 5
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

function calculateSEOScore({
  keywordAnalysis,
  titleAnalysis,
  metaAnalysis,
  headingStructure,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any): number {
  let score = 100
  
  // Keyword density (30 points)
  if (keywordAnalysis) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const optimalKeywords = keywordAnalysis.keywordAnalysis.filter((k: any) => k.optimal).length
    const totalKeywords = keywordAnalysis.keywordAnalysis.length
    if (totalKeywords > 0) {
      const keywordScore = (optimalKeywords / totalKeywords) * 30
      score = score - 30 + keywordScore
    } else {
      score -= 30
    }
  }
  
  // Title optimization (25 points)
  if (titleAnalysis) {
    if (!titleAnalysis.optimal) score -= 15
    if (!titleAnalysis.containsPrimaryKeyword) score -= 10
  } else {
    score -= 25
  }
  
  // Meta description (25 points)
  if (metaAnalysis) {
    if (!metaAnalysis.optimal) score -= 15
    if (!metaAnalysis.containsKeywords) score -= 10
  } else {
    score -= 25
  }
  
  // Heading structure (20 points)
  if (!headingStructure.hasH1) score -= 10
  if (headingStructure.hasMultipleH1) score -= 5
  if (headingStructure.h2Count < 2) score -= 5
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

function generateQualityRecommendations({
  readability,
  writingQuality,
  keywordAnalysis,
  similarityCheck,
  headingStructure,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any): string[] {
  const recommendations: string[] = []
  
  // Readability recommendations
  if (readability.fleschKincaid < 60) {
    recommendations.push('Improve readability by using shorter sentences and simpler words')
  }
  
  // Writing quality recommendations
  if (writingQuality.hasPassiveVoice) {
    recommendations.push('Reduce passive voice for more engaging content')
  }
  if (writingQuality.hasWeaselWords) {
    recommendations.push('Remove weasel words for more confident writing')
  }
  if (writingQuality.issueCount > 5) {
    recommendations.push('Address writing quality issues to improve readability')
  }
  
  // Keyword recommendations
  if (keywordAnalysis) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lowDensity = keywordAnalysis.keywordAnalysis.filter((k: any) => k.density < 1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const highDensity = keywordAnalysis.keywordAnalysis.filter((k: any) => k.density > 3)
    
    if (lowDensity.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recommendations.push(`Increase keyword density for: ${lowDensity.map((k: any) => k.keyword).join(', ')}`)
    }
    if (highDensity.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recommendations.push(`Reduce keyword density for: ${highDensity.map((k: any) => k.keyword).join(', ')}`)
    }
  }
  
  // Similarity recommendations
  if (similarityCheck && similarityCheck.isSimilar) {
    recommendations.push('Content is too similar to existing content. Consider rewriting for uniqueness.')
  }
  
  // Heading recommendations
  recommendations.push(...headingStructure.recommendations)
  
  return recommendations
}

function generateSEORecommendations({
  keywordAnalysis,
  titleAnalysis,
  metaAnalysis,
  headingStructure,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any): string[] {
  const recommendations: string[] = []
  
  // Title recommendations
  if (titleAnalysis) {
    if (titleAnalysis.tooShort) {
      recommendations.push('Title is too short. Aim for 50-60 characters for optimal SEO.')
    }
    if (titleAnalysis.tooLong) {
      recommendations.push('Title is too long. Keep it under 60 characters for optimal SEO.')
    }
    if (!titleAnalysis.containsPrimaryKeyword) {
      recommendations.push('Include primary keyword in title for better SEO.')
    }
    recommendations.push(...titleAnalysis.recommendations)
  }
  
  // Meta description recommendations
  if (metaAnalysis) {
    if (metaAnalysis.tooShort) {
      recommendations.push('Meta description is too short. Aim for 155-160 characters.')
    }
    if (metaAnalysis.tooLong) {
      recommendations.push('Meta description is too long. Keep it under 160 characters.')
    }
    if (!metaAnalysis.containsKeywords) {
      recommendations.push('Include target keywords in meta description.')
    }
    recommendations.push(...metaAnalysis.recommendations)
  }
  
  // Keyword recommendations
  if (keywordAnalysis) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lowDensity = keywordAnalysis.keywordAnalysis.filter((k: any) => k.density < 1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const highDensity = keywordAnalysis.keywordAnalysis.filter((k: any) => k.density > 3)
    
    if (lowDensity.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recommendations.push(`Increase keyword density (aim for 1-3%) for: ${lowDensity.map((k: any) => k.keyword).join(', ')}`)
    }
    if (highDensity.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recommendations.push(`Reduce keyword density (aim for 1-3%) for: ${highDensity.map((k: any) => k.keyword).join(', ')}`)
    }
  }
  
  // Heading recommendations
  recommendations.push(...headingStructure.recommendations)
  
  return recommendations
}

function generateTitleRecommendations(title: string, primaryKeyword?: string): string[] {
  const recommendations: string[] = []
  
  if (title.length < 50) {
    recommendations.push('Title should be at least 50 characters for better SEO')
  }
  if (title.length > 60) {
    recommendations.push('Title should be under 60 characters to avoid truncation in search results')
  }
  if (primaryKeyword && !title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    recommendations.push(`Include primary keyword "${primaryKeyword}" in title`)
  }
  
  return recommendations
}

function generateMetaRecommendations(meta: string, keywords: string[]): string[] {
  const recommendations: string[] = []
  
  if (meta.length < 155) {
    recommendations.push('Meta description should be at least 155 characters for better visibility')
  }
  if (meta.length > 160) {
    recommendations.push('Meta description should be under 160 characters to avoid truncation')
  }
  
  const missingKeywords = keywords.filter(k => !meta.toLowerCase().includes(k.toLowerCase()))
  if (missingKeywords.length > 0) {
    recommendations.push(`Consider including keywords: ${missingKeywords.join(', ')}`)
  }
  
  return recommendations
}

function extractClaimsFromContent(content: string): string[] {
  // Simple claim extraction - can be improved with NLP
  // Look for statements that might need verification
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  // Filter sentences that look like factual claims
  // (contain numbers, dates, statistics, or strong assertions)
  const claimPatterns = [
    /\d+%/, // Percentages
    /\d+\s+(million|billion|thousand)/i, // Large numbers
    /(according to|research shows|studies indicate|data suggests)/i, // Research claims
    /(always|never|all|every|none)/i, // Absolute claims
  ]
  
  return sentences.filter(sentence => 
    claimPatterns.some(pattern => pattern.test(sentence))
  ).slice(0, 10) // Limit to 10 claims
}

/**
 * Export all enhanced tools
 */
export function getEnhancedContentQualityTools() {
  return {
    validate_content_quality: validateContentQualityTool,
    analyze_seo_content: analyzeSEOContentTool,
    fact_check_content: factCheckContentTool,
  }
}

