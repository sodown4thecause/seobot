# Technical SEO Audit Workflow Guide

Complete guide to identifying and fixing technical SEO issues.

## Overview

The Technical SEO Audit workflow helps you:
1. **Crawl Your Site**: Map structure and identify issues
2. **Detect Issues**: Categorize and prioritize problems
3. **Generate Action Plans**: Get step-by-step fixes
4. **Generate Assets**: Auto-create robots.txt, sitemaps, redirects
5. **Set Up Monitoring**: Ongoing health checks

## Phase 1: Site Crawling

### Site Structure Crawling
- Maps all URLs and hierarchy
- Identifies internal linking structure
- Finds broken links (404s, redirects)
- Detects duplicate content

### Core Web Vitals Analysis
- **LCP** (Largest Contentful Paint): Target < 2.5s
- **FID** (First Input Delay): Target < 100ms
- **CLS** (Cumulative Layout Shift): Target < 0.1
- **TTFB** (Time to First Byte)
- **Speed Index**

### Content Parsing Analysis
- Checks title tags (presence, length, uniqueness)
- Verifies meta descriptions
- Reviews heading structure (H1, H2, H3)
- Checks image alt text
- Validates schema markup

## Phase 2: Issue Detection

### Issue Categorization

**Critical Issues** (Fix Immediately):
- Broken sitemap/robots.txt
- Site-wide crawl errors
- Critical Core Web Vitals failures

**Major Issues** (Fix Soon):
- Missing meta tags on key pages
- Slow page load times
- Mobile usability issues
- Duplicate content

**Minor Issues** (Fix When Possible):
- Missing alt text on some images
- Minor heading structure issues
- Suboptimal internal linking

**Info** (Optimization Opportunities):
- Schema markup enhancements
- Internal linking improvements
- Content optimization suggestions

### Priority Scoring
Issues are scored by:
- **Impact**: How much it affects rankings (1-10)
- **Urgency**: How quickly it needs fixing (1-10)
- **Effort**: How difficult to fix (1-10)

Priority Score = (Impact × Urgency) / Effort

## Phase 3: Action Plan Generation

### Step-by-Step Fix Instructions
Each issue includes:
- Clear problem description
- Impact explanation
- Detailed fix steps
- Code snippets (if applicable)
- Testing instructions
- Timeline estimate

### Code Snippet Generation
Ready-to-use code for:
- robots.txt fixes
- Meta tag additions
- Schema markup
- Redirect rules (.htaccess, nginx)
- Sitemap XML structure

## Phase 4: Asset Generation

### Robots.txt Generation
- Allows important crawlers
- Blocks unnecessary paths
- Points to sitemap location
- Follows best practices

### XML Sitemap Generation
- Includes all important pages
- Correct priority and changefreq values
- Includes lastmod dates
- Split into multiple sitemaps if >50,000 URLs

### Redirect Rules Generation
- 404 errors → 301 redirects
- HTTP → HTTPS redirects
- www → non-www consistency
- Trailing slash consistency
- Old URLs → new URLs

Formats provided:
- Apache (.htaccess)
- Nginx
- JavaScript (client-side)
- Meta refresh (fallback)

## Phase 5: Monitoring Setup

### Health Checks

**Weekly Checks**:
- Core Web Vitals monitoring
- Broken link detection
- Sitemap accessibility
- Robots.txt accessibility

**Monthly Checks**:
- Full site crawl
- Performance trends
- Mobile usability
- Index coverage (Google Search Console)

### Alert Thresholds
- Core Web Vitals degradation
- Increase in 404 errors
- Sitemap errors
- Significant performance drops

## Common Issues and Fixes

### Missing Title Tags
**Fix**: Add `<title>` tag in `<head>` section
```html
<title>Your Page Title Here</title>
```

### Slow Page Load
**Fix**: Optimize images, enable caching, reduce server response time
- Use WebP format for images
- Enable browser caching
- Use CDN for static assets

### High CLS (Layout Shift)
**Fix**: Set size attributes on images and videos
```html
<img src="image.jpg" width="800" height="600" alt="Description">
```

### Broken Links
**Fix**: Create 301 redirects
```apache
Redirect 301 /old-page /new-page
```

## Best Practices

1. **Fix Critical Issues First**: Address blocking issues immediately
2. **Test After Fixes**: Verify fixes work correctly
3. **Monitor Continuously**: Set up alerts for issues
4. **Document Changes**: Keep track of what you fixed
5. **Regular Audits**: Run audits monthly

## Troubleshooting

**Crawl fails?**
- Check robots.txt isn't blocking crawler
- Verify site is accessible
- Check for rate limiting

**Issues not detected?**
- Ensure crawl completed fully
- Check crawl depth settings
- Verify all pages are accessible

**Fixes not working?**
- Clear cache after changes
- Verify code is correct
- Check server logs for errors

