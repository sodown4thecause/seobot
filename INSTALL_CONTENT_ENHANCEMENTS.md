# Content Writer Enhancement - Installation Guide

## Quick Start

### Step 1: Install Core Packages

```bash
# SEO & Readability
npm install readability text-statistics keyword-extractor

# Writing Quality
npm install write-good

# Content Analysis
npm install string-similarity

# Optional: Type definitions (if available)
npm install --save-dev @types/write-good
```

### Step 2: Update Your Content Quality Tools

The enhanced tools are already created in `lib/ai/content-quality-enhancements.ts`. 

To integrate them into your existing agent:

**File: `app/api/chat/route.ts`**

```typescript
// Add import
import { getEnhancedContentQualityTools } from '@/lib/ai/content-quality-enhancements'

// In your route handler, add to tools:
const enhancedTools = getEnhancedContentQualityTools()
const allTools = {
  ...seoTools,
  ...contentQualityTools,
  ...enhancedTools, // Add this line
}
```

### Step 3: Test the Integration

1. Start your dev server: `npm run dev`
2. Navigate to `/dashboard`
3. Switch to Content Writer Agent
4. Try these commands:
   - "Analyze this content for SEO: [paste content]"
   - "Check the quality of this content: [paste content]"
   - "Fact-check this content: [paste content]"

---

## Package Details

### `readability` / `text-statistics`
**Purpose:** Calculate readability scores (Flesch-Kincaid, SMOG, etc.)

**Usage:**
```typescript
import { TextStatistics } from 'text-statistics'
const stats = new TextStatistics(text)
const score = stats.fleschKincaidReadingEase()
```

### `write-good`
**Purpose:** Detect writing quality issues (passive voice, weasel words, etc.)

**Usage:**
```typescript
import writeGood from 'write-good'
const suggestions = writeGood(text)
```

### `keyword-extractor`
**Purpose:** Extract and analyze keywords in content

**Usage:**
```typescript
import keywordExtractor from 'keyword-extractor'
const keywords = keywordExtractor.extract(text, {
  language: 'english',
  remove_digits: true,
})
```

### `string-similarity`
**Purpose:** Calculate similarity between texts (duplicate detection)

**Usage:**
```typescript
import { compareTwoStrings } from 'string-similarity'
const similarity = compareTwoStrings(text1, text2)
```

---

## Next Steps

1. **Integrate with Perplexity for Fact-Checking:**
   - Update `factCheckContentTool` in `content-quality-enhancements.ts`
   - Add Perplexity API calls for actual verification

2. **Add Quality Metrics to UI:**
   - Show quality scores in chat responses
   - Add quality dashboard component

3. **Cache Quality Results:**
   - Use your existing `lru-cache` for caching expensive operations
   - Cache readability and keyword analysis results

4. **Add Real-time Quality Feedback:**
   - Show quality metrics as content is generated
   - Provide inline suggestions for improvement

---

## Troubleshooting

### Package Installation Issues

If `readability` package doesn't work, try:
```bash
npm install text-statistics
```

### TypeScript Errors

If you get TypeScript errors, you may need to:
1. Add type definitions manually
2. Use `// @ts-ignore` for packages without types
3. Create custom type definitions

### Runtime Errors

If you encounter runtime errors:
1. Check that all packages are installed: `npm list`
2. Verify imports are correct
3. Check browser console for detailed errors

---

## Support

For issues or questions:
1. Check the main documentation: `CONTENT_WRITER_ENHANCEMENT_PACKAGES.md`
2. Review the implementation: `lib/ai/content-quality-enhancements.ts`
3. Test individual tools in isolation

