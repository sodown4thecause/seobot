import { describe, expect, it } from 'vitest'
import {
  buildBlogMetadataText,
  sanitizeBlogBody,
  selectRelatedBlogPosts,
} from '@/lib/seo/blog-content'

describe('blog SEO normalization', () => {
  it('keeps the article title as the only H1', () => {
    const html = sanitizeBlogBody(
      '<h1 class="cms-title">Repeated title</h1><p>Body</p><h2>Existing section</h2>',
    )

    expect(html).not.toContain('<h1')
    expect(html).toContain('<h2 class="cms-title">Repeated title</h2>')
    expect(html).toContain('<h2>Existing section</h2>')
  })

  it('compacts long titles and descriptions at word boundaries', () => {
    const result = buildBlogMetadataText({
      title:
        'How to Optimize for Google AI Overviews With a Practical Repeatable Content Workflow',
      description:
        'A detailed guide to planning, writing, validating, and improving content for Google AI Overviews without sacrificing clarity, usefulness, or traditional organic search performance.',
    })

    expect(result.title.length).toBeLessThanOrEqual(60)
    expect(result.description.length).toBeLessThanOrEqual(155)
    expect(result.title.endsWith('…')).toBe(true)
    expect(result.description.endsWith('…')).toBe(true)
  })

  it('rotates related posts so every article can receive contextual links', () => {
    const posts = [
      { slug: 'a', name: 'A' },
      { slug: 'b', name: 'B' },
      { slug: 'c', name: 'C' },
      { slug: 'd', name: 'D' },
    ]

    expect(selectRelatedBlogPosts(posts, 'b', 3)).toEqual([
      { slug: 'c', name: 'C' },
      { slug: 'd', name: 'D' },
      { slug: 'a', name: 'A' },
    ])
  })
})
