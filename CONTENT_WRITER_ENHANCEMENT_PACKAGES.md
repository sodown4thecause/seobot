# Content Writer RAG Agent - Enhancement Packages

## Overview
This document lists recommended npm packages to enhance your Content Writer RAG agent for:
- ✅ High SEO/AEO scores
- ✅ Human-like writing quality
- ✅ Factual accuracy (no hallucinations)
- ✅ Content quality optimization

---

## 📦 Recommended npm Packages

### 1. **SEO & AEO Optimization**

#### `seo-analyzer` / `@seo-tools/analyzer`
```bash
npm install seo-analyzer
```
**Purpose:** Analyze content for SEO metrics (keyword density, readability, meta tags)
**Use Case:** Real-time SEO scoring during content generation
**Integration:** Add as a tool in your AI SDK 6 agent

#### `readability` / `text-statistics`
```bash
npm install readability text-statistics
```
**Purpose:** Calculate readability scores (Flesch-Kincaid, SMOG, etc.)
**Use Case:** Ensure content is human-readable and not too technical
**Integration:** Post-process generated content to verify readability

#### `keyword-extractor` / `natural`
```bash
npm install keyword-extractor natural
```
**Purpose:** Extract keywords, analyze text structure, NLP utilities
**Use Case:** Keyword density analysis, content structure optimization
**Integration:** Analyze content before/after generation

#### `metascraper` / `@microlink/metascraper`
```bash
npm install metascraper
```
**Purpose:** Extract and validate meta tags, Open Graph data
**Use Case:** Ensure generated meta titles/descriptions are optimal
**Integration:** Validate meta content quality

---

### 2. **Human-Like Writing & Style**

#### `textlint` + plugins
```bash
npm install textlint textlint-rule-write-good textlint-rule-en-max-word-count
```
**Purpose:** Writing quality checks, style improvements
**Use Case:** Detect passive voice, wordiness, complex sentences
**Integration:** Post-process content to improve human-like quality

#### `write-good`
```bash
npm install write-good
```
**Purpose:** Check for common writing issues (passive voice, weasel words, etc.)
**Use Case:** Make AI-generated content sound more natural
**Integration:** Use as a validation tool in your content pipeline

#### `prose-mirror` / `@tiptap/core`
```bash
npm install @tiptap/core @tiptap/starter-kit
```
**Purpose:** Rich text editing with style analysis
**Use Case:** Analyze writing style, sentence structure
**Integration:** Optional - for advanced text analysis

#### `sentence-splitter` / `sentence-boundary-detection`
```bash
npm install sentence-splitter
```
**Purpose:** Proper sentence segmentation
**Use Case:** Ensure natural sentence flow and structure
**Integration:** Pre-process content for better structure

---

### 3. **Fact-Checking & Hallucination Detection**

#### `@factcheck/factchecker` (if available) or custom implementation
**Purpose:** Fact-checking against verified sources
**Use Case:** Verify claims in generated content
**Integration:** Post-generation fact-checking pipeline

#### `@tavily/tavily-search` (Tavily Search API)
```bash
npm install @tavily/tavily-search
```
**Purpose:** Real-time web search for fact verification
**Use Case:** Verify facts before including in content
**Integration:** Add as a tool in your AI SDK 6 agent

#### `@anthropic-ai/verification` (if available)
**Purpose:** Content verification and citation
**Use Case:** Ensure all claims are verifiable
**Integration:** Use with Perplexity/Jina for fact-checking

#### Custom RAG-based fact-checking
**Purpose:** Use your existing RAG system to verify facts
**Use Case:** Cross-reference generated content with your knowledge base
**Integration:** Query Supabase vector DB for fact verification

---

### 4. **Content Quality & Originality**

#### `@textlint/textlint` + `textlint-rule-no-dead-link`
```bash
npm install textlint textlint-rule-no-dead-link
```
**Purpose:** Content quality linting
**Use Case:** Check for broken links, quality issues
**Integration:** Post-generation validation

#### `diff` / `fast-diff`
```bash
npm install diff fast-diff
```
**Purpose:** Compare content versions, detect similarities
**Use Case:** Ensure content variations are sufficiently different
**Integration:** Compare generated content against existing content

#### `string-similarity`
```bash
npm install string-similarity
```
**Purpose:** Calculate text similarity scores
**Use Case:** Detect duplicate or too-similar content
**Integration:** Compare against existing content in your database

---

### 5. **Advanced NLP & Text Processing**

#### `compromise` / `nlp-compromise`
```bash
npm install compromise
```
**Purpose:** Natural language processing, text analysis
**Use Case:** Analyze sentence structure, grammar, style
**Integration:** Advanced text analysis for quality improvement

#### `@nlpjs/core` + `@nlpjs/lang-en`
```bash
npm install @nlpjs/core @nlpjs/lang-en
```
**Purpose:** Full NLP pipeline (tokenization, POS tagging, sentiment)
**Use Case:** Deep text analysis for human-like quality
**Integration:** Analyze content structure and quality

