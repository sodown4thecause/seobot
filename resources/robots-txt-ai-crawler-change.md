# robots.txt AI crawler access change

**Date:** 2026-07-27  
**Plan item:** `d487254b-ab42-4afc-a781-f2345c349142`  
**AARRR stage:** Acquisition  
**Channel:** AI visibility

## Change
Updated the root `robots.txt` policy to explicitly allow public-page crawling by:

- GPTBot
- ChatGPT-User
- ClaudeBot
- PerplexityBot
- Google-Extended

Private application, authentication, dashboard, API, onboarding, and test routes remain disallowed. The existing sitemap URL is retained.

## Why
The audit identified these five crawlers as blocked, limiting Flowintent's eligibility for citations in ChatGPT, Claude, Perplexity, and Google's AI experiences. Flowintent currently appears in Claude for pricing queries but is missing from strategy and competitive-comparison answers; crawler access is a prerequisite for the broader content and authority work.

## Deployment and verification
This change is staged in the pull request for deployment to production. After deployment:

1. Fetch `https://flowintent.com/robots.txt` with each target user-agent and confirm public paths are allowed while private routes remain blocked.
2. Use Google Search Console's robots.txt tester or URL Inspection UI, if available, to request a fresh check.
3. Monitor Search Console crawl/indexing signals for 48 hours.

The connected Google Search Console capability is read-only and does not expose a robots.txt submission/write endpoint, so a direct API submission could not be completed by the agent. Google Search Console also does not provide AI-crawler-specific visibility reporting.

## Expected impact
Unblocks crawling of public Flowintent content by the five requested AI/search agents. This is an enabling change, not a guarantee of indexing or citation; the planned AEO hub, BLUF content, and comparison/strategy guides remain necessary to address the citation gap.
