# FlowIntent homepage JavaScript audit

**Task:** Reduce JavaScript weight and add a meaningful `noscript` fallback  
**Plan move:** Unblock AI crawlers & fix homepage foundation  
**Plan item:** `707722fb-a2ea-4645-9bba-4b0f29a4bff1`  
**Observed:** 2026-07-27 UTC

## Baseline

The current audit health snapshot reports:

- 16 external scripts on the homepage.
- Approximately 30 KB of inline JavaScript.
- Only 57 characters of server-rendered text in the crawler snapshot.
- An existing `noscript` block containing only a hidden Google Tag Manager iframe.
- Homepage content is behind `LandingPageClient`, a `'use client'` component that imports the navbar, animated background, hero, feature sections, interactive mode picker, FAQ, final CTA, and footer.
- The homepage also uses `Suspense` around that client boundary and a client-side search-parameter redirect effect.
- `posthog-js` is initialized from the root layout provider when configured.
- Root layout includes GTM bootstrap code, async Google Analytics, inline `gtag` initialization, JSON-LD, and the GTM `noscript` iframe.
- The homepage FAQ JSON-LD is injected with `next/script` using `afterInteractive`.

## Current crawl evidence

- `https://flowintent.com/robots.txt` currently returns explicit `Allow: /` rules for GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, and OAI-SearchBot. The latest audit snapshot still reports those five bots as blocked, so robots behavior needs a post-deploy recheck rather than assuming the source and audit are synchronized.
- The homepage currently returns HTTP 200, but the measured crawler snapshot sees almost no meaningful text.
- The audit flags missing H1, missing direct-answer/BLUF opening, zero internal links, minimal `noscript`, heavy JS, and low server-rendered content. This task addresses the rendering/JS/noscript portion; the separate H1/BLUF item remains a dependency.

## Likely highest-leverage changes

1. **Move the readable homepage shell into a server component.** Keep the value proposition, primary navigation, key benefits, CTA, FAQ copy, and internal links in server-rendered HTML. Isolate only the interactive mode picker, animations, auth-error redirect, and other browser-dependent behavior behind small client islands.
2. **Replace the global inline analytics bootstraps with deferred loading.** Use `next/script` with `strategy="afterInteractive"` or `strategy="lazyOnload"` for GTM/GA where measurement requirements allow. Preserve consent/privacy requirements and verify page-view coverage before removing any current provider behavior.
3. **Avoid loading PostHog for anonymous homepage crawls unless needed.** Initialize it in a deferred client island or only after idle/interaction; do not change authenticated product analytics without checking event requirements.
4. **Keep structured data server-rendered.** JSON-LD should remain in the document head/body as static markup; it does not need to wait for hydration.
5. **Replace the GTM-only `noscript` with useful content.** Include a concise H2/value proposition and links to `/aeo-auditor`, `/blog`, `/case-studies`, `/prices`, and `/#faq`. Keep the GTM iframe only if required by the measurement setup, but do not let it be the only fallback.
6. **Audit the embedded YouTube iframe.** It is a likely non-critical third-party request on the homepage. Consider a poster/link or lazy-loaded iframe activated on interaction/viewport entry.

## Proposed `noscript` copy

> FlowIntent helps marketing teams optimize content for Google and AI answer engines such as ChatGPT, Perplexity, and Gemini. Use FlowIntent for answer engine optimization, buyer-intent analysis, AI trust audits, and content planning.
>
> Explore the [AEO Auditor](/aeo-auditor), read the [FlowIntent blog](/blog), compare [case studies](/case-studies), view [pricing](/prices), or browse the [FAQ](/#faq).

## Verification gates

Before/after production or preview checks should record:

- External script count: target <= 8.
- Inline JS: target < 15 KB.
- Server-rendered meaningful text: materially above the current 57-character baseline.
- Exactly one homepage H1 and a direct-answer first paragraph (tracked by the companion homepage-foundation item).
- `noscript` contains the value proposition and >= 3 internal links.
- JS-disabled/curl output contains the value proposition and links.
- No broken CTA/internal links.
- Lighthouse or equivalent: compare JS transfer/parse/execute time and LCP/TBT; task target is crawl/load completion under 2 seconds where the test environment permits.
- Verify analytics events and interactive homepage behavior after deferral.
- Re-fetch with representative bot user agents and re-run the GEO/AEO audit after deployment.

## Scope boundary

This audit is a safe, read-only first step. No production code or live site was changed. Publishing code changes remains approval-gated by the plan item.
