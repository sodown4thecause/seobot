/**
 * Seed additional SEO/AEO research documents from the comprehensive research file
 * This adds more detailed chunks for better RAG retrieval
 * Run: npx tsx scripts/seed-seo-research.ts
 */

import { createClient } from '@supabase/supabase-js'
import { embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = createOpenAI({ apiKey: openaiApiKey })

async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.textEmbeddingModel('text-embedding-3-small'),
    value: text,
  })
  return embedding
}

// Additional research chunks from SEO_AEO Chatbot RAG Content Research.md
const additionalDocuments = [
  {
    title: "Inverted Pyramid for AI - Token Distance Optimization",
    agent_type: "content_writer",
    content: `INVERTED PYRAMID CONTENT STRUCTURE FOR AEO

**Token Distance Optimization:**
LLMs process text sequentially, and information presented early in the context window is statistically more likely to be extracted as the primary answer.

**Structure:**
1. THE LEAD (The Answer): Direct, concise answer in first paragraph - minimizes "token distance" for AI to find core truth
2. THE BODY (Context): Supporting details, data, and nuance to substantiate the lead
3. THE TAIL (Drill-down): Related entities and deep dives

**Information Gain Scores:**
- AEO algorithms look for "Net New Information"
- If a page merely repeats consensus of top 10 results, it has LOW Information Gain score
- Unique value must be delivered IMMEDIATELY in first paragraphs
- "Atomization" of content into self-contained blocks (glossary definitions, key takeaways, FAQs) allows AI to easily lift information

**Implementation:**
- First <div> or paragraph MUST contain the direct answer
- Aligns with Google's "Fully Meets" criteria
- Each section should be self-contained and answerable
- Use "atoms" of information that can be extracted independently`
  },
  {
    title: "Winston AI Detection Thresholds and Scoring",
    agent_type: "content_writer",
    content: `WINSTON AI DETECTION SCORING GUIDELINES

**Score Thresholds:**
- 0-19% AI Probability: Academic/University standard - EXCELLENT
- 20-29% AI Probability: Professional standard - GOOD
- 30-49% AI Probability: Corporate acceptable - FAIR
- 50%+ AI Probability: Flagged as AI-generated - POOR

**Target for SEO/AEO Content:**
- <25% AI probability for production quality
- <20% for YMYL (Your Money Your Life) content

**Prediction Maps:**
- Winston uses color-coded prediction maps
- RED zones = highly predictable sequences (AI fingerprint)
- Inject "entropy" (unpredictable human vocabulary) into red zones

**Perplexity (Surprise Factor):**
- LOW perplexity = predictable text (AI characteristic)
- HIGH perplexity = unusual word choices, creative leaps (human characteristic)

**Burstiness (Rhythm Factor):**
- LOW burstiness = monotone rhythm, uniform sentences (AI)
- HIGH burstiness = varied sentence lengths, mixed structures (human)
- Target burstiness score > 0.6`
  },
  {
    title: "AEO Citation Strategy - How AI Engines Select Sources",
    agent_type: "content_writer",
    content: `AEO CITATION AND SOURCE SELECTION

**Key Research Findings (Ahrefs/Backlinko):**
- 28% of pages cited by ChatGPT have ZERO organic visibility in Google
- LLMs use DIFFERENT retrieval logic than PageRank
- 76.4% of ChatGPT's most-cited pages updated within last 30 days (FRESHNESS critical)

**Brand Mentions vs Backlinks:**
- Brand mention correlation with AI visibility: 0.664 (STRONG)
- Backlink correlation with AI visibility: 0.218 (WEAK)
- "Buzz" and "Brand Salience" are the new backlinks for AI era

**AI Overview Appearance by Intent (Authoritas Study):**
- Problem Solving queries: 69-74% AIO appearance (HIGHEST VALUE)
- Specific Questions: 70%+ AIO appearance
- Navigational queries: 0% AIO appearance
- Broad Topic Research: ~3.37% AIO appearance (LOW)

**Strategic Recommendations:**
- Target "Problem Solving" intents: "How to fix X", "Why does Y happen"
- Avoid broad commercial terms for AEO
- Focus on specific, answerable questions
- Maintain freshness with regular content updates`
  },
  {
    title: "Bing Deep Search and Query Expansion",
    agent_type: "content_writer",
    content: `BING DEEP SEARCH OPTIMIZATION

**Query Expansion Mechanism:**
- Deep Search uses GPT-4 to EXPAND user query before searching
- Content must align with EXPANDED semantic field, not just literal keywords
- Example: "points systems in Japan" expands to include "loyalty card programs," "benefits," "enrollment processes," "tourist vs resident options"

**Technical Requirements:**
1. XML Sitemap with accurate lastmod tags (CRITICAL for freshness signal)
2. NOCACHE meta tag option: URL/Title/Snippet appear in Bing Chat, but full text excluded from AI training
3. NOARCHIVE meta tag: Prevents content from being linked in answers entirely

**Pre-filtering Layer:**
- Bing uses AI classifiers to REMOVE low-quality content before ranking
- Content flagged as "unsafe" or "low quality" never reaches ranking algorithm

**Optimization Checklist:**
- Cover implied subtopics the AI would generate from query expansion
- Keep lastmod timestamps accurate and recent
- Consider NOCACHE if you want visibility without training contribution
- Ensure content passes quality classifier before worrying about ranking`
  },
  {
    title: "Google Helpful Content System (HCS) - Site-Wide Classifier",
    agent_type: "content_writer",
    content: `GOOGLE HELPFUL CONTENT SYSTEM

**Site-Wide Signal:**
- HCS generates a SITE-WIDE signal, not page-level
- If significant portion of domain content is "unhelpful," ENTIRE site suffers penalty
- Even high-quality pages on domain are affected
- "Fruit of the poisonous tree" doctrine applies

**What Makes Content "Unhelpful":**
1. Content that summarizes other sources WITHOUT adding value
2. Content written to a particular word count (myth: "long-form is better")
3. Content entering niche topics solely for trending traffic without established authority
4. "Search engine-first" content vs "People-first" content

**The "Search Engine First" Trap:**
- Writing about topics because they have high search volume
- Writing for search engines rather than existing audience
- Optimizing for keywords over genuine expertise

**Recovery:**
- Remove or significantly improve unhelpful content
- System runs continuously - not a periodic update
- Recovery can take months after improvements made

**Content Quality Signals:**
- Does it demonstrate genuine expertise?
- Does it provide original information, research, or analysis?
- Would you trust it for YMYL decisions?
- Is the author clearly identified with expertise?`
  },
  {
    title: "The Anti-Pattern Lexicon - Complete Banned Words List",
    agent_type: "content_writer",
    content: `COMPLETE AI DETECTION ANTI-PATTERN LEXICON

**HIGH PROBABILITY AI INDICATOR VERBS:**
- Delve / Delving into
- Underscore (as verb for emphasis)
- Embark / Embarking on
- Facilitate
- Maximize / Maximizing
- Leverage (overused in business context)
- Navigate (metaphorical use)
- Craft / Crafting
- Streamline
- Optimize (when overused)

**HIGH PROBABILITY AI INDICATOR ADJECTIVES:**
- Robust (except technical contexts)
- Seamless / Seamlessly
- Vibrant
- Game-changing
- Cutting-edge
- Innovative (when generic)
- Holistic
- Comprehensive (when filler)
- Groundbreaking
- Revolutionary

**HIGH PROBABILITY AI INDICATOR TRANSITIONS:**
- "In conclusion"
- "It is important to note"
- "Moreover"
- "Furthermore"
- "Additionally"
- "In today's fast-paced world"
- "In the realm of"

**HIGH PROBABILITY AI INDICATOR PHRASES:**
- "At its core"
- "A testament to"
- "Landscape of..."
- "In summary"
- "It goes without saying"
- "Tapestry of..."
- "Labyrinth of..."
- "A myriad of"
- "Plays a crucial role"

**REPLACEMENT STRATEGY:**
- Use specific, concrete language instead of vague qualifiers
- Name actual experts, studies, data points
- Use domain-specific jargon appropriately
- Employ contractions and colloquialisms
- Include first-person perspective where appropriate`
  }
]

