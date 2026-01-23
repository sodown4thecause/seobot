# Publishing the DataForSEO Integration Guide to Sanity

## Status

✅ **Guide Written** - Complete technical guide with working examples
✅ **Copyedited** - Applied Elements of Style for clarity
✅ **Committed to Git** - Saved in docs/plans/
✅ **Publish Script Created** - Ready to deploy to Sanity CMS

## To Publish

### 1. Get Sanity Write Token

1. Go to https://sanity.io/manage
2. Select your project: `5hi8oae6`
3. Navigate to **API** → **Tokens**
4. Create a new token with **Editor** permissions
5. Copy the token

### 2. Add Token to Environment

Add to `.env.local`:

```env
SANITY_WRITE_TOKEN=your_token_here
```

### 3. Publish

```bash
npm run sanity:publish:guide
```

This will:
- Parse the markdown guide
- Convert to Portable Text format
- Extract metadata (title, difficulty, read time)
- Create/update the guide in Sanity
- Return the Studio URL to view it

### 4. Verify

- Studio: https://flowintent.sanity.studio/structure/guide;guide-the-complete-dataforseo-integration-guide-for-ai-powered-content-platforms
- Frontend: Your site's `/guides` page should list it

## Guide Details

**Title:** The Complete DataForSEO Integration Guide for AI-Powered Content Platforms
**Slug:** the-complete-dataforseo-integration-guide-for-ai-powered-content-platforms
**Difficulty:** Intermediate to Advanced
**Read Time:** 15 minutes
**Content Blocks:** ~250 (headings, paragraphs, lists)

## What's Included

- Three integration patterns (Direct API, MCP, AI SDK wrappers)
- Working TypeScript code examples
- Production patterns from flowintent.com
- Best practices for caching, rate limits, cost optimization
- AEO (Answer Engine Optimization) strategies
- Common gotchas and solutions

## Alternative: Manual Publish

If you prefer to publish manually via Sanity Studio:

1. Open Studio: https://flowintent.sanity.studio
2. Create new Guide document
3. Copy/paste content from `docs/plans/2026-01-23-dataforseo-ai-integration-guide.md`
4. Set metadata:
   - Difficulty: Intermediate
   - Read Time: 15
   - Publish Date: January 23, 2026

## Next Steps

After publishing:

1. **Share on Twitter/LinkedIn** - Technical content with code examples gets good engagement
2. **Submit to HackerNews** - Practical technical guides perform well
3. **Cross-post to Dev.to** - Reaches developer audience
4. **Add to documentation site** - Link from your main docs
5. **Track metrics** - Monitor views, time on page, code copy events

## Making It Searchable

The guide is optimized for:
- "DataForSEO AI integration"
- "DataForSEO MCP server"
- "AI agents SEO tools"
- "Answer Engine Optimization tutorial"
- "LLM SEO research automation"

Consider adding schema markup for TechnicalArticle when rendering on the frontend.
