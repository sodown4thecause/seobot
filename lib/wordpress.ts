/**
 * WordPress GraphQL Client
 * Connects to headless WordPress instance for blog content
 * Includes rate limiting protection and retry logic for build stability
 */

const WORDPRESS_GRAPHQL_ENDPOINT = 'https://flow-intent-126ee12.ingress-erytho.ewp.live/graphql'

// Rate limiting configuration
const RATE_LIMIT_DELAY_MS = 500 // Delay between requests
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000

// Simple in-memory cache for build-time data
const buildCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Request queue for rate limiting
let lastRequestTime = 0

export interface WordPressPost {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    date: string
    author: {
        name: string
        avatar?: string
    }
    featuredImage?: {
        sourceUrl: string
        altText: string
    }
    categories?: {
        nodes: Array<{
            name: string
            slug: string
        }>
    }
}

export interface PostsResponse {
    posts: {
        nodes: WordPressPost[]
        pageInfo: {
            hasNextPage: boolean
            endCursor: string | null
        }
    }
}

export interface SinglePostResponse {
    post: WordPressPost | null
}

/**
 * Sleep utility for rate limiting and retries
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Rate limit requests to avoid 429 errors
 */
async function rateLimitedRequest(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
        await sleep(RATE_LIMIT_DELAY_MS - timeSinceLastRequest)
    }
    
    lastRequestTime = Date.now()
}

/**
 * Execute a GraphQL query against WordPress with retry logic and rate limiting
 */
async function fetchGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
    // Generate cache key
    const cacheKey = JSON.stringify({ query, variables })
    
    // Check cache first
    const cached = buildCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data as T
    }

    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            // Apply rate limiting
            await rateLimitedRequest()
            
            const response = await fetch(WORDPRESS_GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables,
                }),
                next: {
                    revalidate: 60, // Cache for 60 seconds
                },
            })

            // Handle rate limiting (429)
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After')
                const delayMs = retryAfter 
                    ? parseInt(retryAfter, 10) * 1000 
                    : INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
                
                console.warn(`WordPress API rate limited (429). Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`)
                await sleep(delayMs)
                continue
            }

            if (!response.ok) {
                throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`)
            }

            const json = await response.json()

            if (json.errors) {
                console.error('GraphQL errors:', json.errors)
                throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`)
            }

            // Cache successful response
            buildCache.set(cacheKey, { data: json.data, timestamp: Date.now() })
            
            return json.data as T
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            
            // Don't retry on non-retryable errors
            if (lastError.message.includes('GraphQL errors')) {
                throw lastError
            }
            
            // Exponential backoff for other errors
            if (attempt < MAX_RETRIES - 1) {
                const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
                console.warn(`WordPress API error. Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`)
                await sleep(delayMs)
            }
        }
    }
    
    console.error('WordPress GraphQL fetch error after all retries:', lastError)
    throw lastError
}

/**
 * Fetch all blog posts
 */
export async function getPosts(first = 10, after?: string): Promise<PostsResponse> {
    const query = `
    query GetPosts($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes {
          id
          title
          slug
          excerpt
          date
          author {
            node {
              name
              avatar {
                url
              }
            }
          }
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              name
              slug
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `

    const data = await fetchGraphQL<any>(query, { first, after })

    // Transform the response to match our interface
    return {
        posts: {
            nodes: data.posts.nodes.map((post: any) => ({
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: '',
                date: post.date,
                author: {
                    name: post.author?.node?.name || 'Unknown',
                    avatar: post.author?.node?.avatar?.url,
                },
                featuredImage: post.featuredImage?.node
                    ? {
                        sourceUrl: post.featuredImage.node.sourceUrl,
                        altText: post.featuredImage.node.altText || post.title,
                    }
                    : undefined,
                categories: post.categories,
            })),
            pageInfo: data.posts.pageInfo,
        },
    }
}

/**
 * Fetch a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<WordPressPost | null> {
    const query = `
    query GetPostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        id
        title
        slug
        content
        excerpt
        date
        author {
          node {
            name
            avatar {
              url
            }
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  `

    const data = await fetchGraphQL<any>(query, { slug })

    if (!data.post) {
        return null
    }

    const post = data.post

    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        date: post.date,
        author: {
            name: post.author?.node?.name || 'Unknown',
            avatar: post.author?.node?.avatar?.url,
        },
        featuredImage: post.featuredImage?.node
            ? {
                sourceUrl: post.featuredImage.node.sourceUrl,
                altText: post.featuredImage.node.altText || post.title,
            }
            : undefined,
        categories: post.categories,
    }
}

/**
 * Get all post slugs for static generation
 * Returns empty array on failure to allow build to continue (pages will be generated on-demand)
 */
export async function getAllPostSlugs(): Promise<string[]> {
    try {
        const query = `
        query GetAllPostSlugs {
          posts(first: 1000, where: { status: PUBLISH }) {
            nodes {
              slug
            }
          }
        }
      `

        const data = await fetchGraphQL<any>(query)
        return data.posts.nodes.map((post: any) => post.slug)
    } catch (error) {
        console.warn('Failed to fetch post slugs for static generation, pages will be generated on-demand:', error)
        return []
    }
}

