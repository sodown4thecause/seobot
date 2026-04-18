import 'server-only'
import { serverEnv } from '@/lib/config/env'

const WEBFLOW_API_BASE = 'https://api.webflow.com/v2'

type WebflowImageField = {
  url: string
  alt?: string
  width?: number
  height?: number
}

type WebflowItemFieldData = Record<string, unknown>

type WebflowCollectionItem = {
  id: string
  cmsLocaleId: string
  lastPublished: string | null
  lastUpdated: string
  createdOn: string
  isDraft: boolean
  isArchived: boolean
  fieldData: WebflowItemFieldData
}

type WebflowCollectionItemsResponse = {
  items: WebflowCollectionItem[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

type WebflowCollectionField = {
  id: string
  type: string
  slug: string
  displayName: string
  isRequired: boolean
  validations?: Record<string, unknown>
}

type WebflowCollection = {
  id: string
  displayName: string
  singularName: string
  slug: string
  fields: WebflowCollectionField[]
}

export type BlogPost = {
  id: string
  slug: string
  name: string
  body: string | null
  summary: string | null
  mainImage: string | null
  thumbnailImage: string | null
  featured: boolean
  color: string | null
  lastPublished: string | null
  lastUpdated: string
  createdOn: string
}

export type CaseStudy = {
  id: string
  slug: string
  name: string
  lastPublished: string | null
  lastUpdated: string
  createdOn: string
}

function getApiToken(): string {
  const token = serverEnv.WEBFLOW_API_TOKEN
  if (!token) {
    throw new Error('WEBFLOW_API_TOKEN is not configured. Set it in your .env.local to enable Webflow CMS.')
  }
  return token
}

function getCollectionId(type: 'blog' | 'case-studies'): string {
  if (type === 'blog') {
    const id = serverEnv.WEBFLOW_BLOG_ID
    if (!id) throw new Error('WEBFLOW_BLOG_ID is not configured. Set it in your .env.local to enable Webflow CMS.')
    return id
  }
  const id = serverEnv.WEBFLOW_CASESTUDIES_ID
  if (!id) throw new Error('WEBFLOW_CASESTUDIES_ID is not configured. Set it in your .env.local to enable Webflow CMS.')
  return id
}

async function webflowFetch<T>(endpoint: string, revalidate?: number): Promise<T> {
  const token = getApiToken()
  const url = `${WEBFLOW_API_BASE}${endpoint}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }

  const fetchOptions: RequestInit = { headers }

  if (revalidate !== undefined) {
    fetchOptions.next = { revalidate }
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Webflow API error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<T>
}

function extractImageUrl(field: unknown): string | null {
  if (!field) return null
  if (typeof field === 'string') return field
  if (typeof field === 'object' && field !== null) {
    const obj = field as Record<string, unknown>
    if (typeof obj.url === 'string') return obj.url
  }
  return null
}

function mapBlogPost(item: WebflowCollectionItem): BlogPost {
  const fd = item.fieldData
  return {
    id: item.id,
    slug: fd.slug as string ?? '',
    name: fd.name as string ?? '',
    body: (fd['post-body'] as string) ?? null,
    summary: (fd['post-summary'] as string) ?? null,
    mainImage: extractImageUrl(fd['main-image']),
    thumbnailImage: extractImageUrl(fd['thumbnail-image']),
    featured: fd['featured'] as boolean ?? false,
    color: (fd['color'] as string) ?? null,
    lastPublished: item.lastPublished,
    lastUpdated: item.lastUpdated,
    createdOn: item.createdOn,
  }
}

function mapCaseStudy(item: WebflowCollectionItem): CaseStudy {
  const fd = item.fieldData
  return {
    id: item.id,
    slug: fd.slug as string ?? '',
    name: fd.name as string ?? '',
    lastPublished: item.lastPublished,
    lastUpdated: item.lastUpdated,
    createdOn: item.createdOn,
  }
}

export async function getBlogPosts(revalidateSeconds = 300): Promise<BlogPost[]> {
  const collectionId = getCollectionId('blog')
  const items: BlogPost[] = []
  let offset = 0
  const limit = 100

  do {
    const data = await webflowFetch<WebflowCollectionItemsResponse>(
      `/collections/${collectionId}/items/live?limit=${limit}&offset=${offset}`,
      revalidateSeconds,
    )
    items.push(...data.items.map(mapBlogPost))
    offset += limit
    if (offset >= data.pagination.total) break
  } while (true)

  return items
}

export async function getBlogPost(slug: string, revalidateSeconds = 300): Promise<BlogPost | null> {
  const collectionId = getCollectionId('blog')
  const data = await webflowFetch<WebflowCollectionItemsResponse>(
    `/collections/${collectionId}/items/live?slug=${encodeURIComponent(slug)}&limit=1`,
    revalidateSeconds,
  )

  if (!data.items.length) return null

  return mapBlogPost(data.items[0])
}

export async function getCaseStudies(revalidateSeconds = 300): Promise<CaseStudy[]> {
  const collectionId = getCollectionId('case-studies')
  const items: CaseStudy[] = []
  let offset = 0
  const limit = 100

  do {
    const data = await webflowFetch<WebflowCollectionItemsResponse>(
      `/collections/${collectionId}/items/live?limit=${limit}&offset=${offset}`,
      revalidateSeconds,
    )
    items.push(...data.items.map(mapCaseStudy))
    offset += limit
    if (offset >= data.pagination.total) break
  } while (true)

  return items
}

export async function getCaseStudy(slug: string, revalidateSeconds = 300): Promise<CaseStudy | null> {
  const collectionId = getCollectionId('case-studies')
  const data = await webflowFetch<WebflowCollectionItemsResponse>(
    `/collections/${collectionId}/items/live?slug=${encodeURIComponent(slug)}&limit=1`,
    revalidateSeconds,
  )

  if (!data.items.length) return null

  return mapCaseStudy(data.items[0])
}

export async function getBlogSlugs(): Promise<string[]> {
  const posts = await getBlogPosts(3600)
  return posts.map((p) => p.slug).filter(Boolean)
}

export async function getCaseStudySlugs(): Promise<string[]> {
  const studies = await getCaseStudies(3600)
  return studies.map((s) => s.slug).filter(Boolean)
}