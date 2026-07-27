# Flowintent robots.txt change log

**Plan move:** Unblock AI crawlers & fix homepage foundation  
**Plan item:** `d487254b-ab42-4afc-a781-f2345c349142`  
**Changed:** 2026-07-27 UTC

## Change

Updated `/robots.txt` so these AI/search crawlers have an explicit `Allow: /` rule while sensitive application paths remain disallowed:

- GPTBot
- ChatGPT-User
- ClaudeBot
- PerplexityBot
- Google-Extended

The existing `User-Agent: *` policy already allows `/`; the explicit bot groups make the intended AI-crawler policy unambiguous and preserve exclusions for `/api/`, `/admin/`, `/dashboard/`, authentication, and test paths. The sitemap declaration remains `https://flowintent.com/sitemap.xml`.

## Verification

After deployment, fetch `https://flowintent.com/robots.txt` using each requested user agent and monitor Google Search Console crawl/indexing signals. Google Search Console does not expose a direct robots.txt submission endpoint through the connected integration; recrawl occurs after deployment, with URL Inspection available for a manual request if needed.
