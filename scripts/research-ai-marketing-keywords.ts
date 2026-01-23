/**
 * Research Script: 50 Untapped Long-tail Keywords in AI Marketing Tools
 *
 * Uses DataForSEO API to find low-competition, high-opportunity keywords
 */

import * as dotenv from 'dotenv'
import { writeFile } from 'node:fs/promises'

dotenv.config({ path: '.env.local' })

const BASE_URL = 'https://api.dataforseo.com/v3'

function basicAuthHeader() {
  const auth = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString('base64')
  return `Basic ${auth}`
}

async function callAPI<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([body]),
  })

  if (!res.ok) {
    throw new Error(`DataForSEO API error: ${res.status}`)
  }

  return await res.json()
}

interface KeywordData {
  keyword: string
  search_volume: number
  competition?: number
  cpc?: number
  keyword_difficulty?: number
  serp_info?: {
    check_url: string
    serp_item_types?: string[]
  }
}

async function main() {
  console.log('🔍 Researching AI Marketing Tools Keywords...\n')

  const seedKeywords = [
    'AI marketing tools',
    'AI content marketing',
    'AI social media marketing',
    'AI email marketing',
    'AI SEO tools',
    'marketing automation AI',
  ]

  let allKeywords: KeywordData[] = []

  // Step 1: Get keyword suggestions
  console.log('📊 Step 1: Getting keyword suggestions...')
  for (const seed of seedKeywords) {
    try {
      const response: any = await callAPI(
        '/keywords_data/google_ads/keywords_for_keywords/live',
        {
          keywords: [seed],
          location_code: 2840, // USA
          language_code: 'en',
          include_seed_keyword: true,
          include_serp_info: true,
          limit: 50,
        }
      )

      const keywords = response.tasks?.[0]?.result || []
      allKeywords.push(...keywords)
      console.log(`   ✓ ${seed}: ${keywords.length} keywords`)

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`   ✗ ${seed}: ${error}`)
    }
  }

  console.log(`\n📈 Total keywords collected: ${allKeywords.length}`)

  // Step 2: Filter for long-tail keywords (3+ words)
  console.log('\n🔎 Step 2: Filtering for long-tail keywords...')
  const longTail = allKeywords.filter(kw => {
    const wordCount = kw.keyword.split(' ').length
    return wordCount >= 3 && kw.search_volume > 10
  })

  console.log(`   Found ${longTail.length} long-tail keywords with volume > 10`)

  // Step 3: Get keyword difficulty for top candidates
  console.log('\n💪 Step 3: Analyzing keyword difficulty...')
  const topCandidates = longTail
    .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0))
    .slice(0, 100) // Top 100 by volume

  const keywordsToCheck = topCandidates.map(k => k.keyword)

  // Process in batches of 50 (API limit)
  const batches = []
  for (let i = 0; i < keywordsToCheck.length; i += 50) {
    batches.push(keywordsToCheck.slice(i, i + 50))
  }

  const enrichedKeywords: Array<{
    keyword: string
    search_volume: number
    difficulty: number
    cpc: number
    competition_level: string
    opportunity_score: number
  }> = []

  for (const batch of batches) {
    try {
      const response: any = await callAPI(
        '/dataforseo_labs/google/bulk_keyword_difficulty/live',
        {
          keywords: batch,
          location_name: 'United States',
          language_code: 'en',
        }
      )

      const results = response.tasks?.[0]?.result || []

      for (const result of results) {
        const originalKw = topCandidates.find(k => k.keyword === result.keyword)
        if (!originalKw) continue

        const difficulty = result.keyword_difficulty || 0
        const volume = originalKw.search_volume || 0
        const cpc = originalKw.cpc || 0

        // Calculate opportunity score (high volume, low difficulty = high opportunity)
        const opportunityScore = volume > 0 && difficulty < 100
          ? Math.round((volume / Math.max(difficulty, 1)) * (cpc > 0 ? 1.2 : 1))
          : 0

        // Competition level based on difficulty
        let competitionLevel = 'High'
        if (difficulty < 30) competitionLevel = 'Low'
        else if (difficulty < 60) competitionLevel = 'Medium'

        enrichedKeywords.push({
          keyword: result.keyword,
          search_volume: volume,
          difficulty,
          cpc,
          competition_level: competitionLevel,
          opportunity_score: opportunityScore,
        })
      }

      console.log(`   ✓ Processed batch: ${results.length} keywords`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`   ✗ Batch failed: ${error}`)
    }
  }

  // Step 4: Select top 50 by opportunity score
  console.log('\n🎯 Step 4: Selecting top opportunities...')
  const top50 = enrichedKeywords
    .filter(k => k.competition_level === 'Low' || k.competition_level === 'Medium')
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, 50)

  console.log(`   Selected ${top50.length} top opportunities`)

  // Step 5: Categorize keywords
  console.log('\n📁 Step 5: Categorizing keywords...')
  const categories: Record<string, typeof top50> = {
    'Content Creation': [],
    'Social Media': [],
    'SEO & Search': [],
    'Email Marketing': [],
    'Analytics & Insights': [],
    'Automation & Workflow': [],
    'Other': [],
  }

  for (const kw of top50) {
    if (/content|writing|blog|article|copywriting/i.test(kw.keyword)) {
      categories['Content Creation'].push(kw)
    } else if (/social|instagram|facebook|twitter|linkedin|tiktok/i.test(kw.keyword)) {
      categories['Social Media'].push(kw)
    } else if (/seo|search|ranking|serp|keyword/i.test(kw.keyword)) {
      categories['SEO & Search'].push(kw)
    } else if (/email|newsletter|campaign/i.test(kw.keyword)) {
      categories['Email Marketing'].push(kw)
    } else if (/analytics|insight|data|metric|tracking/i.test(kw.keyword)) {
      categories['Analytics & Insights'].push(kw)
    } else if (/automation|workflow|integration|crm/i.test(kw.keyword)) {
      categories['Automation & Workflow'].push(kw)
    } else {
      categories['Other'].push(kw)
    }
  }

  for (const [category, keywords] of Object.entries(categories)) {
    console.log(`   ${category}: ${keywords.length} keywords`)
  }

  // Step 6: Export data
  console.log('\n💾 Step 6: Exporting results...')
  const output = {
    metadata: {
      generated_at: new Date().toISOString(),
      total_keywords_analyzed: allKeywords.length,
      long_tail_keywords: longTail.length,
      top_opportunities: top50.length,
      seed_keywords: seedKeywords,
    },
    keywords: top50,
    by_category: categories,
    summary: {
      avg_volume: Math.round(top50.reduce((sum, k) => sum + k.search_volume, 0) / top50.length),
      avg_difficulty: Math.round(top50.reduce((sum, k) => sum + k.difficulty, 0) / top50.length),
      avg_cpc: (top50.reduce((sum, k) => sum + k.cpc, 0) / top50.length).toFixed(2),
      low_competition_count: top50.filter(k => k.competition_level === 'Low').length,
      medium_competition_count: top50.filter(k => k.competition_level === 'Medium').length,
    }
  }

  await writeFile(
    'documents/ai-marketing-keywords-research-2026.json',
    JSON.stringify(output, null, 2)
  )

  console.log('   ✓ Saved to documents/ai-marketing-keywords-research-2026.json')

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESEARCH SUMMARY')
  console.log('='.repeat(60))
  console.log(`Keywords Analyzed: ${output.metadata.total_keywords_analyzed}`)
  console.log(`Long-tail Found: ${output.metadata.long_tail_keywords}`)
  console.log(`Top Opportunities: ${output.metadata.top_opportunities}`)
  console.log(`\nAverage Metrics:`)
  console.log(`  Search Volume: ${output.summary.avg_volume}/month`)
  console.log(`  Difficulty: ${output.summary.avg_difficulty}/100`)
  console.log(`  CPC: $${output.summary.avg_cpc}`)
  console.log(`\nCompetition Breakdown:`)
  console.log(`  Low: ${output.summary.low_competition_count} keywords`)
  console.log(`  Medium: ${output.summary.medium_competition_count} keywords`)
  console.log('\n✅ Research complete!')
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
