# FlowIntent SEO Action Plan

## Critical — deploy and recrawl

1. Review and deploy the SEO remediation with the current public `/reddit-gap` proxy rule.
2. Verify anonymous production responses for `/reddit-gap`, both local case studies and `/sitemap.xml`; confirm authenticated `/diagnostic` is absent from the sitemap.
3. Start a fresh Ahrefs crawl and confirm the 13 sitemap 404s and two sitemap redirects clear.

## High — validate search-facing output

1. Run Google's Rich Results Test on `/`, `/prices` and one blog article.
2. Confirm Search Console sees `noindex` on login/signup aliases.
3. Submit the refreshed sitemap in Search Console.
4. Submit changed 200 URLs through IndexNow after deployment.

## Medium — strengthen content quality

1. Replace placeholder case-study claims with verified customer evidence or clearly label them as illustrative workflows.
2. Add visible authorship, reviewer credentials and primary-source citations to blog posts.
3. Expand the strongest competitive articles based on search intent, not an arbitrary word-count target.
4. Add contextually relevant links from commercial pages into supporting articles.

## Infrastructure follow-up

1. Configure a host-level permanent redirect from `www.flowintent.com` to `flowintent.com`.
2. Re-run Core Web Vitals and image audits; these categories were outside the supplied issue export.