#### `sentiment` / `node-sentiment`
```bash
npm install sentiment
```
**Purpose:** Sentiment analysis
**Use Case:** Ensure appropriate tone for content
**Integration:** Validate tone matches user requirements

---

### 6. **Content Structure & Formatting**

#### `markdown-it` + plugins
```bash
npm install markdown-it markdown-it-anchor markdown-it-table-of-contents
```
**Purpose:** Markdown parsing and structure analysis
**Use Case:** Ensure proper heading hierarchy (H1-H6) for SEO
**Integration:** Validate content structure

#### `cheerio`
```bash
npm install cheerio
```
**Purpose:** HTML parsing and manipulation
**Use Case:** Analyze HTML structure, validate semantic HTML
**Integration:** Post-process generated HTML content

---

### 7. **Integration with Your Existing Stack**

#### `@upstash/ratelimit` (already installed ✅)
**Purpose:** Rate limiting for API calls
**Use Case:** Prevent API abuse, control costs
**Integration:** Already integrated

#### `lru-cache` (already installed ✅)
**Purpose:** Caching expensive operations
**Use Case:** Cache SEO analysis, fact-checking results
**Integration:** Already integrated - extend for content quality caching

---

## 🚀 Implementation Strategy

### Phase 1: Core Quality Tools (Week 1)
1. Install `readability`, `text-statistics` for readability scoring
2. Install `write-good` for style checking
3. Install `string-similarity` for duplicate detection
4. Create content quality validation tool

### Phase 2: SEO/AEO Optimization (Week 2)
1. Install `seo-analyzer` or build custom SEO analyzer
2. Install `keyword-extractor` for keyword analysis
3. Integrate with DataForSEO MCP for keyword data
4. Add SEO scoring to content generation pipeline

### Phase 3: Fact-Checking (Week 3)
1. Integrate Tavily Search API for fact verification
2. Use Perplexity API for fact-checking (already integrated)
3. Create fact-checking tool for AI SDK 6
4. Add citation generation

### Phase 4: Human-Like Writing (Week 4)
1. Install `textlint` with writing quality rules
2. Install `compromise` for advanced NLP
3. Create style improvement tool
4. Add human-like writing validation

---

## 📝 Example Tool Implementation

### Content Quality Validation Tool
```typescript
// lib/ai/content-quality-tools.ts (extend existing file)

import { tool } from 'ai'
import { z } from 'zod'
import * as readability from 'readability'
import * as writeGood from 'write-good'
import { checkSimilarity } from 'string-similarity'

export const validateContentQualityTool = tool({
  description: 'Comprehensive content quality validation including readability, style, and originality checks',
  parameters: z.object({
    content: z.string().describe('The content to validate'),
    targetKeywords: z.array(z.string()).optional().describe('Target keywords for SEO'),
  }),
  execute: async ({ content, targetKeywords = [] }) => {
    // Readability check
    const readabilityScore = readability(content)
    
    // Writing quality check
    const writingIssues = writeGood(content)
    
    // Keyword density (if keywords provided)
    const keywordAnalysis = targetKeywords.map(keyword => {
      const matches = (content.match(new RegExp(keyword, 'gi')) || []).length
      const density = (matches / content.split(/\s+/).length) * 100
      return { keyword, count: matches, density }
    })
    
    // Overall quality score
    const qualityScore = calculateQualityScore({
      readability: readabilityScore,
      writingIssues: writingIssues.length,
      keywordCoverage: keywordAnalysis.filter(k => k.count > 0).length / targetKeywords.length,
    })
    
    return {
      qualityScore,
      readability: {
        score: readabilityScore,
        level: getReadabilityLevel(readabilityScore),
      },
      writingIssues: writingIssues.slice(0, 5), // Top 5 issues
      keywordAnalysis,
      recommendations: generateRecommendations({
        readability: readabilityScore,
        issues: writingIssues,
        keywords: keywordAnalysis,
      }),
      summary: `Content quality score: ${qualityScore}/100`,
    }
  },
})
```

