/**
 * WordPress GraphQL Client
 * Connects to headless WordPress instance for blog content
 */

const WORDPRESS_GRAPHQL_ENDPOINT = 'https://flow-intent-126ee12.ingress-erytho.ewp.live/graphql'

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
 * Execute a GraphQL query against WordPress
 */
async function fetchGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
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

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`)
        }

        const json = await response.json()

        if (json.errors) {
            console.error('GraphQL errors:', json.errors)
            throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`)
        }

        return json.data as T
    } catch (error) {
        console.error('WordPress GraphQL fetch error:', error)
        throw error
    }
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
 */
export async function getAllPostSlugs(): Promise<string[]> {
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
}

/**
 * Fetch all case studies
 */
export async function getCaseStudies(first = 10, after?: string): Promise<PostsResponse> {
    const query = `
    query GetCaseStudies($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH, categoryName: "case-studies" }) {
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
 * Fetch a single case study by slug
 */
export async function getCaseStudyBySlug(slug: string): Promise<WordPressPost | null> {
    const query = `
    query GetCaseStudyBySlug($slug: ID!) {
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
 * Get all case study slugs for static generation
 */
export async function getAllCaseStudySlugs(): Promise<string[]> {
    const query = `
    query GetAllCaseStudySlugs {
      posts(first: 1000, where: { status: PUBLISH, categoryName: "case-studies" }) {
        nodes {
          slug
        }
      }
    }
  `

    const data = await fetchGraphQL<any>(query)
    return data.posts.nodes.map((post: any) => post.slug)
}

/**
 * Fetch all resources
 */
export async function getResources(first = 10, after?: string): Promise<PostsResponse> {
    const query = `
    query GetResources($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH, categoryName: "resources" }) {
        nodes {
          id
          title
          slug
          excerpt
          content
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
 * Fetch a single resource by slug
 */
export async function getResourceBySlug(slug: string): Promise<WordPressPost | null> {
    const query = `
    query GetResourceBySlug($slug: ID!) {
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
 * Get all resource slugs for static generation
 */
export async function getAllResourceSlugs(): Promise<string[]> {
    const query = `
    query GetAllResourceSlugs {
      posts(first: 1000, where: { status: PUBLISH, categoryName: "resources" }) {
        nodes {
          slug
        }
      }
    }
  `

    const data = await fetchGraphQL<any>(query)
    return data.posts.nodes.map((post: any) => post.slug)
}