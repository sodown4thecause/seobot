/**
 * Technical SEO Basics Tutorial
 * Beginner tutorial covering site crawling, Core Web Vitals, and technical SEO fundamentals
 */

import type { Tutorial } from '../types'

export const technicalSEOBasicsTutorial: Tutorial = {
  id: 'technical-seo-basics',
  title: 'Technical SEO Basics: Site Health & Performance',
  description: 'Learn how to audit your site for technical SEO issues and improve Core Web Vitals',
  difficulty: 'beginner',
  estimatedTime: '20 minutes',
  prerequisites: ['seo-fundamentals-101'],
  enabled: true,
  linkedWorkflow: 'technical-seo-audit',
  outcomes: [
    {
      concept: 'Technical SEO',
      skillGained: 'Understanding how site structure, speed, and technical elements affect rankings',
      realWorldApplication: 'Identify and fix technical issues that prevent your site from ranking well'
    },
    {
      concept: 'Core Web Vitals',
      skillGained: 'Understanding LCP, FID, and CLS metrics and how to improve them',
      realWorldApplication: 'Improve user experience and search rankings by optimizing page speed and interactivity'
    },
    {
      concept: 'Site Crawling',
      skillGained: 'Understanding how search engines crawl and index your site',
      realWorldApplication: 'Ensure all important pages are discoverable and indexable by search engines'
    }
  ],
  steps: [
    {
      id: 'understanding-technical-seo',
      title: 'What is Technical SEO?',
      content: `Technical SEO ensures search engines can crawl, index, and understand your website.

Key areas include:
1. **Site Speed** - Fast-loading pages rank better and provide better user experience
2. **Mobile-Friendliness** - Google prioritizes mobile-friendly sites
3. **Site Structure** - Clear navigation and internal linking help search engines understand your site
4. **Indexability** - Ensuring important pages are crawlable and indexable
5. **Security** - HTTPS and secure connections are ranking factors

Technical SEO is the foundation - even great content won't rank if search engines can't access it properly.`,
      action: 'EXPLAIN',
      interactive: {
        question: 'Which of these is NOT a Core Web Vital metric?',
        options: ['Largest Contentful Paint (LCP)', 'First Input Delay (FID)', 'Cumulative Layout Shift (CLS)', 'Time to First Byte (TTFB)'],
        correct: 'Time to First Byte (TTFB)',
        explanation: 'TTFB is important but not a Core Web Vital. The three Core Web Vitals are LCP, FID, and CLS.'
      },
      estimatedTime: '4 minutes'
    },
    {
      id: 'site-crawling-basics',
      title: 'Understanding Site Crawling',
      content: `Search engines use "crawlers" (bots) to discover and analyze your website.

How it works:
1. Crawlers start at your homepage
2. Follow links to discover other pages
3. Analyze content, structure, and technical elements
4. Store information in their index

Common crawling issues:
- **Blocked by robots.txt** - Pages you don't want indexed
- **Broken links** - Links that lead nowhere
- **Duplicate content** - Same content on multiple URLs
- **Missing sitemap** - No roadmap for crawlers

Let's check your site's crawlability using FlowIntent's technical audit tool.`,
      action: 'TOOL_DEMO',
      tool: 'technical-seo-audit',
      highlightParams: ['site_url'],
      liveDemo: true,
      estimatedTime: '5 minutes'
    },
    {
      id: 'core-web-vitals',
      title: 'Core Web Vitals Explained',
      content: `Core Web Vitals are Google's user experience metrics that affect rankings.

**Largest Contentful Paint (LCP)** - Measures loading performance
- Good: < 2.5 seconds
- Poor: > 4 seconds
- Fix: Optimize images, use CDN, improve server response time

**First Input Delay (FID)** - Measures interactivity
- Good: < 100 milliseconds
- Poor: > 300 milliseconds
- Fix: Reduce JavaScript execution time, optimize third-party scripts

**Cumulative Layout Shift (CLS)** - Measures visual stability
- Good: < 0.1
- Poor: > 0.25
- Fix: Set image dimensions, avoid inserting content above existing content

These metrics directly impact your search rankings and user experience.`,
      action: 'EXPLAIN',
      interactive: {
        question: 'What does a CLS score of 0.3 indicate?',
        options: ['Good visual stability', 'Poor visual stability - content shifts during load', 'Fast page load', 'High interactivity'],
        correct: 'Poor visual stability - content shifts during load',
        explanation: 'CLS measures layout shift. A score above 0.25 is considered poor, meaning content moves around as the page loads, creating a frustrating user experience.'
      },
      estimatedTime: '6 minutes'
    },
    {
      id: 'fixing-technical-issues',
      title: 'Fixing Common Technical Issues',
      content: `Now that you understand technical SEO, let's learn how to fix common issues.

**Issue 1: Slow Page Speed**
- Compress images (use WebP format)
- Enable browser caching
- Minify CSS and JavaScript
- Use a Content Delivery Network (CDN)

**Issue 2: Mobile Usability**
- Use responsive design
- Test on real devices
- Ensure touch targets are large enough (48x48px minimum)

**Issue 3: Broken Links**
- Use FlowIntent's technical audit to find broken links
- Fix or remove broken internal links
- Set up 301 redirects for moved pages

**Issue 4: Missing Meta Tags**
- Add title tags (50-60 characters)
- Add meta descriptions (150-160 characters)
- Ensure each page has unique meta tags

Run FlowIntent's technical audit to identify specific issues on your site.`,
      action: 'PRACTICE',
      estimatedTime: '5 minutes'
    }
  ]
}