/**
 * Fetch all case studies
 */
export async function getCaseStudies(first = 10, after?: string): Promise<PostsResponse> {
    const query = `
    query GetCaseStudies($first: Int!, $after: String) {
      caseStudies(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes {
          id
          title
          slug
          excerpt
          date
          author {
            node {
              name
              avatar {
                url
              }
            }
          }
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              name
              slug
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `

    const data = await fetchGraphQL<any>(query, { first, after })

    // Transform the response to match our interface
    return {
        posts: {
            nodes: data.caseStudies.nodes.map((post: any) => ({
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: '',
                date: post.date,
                author: {
                    name: post.author?.node?.name || 'Unknown',
                    avatar: post.author?.node?.avatar?.url,
                },
                featuredImage: post.featuredImage?.node
                    ? {
                        sourceUrl: post.featuredImage.node.sourceUrl,
                        altText: post.featuredImage.node.altText || post.title,
                    }
                    : undefined,
                categories: post.categories,
            })),
            pageInfo: data.caseStudies.pageInfo,
        },
    }
}

/**
 * Fetch a single case study by slug
 */
export async function getCaseStudyBySlug(slug: string): Promise<WordPressPost | null> {
    const query = `
    query GetCaseStudyBySlug($slug: ID!) {
      caseStudy(id: $slug, idType: SLUG) {
        id
        title
        slug
        content
        excerpt
        date
        author {
          node {
            name
            avatar {
              url
            }
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  `

    const data = await fetchGraphQL<any>(query, { slug })

    if (!data.caseStudy) {
        return null
    }

    const post = data.caseStudy

    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        date: post.date,
        author: {
            name: post.author?.node?.name || 'Unknown',
            avatar: post.author?.node?.avatar?.url,
        },
        featuredImage: post.featuredImage?.node
            ? {
                sourceUrl: post.featuredImage.node.sourceUrl,
                altText: post.featuredImage.node.altText || post.title,
            }
            : undefined,
        categories: post.categories,
    }
}

/**
 * Get all case study slugs for static generation
 * Returns empty array on failure to allow build to continue (pages will be generated on-demand)
 */
export async function getAllCaseStudySlugs(): Promise<string[]> {
    try {
        const query = `
        query GetAllCaseStudySlugs {
          caseStudies(first: 1000, where: { status: PUBLISH }) {
            nodes {
              slug
            }
          }
        }
      `

        const data = await fetchGraphQL<any>(query)
        return data.caseStudies.nodes.map((post: any) => post.slug)
    } catch (error) {
        console.warn('Failed to fetch case study slugs for static generation, pages will be generated on-demand:', error)
        return []
    }
}

/**
 * Fetch all resources
 */
export async function getResources(first = 10, after?: string): Promise<PostsResponse> {
    const query = `
    query GetResources($first: Int!, $after: String) {
      resources(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes {
          id
          title
          slug
          excerpt
          date
          author {
            node {
              name
              avatar {
                url
              }
            }
          }
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              name
              slug
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `

    const data = await fetchGraphQL<any>(query, { first, after })

    // Transform the response to match our interface
    return {
        posts: {
            nodes: data.resources.nodes.map((post: any) => ({
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: '',
                date: post.date,
                author: {
                    name: post.author?.node?.name || 'Unknown',
                    avatar: post.author?.node?.avatar?.url,
                },
                featuredImage: post.featuredImage?.node
                    ? {
                        sourceUrl: post.featuredImage.node.sourceUrl,
                        altText: post.featuredImage.node.altText || post.title,
                    }
                    : undefined,
                categories: post.categories,
            })),
            pageInfo: data.resources.pageInfo,
        },
    }
}

/**
 * Fetch a single resource by slug
 */
export async function getResourceBySlug(slug: string): Promise<WordPressPost | null> {
    const query = `
    query GetResourceBySlug($slug: ID!) {
      resource(id: $slug, idType: SLUG) {
        id
        title
        slug
        content
        excerpt
        date
        author {
          node {
            name
            avatar {
              url
            }
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  `

    const data = await fetchGraphQL<any>(query, { slug })

    if (!data.resource) {
        return null
    }

    const post = data.resource

    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        date: post.date,
        author: {
            name: post.author?.node?.name || 'Unknown',
            avatar: post.author?.node?.avatar?.url,
        },
        featuredImage: post.featuredImage?.node
            ? {
                sourceUrl: post.featuredImage.node.sourceUrl,
                altText: post.featuredImage.node.altText || post.title,
            }
            : undefined,
        categories: post.categories,
    }
}

/**
 * Get all resource slugs for static generation
 * Returns empty array on failure to allow build to continue (pages will be generated on-demand)
 */
export async function getAllResourceSlugs(): Promise<string[]> {
    try {
        const query = `
        query GetAllResourceSlugs {
          resources(first: 1000, where: { status: PUBLISH }) {
            nodes {
              slug
            }
          }
        }
      `

        const data = await fetchGraphQL<any>(query)
        return data.resources.nodes.map((post: any) => post.slug)
    } catch (error) {
        console.warn('Failed to fetch resource slugs for static generation, pages will be generated on-demand:', error)
        return []
    }
}