async function main() {
  console.log('[SEO Research Seeder] Starting...')
  
  let successCount = 0
  let failCount = 0
  
  for (const doc of additionalDocuments) {
    try {
      // Check if document with similar title already exists
      const { data: existing } = await supabase
        .from('agent_documents')
        .select('id')
        .ilike('title', `%${doc.title.substring(0, 30)}%`)
        .single()
      
      if (existing) {
        console.log(`[SEO Research Seeder] Skipping (exists): ${doc.title.substring(0, 50)}...`)
        continue
      }
      
      console.log(`[SEO Research Seeder] Adding: ${doc.title.substring(0, 50)}...`)
      
      // Generate embedding
      const embedding = await generateEmbedding(doc.content)
      
      // Insert document
      const { error } = await supabase
        .from('agent_documents')
        .insert({
          title: doc.title,
          content: doc.content,
          agent_type: doc.agent_type,
          embedding,
        })
      
      if (error) {
        console.error(`[SEO Research Seeder] Failed to insert ${doc.title}:`, error)
        failCount++
      } else {
        console.log(`[SEO Research Seeder] ✓ Added: ${doc.title}`)
        successCount++
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error(`[SEO Research Seeder] Error processing ${doc.title}:`, error)
      failCount++
    }
  }
  
  console.log(`\n[SEO Research Seeder] Complete!`)
  console.log(`✓ Added: ${successCount}`)
  console.log(`✗ Failed: ${failCount}`)
  
  // Show total count
  const { count } = await supabase
    .from('agent_documents')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\nTotal documents in database: ${count}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
