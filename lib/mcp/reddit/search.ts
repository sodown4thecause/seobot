import 'server-only'
import { redditApiFetch } from './client'

export interface RedditSubreddit {
  name: string
  displayName: string
  title: string
  description: string
  subscribers: number
  activeUsers: number
  over18: boolean
  publicDescription: string
}

export interface RedditPost {
  id: string
  title: string
  selftext: string
  url: string
  subreddit: string
  author: string
  score: number
  upvoteRatio: number
  numComments: number
  createdUtc: number
  permalink: string
  linkFlairText: string | null
  isSelf: boolean
}

export async function searchSubreddits(
  query: string,
  limit = 10
): Promise<RedditSubreddit[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  })

  const response = await redditApiFetch<{ data: { children: Array<{ data: Record<string, unknown> }> } }>(
    `/subreddits/search?${params.toString()}`
  )

  const children = response?.data?.children || []

  return children
    .filter((child) => child.data?.display_name)
    .map((child) => {
      const d = child.data
      return {
        name: (d.display_name as string) || '',
        displayName: (d.display_name as string) || '',
        title: (d.title as string) || '',
        description: (d.public_description as string) || '',
        subscribers: (d.subscribers as number) || 0,
        activeUsers: (d.accounts_active as number) || 0,
        over18: (d.over_18 as boolean) || false,
        publicDescription: (d.public_description as string) || '',
      }
    })
    .filter((sub) => sub.name.length > 0 && !sub.over18)
}

export async function searchPosts(
  query: string,
  subreddit?: string,
  sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance',
  time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'year',
  limit = 25
): Promise<RedditPost[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort,
    t: time,
    type: 'link',
  })

  const endpoint = subreddit
    ? `/r/${subreddit}/search?${params.toString()}`
    : `/search?${params.toString()}`

  const response = await redditApiFetch<{ data: { children: Array<{ kind: string; data: Record<string, unknown> }> } }>(endpoint)

  const children = response?.data?.children || []

  return children
    .filter((child) => child.kind === 't3')
    .map((child) => {
      const d = child.data
      return {
        id: (d.id as string) || '',
        title: (d.title as string) || '',
        selftext: (d.selftext as string) || '',
        url: (d.url as string) || '',
        subreddit: (d.subreddit as string) || '',
        author: (d.author as string) || '',
        score: (d.score as number) || 0,
        upvoteRatio: (d.upvote_ratio as number) || 0,
        numComments: (d.num_comments as number) || 0,
        createdUtc: (d.created_utc as number) || 0,
        permalink: (d.permalink as string) || '',
        linkFlairText: (d.link_flair_text as string) || null,
        isSelf: (d.is_self as boolean) || false,
      }
    })
    .filter((post) => post.id.length > 0)
}

export async function getTopPosts(
  subreddit: string,
  time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'month',
  limit = 25
): Promise<RedditPost[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    t: time,
  })

  const response = await redditApiFetch<{ data: { children: Array<{ kind: string; data: Record<string, unknown> }> } }>(
    `/r/${subreddit}/top?${params.toString()}`
  )

  const children = response?.data?.children || []

  return children
    .filter((child) => child.kind === 't3')
    .map((child) => {
      const d = child.data
      return {
        id: (d.id as string) || '',
        title: (d.title as string) || '',
        selftext: (d.selftext as string) || '',
        url: (d.url as string) || '',
        subreddit: (d.subreddit as string) || '',
        author: (d.author as string) || '',
        score: (d.score as number) || 0,
        upvoteRatio: (d.upvote_ratio as number) || 0,
        numComments: (d.num_comments as number) || 0,
        createdUtc: (d.created_utc as number) || 0,
        permalink: (d.permalink as string) || '',
        linkFlairText: (d.link_flair_text as string) || null,
        isSelf: (d.is_self as boolean) || false,
      }
    })
    .filter((post) => post.id.length > 0)
}