# FlowIntent SEO Audit Remediation Report

**Source audit:** Ahrefs project `10149729`
**Crawl:** 2026-07-26T08:40:45Z
**Remediation analysis:** 2026-07-26
**Site:** https://flowintent.com/

## Executive summary

The supplied audit was reproduced against production and traced to five shared causes:

1. The sitemap used 13 Webflow case-study slugs while the route rendered a separate two-item local registry.
2. `/reddit-gap` and authenticated `/diagnostic` redirected anonymous crawlers to login.
3. The homepage's entire marketing surface sat behind a client-only Suspense boundary.
4. Every Webflow article body repeated the template H1 and used unbounded CMS metadata.
5. An incomplete `SoftwareApplication` node was inherited by every page.

The issue-weighted baseline health score is **45/100**. The locally verified remediation state is **76/100**, pending deployment and a fresh external crawl. Performance and image categories were not measured and remain neutral in both scores.

## Root causes and remediation

| Area | Production evidence | Root cause | Implemented remediation |
|---|---|---|---|
| Sitemap 4XX | 13 case-study URLs returned 404 | Sitemap and route used different data sources | Sitemap now emits the two locally renderable case studies |
| Sitemap redirects | `/reddit-gap` and `/diagnostic` returned 307 to login | Reddit public-route deployment drift; diagnostic is intentionally authenticated | Keep `/reddit-gap` public and tested; remove `/diagnostic` from the sitemap |
| Missing H1 / no links | Homepage initial HTML had 0 H1, 0 links and only a client shell | `useSearchParams()` forced the entire landing page into a null Suspense fallback | Crawlable landing content now renders outside the small client redirect boundary |
| Multiple H1 | All 10 posts had two H1 elements | Webflow body H1 plus template H1 | Sanitized CMS H1 elements are normalized to H2 |
| Long titles/descriptions | All 10 posts inherited long CMS text | Title suffix plus unbounded CMS summary | Blog metadata is compacted at word boundaries to 60/155 characters |
| Short descriptions | `/blog`, `/privacy`, `/terms` | Page descriptions were 77–86 characters | Page-specific descriptions are now 110–160 characters |
| Rich-result errors | Incomplete `SoftwareApplication` on every HTML page | Missing truthful review/rating and Google-compatible offer price | Global graph is limited to `WebSite` and `Organization`; invalid merchant return policy removed |
| Indexable auth pages | Login/signup aliases inherited `index, follow` | No page-level robots metadata | All four auth surfaces now emit `noindex, nofollow` |
| Weak internal links | Articles and case studies had one specific incoming link | No related-content module | Rotating related articles and cross-linked case studies were added |
| Links to redirects | Marketing navbar linked directly to protected dashboard; guides linked to redirecting paths | Links targeted intermediary URLs | Dashboard targets login with a safe return path; guide references target final blog URLs |

Google's software-app rich-result requirements include `offers.price` plus a genuine review or aggregate rating. FlowIntent has no verified review data, so removing the incomplete global rich-result node is safer than inventing it: https://developers.google.com/search/docs/appearance/structured-data/software-app

## Local verification

- Focused regression suite: **29/29 tests passed**.
- Crawler-visible homepage: **1 H1, 31 links, 1,312 extracted words**.
- Generated sitemap: **21 URLs**, including both renderable case studies and no stale Webflow case-study URLs.
- Anonymous local responses: `/reddit-gap` **200**, local case study **200**; authenticated `/diagnostic` is absent from the sitemap.
- Representative blog post: **1 H1**, title **59 characters**, decoded description **154 characters**, **3 related article links**.
- Login page: `robots=noindex, nofollow`.
- Global HTML: no `SoftwareApplication` node.
- Scoped ESLint: **0 errors**; three pre-existing warnings.
- Full TypeScript check: **passed**.

## Limitations

- The Ahrefs MCP/API credential was unavailable, so the historical per-issue export could not be downloaded. The live crawl nevertheless reproduced the exact 13-URL 404 family, 10-post heading family and three short-description pages.
- The repository expects Node 22; verification ran on Node 25.7.0.
- Production will continue to show the old audit state until this patch and the pre-existing `/reddit-gap` public-route change are deployed.
- IndexNow submission, host-level `www` to apex redirect, Core Web Vitals and image analysis remain external follow-up work.
