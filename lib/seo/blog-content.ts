import DOMPurify from 'isomorphic-dompurify'

const BLOG_TITLE_LIMIT = 60
const BLOG_DESCRIPTION_LIMIT = 155

function truncateAtWord(value: string, limit: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized

  const candidate = normalized.slice(0, limit - 1)
  const lastSpace = candidate.lastIndexOf(' ')
  const boundary = lastSpace >= Math.floor(limit * 0.6) ? lastSpace : candidate.length

  return `${candidate.slice(0, boundary).replace(/[\s,;:–—-]+$/u, '')}…`
}

export function buildBlogMetadataText({
  title,
  description,
}: {
  title: string
  description: string
}): { title: string; description: string } {
  return {
    title: truncateAtWord(title, BLOG_TITLE_LIMIT),
    description: truncateAtWord(description, BLOG_DESCRIPTION_LIMIT),
  }
}

export function sanitizeBlogBody(body: string): string {
  const sanitized = DOMPurify.sanitize(body, {
    ADD_TAGS: ['img'],
    ADD_ATTR: ['loading', 'fetchpriority'],
  })

  return sanitized
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1>/gi, '</h2>')
}

export function selectRelatedBlogPosts<T extends { slug: string }>(
  posts: T[],
  currentSlug: string,
  limit = 3,
): T[] {
  if (posts.length <= 1 || limit <= 0) return []

  const currentIndex = posts.findIndex((post) => post.slug === currentSlug)
  const startIndex = currentIndex >= 0 ? currentIndex : 0
  const related: T[] = []

  for (let offset = 1; offset < posts.length && related.length < limit; offset += 1) {
    related.push(posts[(startIndex + offset) % posts.length])
  }

  return related
}
