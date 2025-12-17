/**
 * Upload Research to RAG Script
 * 
 * This script reads the SEO/AEO research document, splits it into semantic chunks,
 * and uploads them to the agent_documents table in Supabase with embeddings.
 * 
 * Usage: node --import tsx scripts/upload-research-to-rag.ts
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize OpenAI client directly for embeddings
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})



interface ResearchChunk {
    title: string
    content: string
    agent_type: 'seo_aeo' | 'content_writer'
    metadata: {
        section: string
        source: string
        line_start?: number
        line_end?: number
        version: string
        uploaded_at: string
    }
}

// Define the chunks based on the research document analysis
const researchChunks: ResearchChunk[] = [
    // ==========================================
    // SEO/AEO Agent Chunks (12 chunks)
    // ==========================================
    {
        title: "The Great Decoupling: Index to Inference Transition",
        content: `The final quarter of 2025 marks a definitive inflection point in information retrieval. The digital landscape has transitioned from a link-based economy to an inference-based economy, where AI intermediaries synthesize answers, execute tasks, and increasingly bypass the open web entirely.

Three seismic shifts define this period:
1. The December 2025 Google Core Update targets mass-produced, low-value AI content through "Information Gain" signals
2. Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) have become distinct disciplines from traditional SEO
3. Agentic Search (OpenAI Atlas, Agent Mode) transforms browsers into autonomous actors

Key insight: "Ranking" is now secondary to "citation" - visibility depends on being USED to construct AI responses, not just being found.`,
        agent_type: 'seo_aeo',
        metadata: { section: "executive_summary", source: "research_q4_2025", line_start: 3, line_end: 14, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "CSQAF Framework for AI Citation",
        content: `The CSQAF Framework is a critical heuristic for getting cited by AI models:

1. **Citations (C):** Reference 1-2 authoritative sources per major section. AI models use outbound links as proxies for verification - they follow the trust graph.

2. **Statistics (S):** Include specific data points (e.g., "61% drop," "December 11, 2025"). Numbers act as "hooks" for retrieval algorithms.

3. **Quotations (Q):** Direct quotes from experts serve as "anchors." Models often preserve attributed viewpoints in summaries.

4. **Authoritativeness (A):** Write in a confident, definitive, objective style. Avoid fluff, hesitation, or marketing language. Mimic encyclopedic training data.

5. **Fluency (F):** Use clear headings (H2/H3) that directly ask and answer questions. Help models parse the information hierarchy.`,
        agent_type: 'seo_aeo',
        metadata: { section: "aeo_framework", source: "research_q4_2025", line_start: 117, line_end: 126, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Structural AEO Optimization - Inverted Pyramid",
        content: `Content must be structured to facilitate AI "extraction" - helping AI parse the Answer from surrounding Noise.

**The Inverted Pyramid of Answers:**
- Provide the direct answer upfront
- A 40-60 word summary immediately following an H2 question significantly increases snippet selection
- Example: For "What is the December 2025 Core Update?", the first paragraph should be a concise definition including date, scope, and primary target

**Schema Markup as AEO Language:**
- FAQPage & QAPage: Essential for question-based queries. Case studies show 9,200% increase in impressions after implementing FAQ schema
- HowTo: Critical for instructional content - breaks processes into discrete AI-ingestible steps
- Dataset: For original research, helps models extract raw numbers for comparative answers
- Organization/Person: Crucial for E-E-A-T entity establishment

**Information Gain Requirement:**
Content must offer unique data points, contrarian viewpoints with evidence, or specific nuances not found elsewhere. The AI has no reason to cite content that merely repeats consensus.`,
        agent_type: 'seo_aeo',
        metadata: { section: "aeo_structure", source: "research_q4_2025", line_start: 127, line_end: 149, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "10-Step GEO Framework for LLM Visibility",
        content: `Generative Engine Optimization (GEO) focuses on visibility within standalone generative tools like ChatGPT, Claude, and Perplexity - "black boxes" where retrieval is opaque.

The 10-Step GEO Framework:
1. Align GEO objectives with business KPIs - move beyond "traffic" to "mentions" and "sentiment"
2. Audit AI visibility using tools like Profound or manual testing
3. Map real-user prompts - analyze conversational queries, not keyword strings
4. Structure for summarization - use TL;DR summaries, bullet points, comparative tables
5. Technical signals - ensure llms.txt is present, site crawlable by OAI-SearchBot and GPTBot
6. Elevate citation authority - publish whitepapers that other sites cite
7. Strengthen E-E-A-T - robust author bios and editorial policies
8. Integrate multimedia - describe images via Alt Text, provide video transcripts
9. Scale prompt testing - continuously test "Best [Category] solutions for [Persona]" prompts
10. Iterate quarterly - different models have different "personality" biases

**Visibility Score:** Success is measured by the percentage of times a brand is mentioned relative to competitors. Bank of America achieved 32.2% visibility share for banking queries.`,
        agent_type: 'seo_aeo',
        metadata: { section: "geo_framework", source: "research_q4_2025", line_start: 152, line_end: 179, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Agentic Search: Atlas Browser & Agent Mode",
        content: `October 2025 saw the launch of ChatGPT Atlas, OpenAI's AI-native browser. This represents a paradigm shift from "browsing" to "delegating."

**Agent Mode Features:**
- Natural language commands like "Find the best flight to Tokyo under $1000 and fill out the passenger details"
- Browser autonomously navigates, searches, clicks, and inputs data
- Built on Chromium with ChatGPT integrated into navigation
- AI can "see" page content via DOM and interact with it

**The Agentic Layer of the Web:**
Sites must now be optimized for AI agents acting as customers, not just human eyes.

**Agent Experience (AX):**
- Define how easily a software agent can navigate the site to complete a goal
- If checkout is convoluted or lacks semantic labeling, agents fail
- User simply told "I couldn't complete the purchase" → sale lost to competitor

**Implication:** UX now includes AX. E-commerce and service sites need "agent-friendly" architecture.`,
        agent_type: 'seo_aeo',
        metadata: { section: "agentic_search", source: "research_q4_2025", line_start: 182, line_end: 196, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Technical Requirements for AI Agents",
        content: `Optimization for Agent Mode requires strict adherence to accessibility and semantic standards:

1. **ARIA Labels:** AI agents rely heavily on Accessibility Rich Internet Applications attributes to understand button functions (e.g., aria-label="Add to Cart"). Visual-only buttons are invisible to agents.

2. **Semantic HTML:** Use proper tags (<nav>, <article>, <button>) rather than generic <div> soup. Agents parse page structure through semantics.

3. **PotentialAction Schema:** The critical new frontier. Declare what CAN BE DONE on a page using schema.org/Action and potentialAction.
   - Example: E-commerce product pages should include BuyAction schema with target URL and required inputs
   - Allows agents to understand exactly how to initiate a purchase

4. **OpenAI Agent Builder Integration:** Create custom "Actions" defining API endpoints via JSON schema. ChatGPT can bypass UI entirely and interact with backend directly.

**Future Vision:** Agents that query supply chain data to answer "Do we have inventory to satisfy demand?" This requires data structured and accessible via API or schema.`,
        agent_type: 'seo_aeo',
        metadata: { section: "agent_optimization", source: "research_q4_2025", line_start: 197, line_end: 208, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Schema Expansion & Semantic Web",
        content: `The "Semantic Web" concept is now a functional reality. AI agents require structured data to operate.

**Multimodal Schema:**
- With multimodal search (text, image, video), schema must extend to media objects
- VideoObject schema with detailed transcripts allows AI to "watch" and answer questions based on video content

**Entity Tagging:**
- Use sameAs links to Wikidata or Wikipedia
- Firmly disambiguate entities discussed on the page
- The Knowledge Graph is the ultimate arbiter of truth

**Entity Authority for 2026:**
- Build a "Digital Twin" of brand expertise
- Use Person schema for authors, Organization schema for company
- Ensure consistency across external platforms (Crunchbase, LinkedIn, Wikipedia)
- Verified entities with real-world footprints are retreats for trust in a world of infinite AI content`,
        agent_type: 'seo_aeo',
        metadata: { section: "schema_expansion", source: "research_q4_2025", line_start: 211, line_end: 220, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "AI Bot Management: llms.txt & robots.txt Strategy",
        content: `Webmasters face a strategic choice: block AI bots to protect IP, or allow them for visibility?

**The llms.txt Standard:**
- New standard providing markdown-based version of website for LLM training and RAG consumption
- Removes HTML/CSS noise, delivers pure information
- Acts as a "Sitemap for Reasoning"
- Increases likelihood of accurate ingestion

**Bot Control Decisions:**
- **GPTBot:** Scrapes for TRAINING (building future models). Blocking prevents content becoming part of GPT-5's "world knowledge"
- **OAI-SearchBot:** Scrapes for REAL-TIME RETRIEVAL (SearchGPT/Atlas). Blocking makes you invisible in current searches

**Recommendation:** For most commercial entities, allow OAI-SearchBot for visibility. GPTBot decisions depend on IP sensitivity.

**Bing data-nosnippet Attribute:**
- Mark specific sections as "off-limits" for AI summarization
- Use for paywalled content, legal disclaimers, user-generated comments
- Prevents AI from summarizing premium content or hallucinating from low-quality comments
- Middle ground between full indexing and noindex`,
        agent_type: 'seo_aeo',
        metadata: { section: "bot_management", source: "research_q4_2025", line_start: 220, line_end: 236, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Platform Optimization: Google vs Bing vs OpenAI",
        content: `**Google Search Console Updates (December 2025):**
- New "Social Channels" report tracks impressions/clicks for brand's social profiles in Search
- Confirms Google views Brand Entity as distributed network
- LinkedIn post ranking contributes to brand's search performance
- Action: Verify social profiles using Organization schema (sameAs property)

**Google AI Mode in Discover:**
- Features: "Summarize with AI," "Ask a follow-up," "Dive deeper"
- Pushes more Discover traffic into AI loops
- Optimize content for follow-up questions (predict next step in user journey)

**Bing Webmaster Tools:**
- IndexNow for instant indexing
- data-nosnippet for AI control
- Aggressive generative feature integration
- Bing optimization = Copilot optimization (powers Windows + Office 365)`,
        agent_type: 'seo_aeo',
        metadata: { section: "platform_strategies", source: "research_q4_2025", line_start: 239, line_end: 258, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Core SEO/AEO Directives for Chatbot Agents",
        content: `Strategic directives for SEO/AEO agents - guide users from "vanity metrics" (rankings) to "value metrics" (visible citations, agent completions):

1. **Advise Granularity:** Break broad topics into specific, data-rich sub-pages (Wickes Strategy - create "Chrome Victorian Scroll Door Handles" not just "Door Handles")

2. **Enforce Schema:** Treat Schema as mandatory code, not metadata. Prioritize Action and FAQ types.

3. **Warn Against Slop:** Aggressively flag content lacking "Information Gain." Advise adding "Experience" signals (quotes, data, photos).

4. **Monitor AIOs:** Advise manual checking of "Share of Voice" in AI Overviews for top 20 keywords.

5. **Prepare for Agents:** Recommend auditing checkout/conversion flows for accessibility (ARIA) to ensure Agent compatibility.

6. **Implement llms.txt:** Advise creating this file to feed the "Reasoning Engines" of the future.

**The New Reality:** Visibility belongs to those who speak the language of the machine: Structure, Precision, and Authenticity.`,
        agent_type: 'seo_aeo',
        metadata: { section: "core_directives", source: "research_q4_2025", line_start: 298, line_end: 311, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Wickes Case Study: Architecture of Intent",
        content: `Wickes (UK home improvement retailer) achieved +185% visibility increase in the December 2025 update.

**What They Did:**
- Expanded site architecture to highly specific product subcategories
- Created "Chrome Victorian Scroll Door Handles" instead of generic "Door Handles"
- 100% intent match vs 20% match from generic pages

**Success Factors:**
1. **Granular Taxonomy:** Specific subcategories for precise intent matching
2. **Long-Tail Optimization:** Problem-oriented queries at category level
3. **Entity-First Structure:** Clear structural data and logical hierarchy helped Google's entity graph understand product relationships

**AEO Angle:** AI agents look for "Precision." When user asks for "Victorian chrome handles," AI prefers explicit match over generic "Door Hardware."

**Key Takeaway:** Resolution beats aggregation. The specific H1 tag matches the specific entity the user requested.`,
        agent_type: 'seo_aeo',
        metadata: { section: "case_study_wickes", source: "research_q4_2025", line_start: 262, line_end: 271, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Hostinger Case Study: Authority Dilution Warning",
        content: `Hostinger experienced catastrophic -87% visibility decline in December 2025 update.

**What Went Wrong:**
1. **Failed Internationalization:** Improper hreflang, replicated English content across regional subdomains without localization. Automated translation triggered duplicate content flags.

2. **Generic SEO Content:** Articles like "how to start a blog" offered no unique insight compared to thousands of existing articles.

3. **Migration Technical Issues:** Redirect chains, canonical loops during recalibration period

**The "Mass-Produced" Flag:**
- Sheer volume of pages created simultaneously likely tripped classifier
- Even manually translated content, the VELOCITY of publication mimicked AI spam

**Key Lessons:**
- Scale is no longer a moat - it's a liability without quality control
- 50 regional subdomains = liability without distinct local authority
- Velocity is a risk factor - large deployments should roll out in phases
- Build local authority signals (backlinks from local domains) before expanding`,
        agent_type: 'seo_aeo',
        metadata: { section: "case_study_hostinger", source: "research_q4_2025", line_start: 273, line_end: 280, version: "1.0", uploaded_at: new Date().toISOString() }
    },

    // ==========================================
    // Content Writer Chunks (10 chunks)
    // ==========================================
    {
        title: "December 2025 Core Update: Information Gain Signals",
        content: `On December 11, 2025, Google commenced its third core update of the year, triggering volatility levels of 8.7/10 - the highest recorded in 2025.

**The Shift: From Relevance to Information Gain**
The algorithm moved beyond "relevance" signals (does keyword match page?) to "Information Gain" signals (does this page add anything NEW to the index?).

**The Problem It Addresses:**
LLMs allowed publishers to generate thousands of "relevant but derivative" articles - rewrites of existing top 10 results. The December update devalues this entire content class.

**Impact by Category:**
- Mass-Produced AI Content: -87% visibility (recovery: 4-8 months)
- Thin Affiliate Sites: -71% traffic (recovery: 2-6 months)
- YMYL (Health/Finance): -67% visibility (recovery: 6-12 months)
- Generic "SEO" Content: -63% ranking (recovery: 3-6 months)

**Winners:** E-commerce category pages with granular taxonomy (Wickes: +185%)`,
        agent_type: 'content_writer',
        metadata: { section: "core_update_2025", source: "research_q4_2025", line_start: 17, line_end: 35, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "AI Content Detection Signatures to Avoid",
        content: `The December 2025 update refined "Helpful Content" classifiers to detect semantic signatures of low-effort AI generation.

**Signatures That Trigger Penalties:**

1. **Lack of Information Gain:** Pages that merely summarize existing top-ranking results without adding:
   - Original data
   - Unique perspective
   - "Experience" signals

2. **Semantic Flattening:** Content using repetitive, median-probability phrasing characteristic of raw LLM output. Lacks the "burstiness" and "perplexity" of human writing.

3. **Ghost Authorship:** Articles attributed to generic personas OR lacking verifiable E-E-A-T signals. Now cross-referenced against Knowledge Graph.

**The Data:**
- 71% traffic drop for affiliate sites with thin aggregate reviews
- 87% negative impact on high-velocity AI content sites

**Critical Insight:** The "content velocity" strategy (flooding index for long-tail capture) is now OFFICIALLY A LIABILITY.`,
        agent_type: 'content_writer',
        metadata: { section: "ai_detection", source: "research_q4_2025", line_start: 25, line_end: 35, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "E-E-A-T Recalibration: Experience as the Differentiator",
        content: `The December 2025 update placed renewed, measurable emphasis on the "Experience" component of E-E-A-T.

**Sites That Saw Stability or Growth:**
- Could demonstrate first-hand usage of products
- Original photography
- Unique data points
- Personal narrative

**Sites That Were Demoted:**
- "Review" sites aggregating specifications from Amazon descriptions
- No product testing evidence
- No original analysis

**What "Experience" Looks Like:**
- Photos you took yourself
- Data from your own tests/usage
- Stories from your actual experience
- Specific details only someone who used the product would know

**Recovery Timeline for Experience Deficits:**
- YMYL sectors: 6-12 months to rebuild trust signals
- Affiliate model: "Aggregation without testing" is effectively dead`,
        agent_type: 'content_writer',
        metadata: { section: "eeat_signals", source: "research_q4_2025", line_start: 59, line_end: 74, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Zero-Click Reality: 61% CTR Collapse",
        content: `The "Great Decoupling": Historic correlation between high organic rankings and high organic traffic has been SEVERED.

**The Data (Seer Interactive Audit):**
- Organic CTR collapse: From 1.76% to 0.61% (-61%) when AI Overview present
- Paid CTR crash: From 19.7% to 6.34% (-68%)
- Zero-click searches: 60% of all Google searches (77% on mobile)

**Why This Happens:**
AI Overviews satisfy intent directly. "How to fix a leaky faucet" → AIO provides step-by-step extracted from 3 sites → no click incentive.

**The Paradox:**
- Brands cited in AI Overviews earn 35% MORE organic clicks than non-cited
- 91% more paid clicks
- AIO acts as "trust filter" - pre-qualifies visitors

**Winner Take All Dynamic:**
- Cited in AIO = capture high-intent traffic
- Ranked #1 but NOT cited = invisible to majority who stop at summary`,
        agent_type: 'content_writer',
        metadata: { section: "zero_click", source: "research_q4_2025", line_start: 77, line_end: 98, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "AI Overview Citation Strategy",
        content: `While direct clicks decrease, visibility within AI Overviews drives brand awareness.

**The New Funnel Model:**
- AIO serves as "trust filter"
- Users who click through are highly qualified
- Already consumed summary, decided they need deeper expertise
- AI acts as pre-qualification layer

**Content Strategy for Citation:**

1. **Structure Content for Extraction:**
   - Provide answer upfront (40-60 word summary)
   - Use clear H2/H3 that directly ask questions
   - Include specific statistics (numbers = retrieval hooks)

2. **Include Citation-Worthy Elements:**
   - Quotes from named experts
   - Specific data points with dates
   - Links to authoritative sources (models trace trust graphs)

3. **Track New Metrics:**
   - "Share of Voice" in AI responses
   - "Citation Frequency" across LLMs
   - Manual prompt testing: How often mentioned as authority?

**Case Example:** Impressions up 27.56% YoY while clicks dropped 36.18% despite better rankings. This "Impression/Click Divergence" is the hallmark of AI era.`,
        agent_type: 'content_writer',
        metadata: { section: "citation_strategy", source: "research_q4_2025", line_start: 91, line_end: 106, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Hybrid Content Model: Human + Machine Writing",
        content: `Content strategy must adopt a hybrid model for 2026:

**For Humans (The Click-Through Audience):**
- Engaging, narrative-driven content
- High-experience signals (video, personal stories)
- Emotional connection and trust building
- Rhetorical questions to engage readers
- Varied sentence length and structure (burstiness)
- Personal insights and real-world examples

**For Machines (The Citation Audience):**
- Highly structured, data-dense content
- Schema-wrapped resources
- Tables and FAQs for easy extraction
- Direct answers to specific questions
- Clear heading hierarchy
- Specific data points and statistics

**The Balance:**
- Same content can serve both purposes
- Lead with structure (H2 question → answer block) for machines
- Expand with narrative and experience for humans
- Use schema to help machines parse the structure you've built

**Key Insight:** You need BOTH. Human engagement builds trust; machine readability gets you cited.`,
        agent_type: 'content_writer',
        metadata: { section: "hybrid_content", source: "research_q4_2025", line_start: 292, line_end: 296, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Writing Techniques That Beat AI Detectors",
        content: `Based on December 2025 update patterns, content that avoids detection exhibits specific characteristics:

**Add "Burstiness" (Sentence Variation):**
- Raw LLM output has consistent, median-probability phrasing
- Human writing has irregular rhythms
- Mix short punchy sentences. With longer, more complex ones that wind through multiple clauses before finally arriving at their point.

**Add "Perplexity" (Unexpected Elements):**
- LLMs default to predictable word choices
- Human writing includes surprising word combinations
- Use industry-specific jargon naturally
- Include colloquialisms or regional expressions

**First-Person Experience Markers:**
- "When I tested this..."
- "In my 10 years of..."
- "The biggest surprise was..."
- Specific details only direct experience provides

**What to Avoid:**
- Repetitive structure (every paragraph same length)
- Generic advice found in 100 other articles
- "Marketing language" (excessive qualifiers, vague superlatives)
- Fluff words that add no information`,
        agent_type: 'content_writer',
        metadata: { section: "writing_techniques", source: "research_q4_2025", line_start: 29, line_end: 35, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Share of Voice: The New Success Metric",
        content: `Traditional analytics (GA4) are increasingly blind to true content reach. A new measurement paradigm emerges.

**The Visibility Problem:**
- User reads your advice in AIO
- Internalizes your expertise
- Later navigates directly to site or searches brand name
- This "invisible influence" creates measurement crisis

**New Metrics to Track:**

1. **Share of Voice (SOV):**
   - Percentage of times brand mentioned across AI responses
   - Compare against competitors
   - Example: Bank of America achieved 32.2% visibility share for banking queries

2. **Citation Frequency:**
   - How often content is cited in AI summaries
   - Track across platforms (ChatGPT, Claude, Gemini, Perplexity)

3. **Topical Authority Score:**
   - Navy Federal Credit Union "punched above weight" despite smaller DA
   - Had highly trusted, specific content for niche queries
   - GEO is less about Domain Authority, more about Topical Authority

**Methodology:** Manual prompt testing across LLMs - "Best [category] for [persona]" queries to benchmark citation rate.`,
        agent_type: 'content_writer',
        metadata: { section: "new_metrics", source: "research_q4_2025", line_start: 99, line_end: 106, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Content Structure for AEO Success",
        content: `Structural patterns that maximize AI citation probability:

**The Answer Block Pattern:**
1. H2 heading as a question ("What is [Topic]?")
2. Immediate 40-60 word answer paragraph
3. Supporting details, examples, data
4. Related questions in H3s

**Schema Integration Points:**
- FAQPage for question-based content (9,200% impression increase documented)
- HowTo for step-by-step instructions
- Dataset for original research and statistics
- Article with author Person schema for E-E-A-T

**Formatting for Extraction:**
- Use bullet points and numbered lists
- Include comparative tables
- Bold key terms and statistics
- Clear heading hierarchy (H1 → H2 → H3)

**Internal Linking for Entities:**
- Build topic clusters with clear relationships
- Use descriptive anchor text
- Create a "knowledge graph" within your site
- Help AI understand entity relationships

**Content Depth Signals:**
- Go beyond surface-level coverage
- Include "what competitors aren't saying"
- Fill topical gaps in existing content
- Provide actionable, specific recommendations`,
        agent_type: 'content_writer',
        metadata: { section: "content_structure", source: "research_q4_2025", line_start: 127, line_end: 149, version: "1.0", uploaded_at: new Date().toISOString() }
    },
    {
        title: "Recovery Strategy for Algorithm-Hit Content",
        content: `Recovery timelines and strategies based on December 2025 update impact:

**For Mass-Produced AI Content (-87% visibility):**
- Timeline: 4-8 months
- Action: Complete content audit, remove or substantially rewrite derivative content
- Add: Original data, expert interviews, first-hand testing
- Reduce: Publication velocity, focus on depth over volume

**For Thin Affiliate Sites (-71% traffic):**
- Timeline: 2-6 months
- Action: Add actual product testing evidence
- Include: Original photography, comparison data you gathered
- Stop: Aggregating Amazon specs without adding value

**For YMYL Content (-67% visibility):**
- Timeline: 6-12 months (longest recovery)
- Action: Rebuild trust signals systematically
- Add: Author credentials, expert review, medical/legal disclaimers
- Verify: All claims with authoritative citations

**For Generic SEO Content (-63% ranking):**
- Timeline: 3-6 months
- Action: Find your unique angle
- Add: User-centric value beyond keyword targeting
- Stop: Writing what 100 other articles already say

**Universal Recovery Steps:**
1. Reduce content velocity (quantity signals risk)
2. Add Experience markers to every piece
3. Implement proper E-E-A-T schema
4. Build genuine authority signals over time`,
        agent_type: 'content_writer',
        metadata: { section: "recovery_strategy", source: "research_q4_2025", line_start: 65, line_end: 74, version: "1.0", uploaded_at: new Date().toISOString() }
    }
]

async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        })
        return response.data[0].embedding
    } catch (error) {
        console.error('Error generating embedding:', error)
        throw error
    }
}


async function uploadChunks() {
    console.log('🚀 Starting research document upload to RAG...')
    console.log(`📊 Total chunks to process: ${researchChunks.length}`)
    console.log(`   - SEO/AEO agent: ${researchChunks.filter(c => c.agent_type === 'seo_aeo').length}`)
    console.log(`   - Content writer: ${researchChunks.filter(c => c.agent_type === 'content_writer').length}`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < researchChunks.length; i++) {
        const chunk = researchChunks[i]
        console.log(`\n📄 [${i + 1}/${researchChunks.length}] Processing: "${chunk.title}"`)
        console.log(`   Agent type: ${chunk.agent_type}`)

        try {
            // Generate embedding for title + content combined
            const textToEmbed = `${chunk.title}\n\n${chunk.content}`
            console.log(`   Generating embedding (${textToEmbed.length} chars)...`)
            const embedding = await generateEmbedding(textToEmbed)
            console.log(`   ✓ Embedding generated (${embedding.length} dimensions)`)

            // Insert into agent_documents
            const { data, error } = await supabase
                .from('agent_documents')
                .insert({
                    title: chunk.title,
                    content: chunk.content,
                    agent_type: chunk.agent_type,
                    embedding: embedding,
                    metadata: chunk.metadata,
                })
                .select()

            if (error) {
                console.error(`   ❌ Insert error:`, error.message)
                errorCount++
            } else {
                console.log(`   ✓ Inserted successfully`)
                successCount++
            }

            // Rate limiting - wait 200ms between embeddings
            await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
            console.error(`   ❌ Processing error:`, error)
            errorCount++
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Upload Complete!')
    console.log(`   ✓ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(50))

    // Verify counts
    console.log('\n🔍 Verifying insertion...')
    const { data: seoCount } = await supabase
        .from('agent_documents')
        .select('id', { count: 'exact' })
        .eq('agent_type', 'seo_aeo')
        .eq('metadata->>source', 'research_q4_2025')

    const { data: writerCount } = await supabase
        .from('agent_documents')
        .select('id', { count: 'exact' })
        .eq('agent_type', 'content_writer')
        .eq('metadata->>source', 'research_q4_2025')

    console.log(`   SEO/AEO chunks in DB: ${seoCount?.length || 0}`)
    console.log(`   Content writer chunks in DB: ${writerCount?.length || 0}`)
}

// Run the upload
uploadChunks()
    .then(() => {
        console.log('\n✅ Script completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error)
        process.exit(1)
    })