### SEO Analysis Tool
```typescript
export const analyzeSEOContentTool = tool({
  description: 'Analyze content for SEO optimization including keyword density, meta tags, and structure',
  parameters: z.object({
    content: z.string(),
    title: z.string().optional(),
    metaDescription: z.string().optional(),
    targetKeywords: z.array(z.string()),
  }),
  execute: async ({ content, title, metaDescription, targetKeywords }) => {
    // Keyword density analysis
    const keywordDensity = calculateKeywordDensity(content, targetKeywords)
    
    // Title analysis
    const titleAnalysis = title ? {
      length: title.length,
      optimal: title.length >= 50 && title.length <= 60,
      containsPrimaryKeyword: targetKeywords[0] ? title.toLowerCase().includes(targetKeywords[0].toLowerCase()) : false,
    } : null
    
    // Meta description analysis
    const metaAnalysis = metaDescription ? {
      length: metaDescription.length,
      optimal: metaDescription.length >= 155 && metaDescription.length <= 160,
      containsKeywords: targetKeywords.some(k => metaDescription.toLowerCase().includes(k.toLowerCase())),
    } : null
    
    // Heading structure
    const headingStructure = analyzeHeadings(content)
    
    // Overall SEO score
    const seoScore = calculateSEOScore({
      keywordDensity,
      titleAnalysis,
      metaAnalysis,
      headingStructure,
    })
    
    return {
      seoScore,
      keywordDensity,
      titleAnalysis,
      metaAnalysis,
      headingStructure,
      recommendations: generateSEORecommendations({
        keywordDensity,
        titleAnalysis,
        metaAnalysis,
        headingStructure,
      }),
      summary: `SEO score: ${seoScore}/100`,
    }
  },
})
```

### Fact-Checking Tool
```typescript
export const factCheckContentTool = tool({
  description: 'Verify factual claims in content using web search and knowledge base',
  parameters: z.object({
    content: z.string().describe('Content to fact-check'),
    claims: z.array(z.string()).optional().describe('Specific claims to verify'),
  }),
  execute: async ({ content, claims }) => {
    // Extract claims if not provided
    const extractedClaims = claims || extractClaims(content)
    
    // Verify each claim using Perplexity/Jina
    const verificationResults = await Promise.all(
      extractedClaims.map(async (claim) => {
        // Use Perplexity API (already integrated)
        const verification = await verifyClaimWithPerplexity(claim)
        
        // Use RAG system for additional verification
        const ragVerification = await verifyClaimWithRAG(claim)
        
        return {
          claim,
          verified: verification.verified && ragVerification.verified,
          confidence: (verification.confidence + ragVerification.confidence) / 2,
          sources: [...verification.sources, ...ragVerification.sources],
        }
      })
    )
    
    const verifiedCount = verificationResults.filter(r => r.verified).length
    const overallConfidence = verificationResults.reduce((sum, r) => sum + r.confidence, 0) / verificationResults.length
    
    return {
      totalClaims: verificationResults.length,
      verifiedClaims: verifiedCount,
      verificationRate: (verifiedCount / verificationResults.length) * 100,
      overallConfidence,
      results: verificationResults,
      summary: `${verifiedCount}/${verificationResults.length} claims verified (${overallConfidence.toFixed(0)}% confidence)`,
    }
  },
})
```

---

## 🔗 Integration with Existing Tools

### With DataForSEO MCP
- Use keyword data for keyword density analysis
- Use SERP data for content optimization
- Use competitor analysis for content gaps

### With Jina
- Use for semantic similarity checking
- Use for content clustering
- Use for duplicate detection

### With Perplexity
- Use for fact-checking
- Use for real-time information retrieval
- Use for citation generation

### With Grok
- Use for content generation
- Use for style matching
- Use for tone adjustment

### With Winston AI (already integrated ✅)
- Use for plagiarism detection
- Use for AI content detection
- Use for originality scoring

### With Rytr (already integrated ✅)
- Use for content generation
- Use for content improvement
- Use for tone control

---

## 📊 Quality Metrics to Track

1. **SEO Score** (0-100)
   - Keyword density
   - Meta tag optimization
   - Heading structure
   - Internal linking

2. **Readability Score** (0-100)
   - Flesch-Kincaid grade level
   - Sentence length
   - Word complexity

3. **Human-Like Score** (0-100)
   - Writing quality issues
   - Style consistency
   - Natural language flow

4. **Factual Accuracy** (0-100)
   - Verified claims percentage
   - Source quality
   - Citation completeness

5. **Originality Score** (0-100)
   - Plagiarism detection (Winston AI)
   - Similarity to existing content
   - Unique content percentage

---

## 🎯 Next Steps

1. **Install Priority Packages:**
   ```bash
   npm install readability text-statistics write-good string-similarity keyword-extractor
   ```

2. **Create Content Quality Service:**
   - `lib/ai/content-quality-service.ts`
   - Centralized quality checking logic

3. **Extend AI SDK 6 Tools:**
   - Add new tools to `lib/ai/content-quality-tools.ts`
   - Integrate with existing agent

4. **Add Quality Dashboard:**
   - Show quality metrics in UI
   - Real-time quality feedback

5. **Implement Quality Pipeline:**
   - Pre-generation: Keyword research
   - Generation: Quality-aware generation
   - Post-generation: Quality validation
   - Optimization: Iterative improvement

---

## 📚 Additional Resources

- [AI SDK 6 Documentation](https://sdk.vercel.ai/docs)
- [DataForSEO MCP Documentation](https://dataforseo.com)
- [Winston AI API](https://gowinston.ai/api-documentation/)
- [Rytr API](https://rytr.me/api)

