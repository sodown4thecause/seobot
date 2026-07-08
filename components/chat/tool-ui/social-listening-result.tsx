'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ExternalLink, MessageCircle, Radio, Search } from 'lucide-react'

type SocialPlatform = 'x' | 'reddit' | 'web' | 'unknown'

interface SocialItem {
  id?: string
  platform: SocialPlatform
  title?: string
  text: string
  author?: string
  url?: string
  source?: string
  score?: number
  engagement?: number
  createdAt?: string
}

interface SocialListeningResultProps {
  toolInvocation: {
    toolName?: string
    args?: { query?: string; subreddit?: string; type?: string }
    result?: unknown
    state?: string
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}

function detectPlatform(item: Record<string, unknown>, fallback: SocialPlatform): SocialPlatform {
  const rawPlatform = readString(item, ['platform', 'sourceType', 'network'])?.toLowerCase()
  if (rawPlatform === 'x' || rawPlatform === 'twitter') return 'x'
  if (rawPlatform === 'reddit') return 'reddit'
  if (rawPlatform === 'web') return 'web'
  return fallback
}

function extractItems(result: unknown): unknown[] {
  if (Array.isArray(result)) return result
  const record = asRecord(result)
  if (!record) return []

  for (const key of ['items', 'results', 'posts', 'tweets', 'data']) {
    const value = record[key]
    if (Array.isArray(value)) return value
    const nested = asRecord(value)
    if (nested) {
      const nestedItems = extractItems(nested)
      if (nestedItems.length) return nestedItems
    }
  }

  return []
}

function normalizeSocialItems(result: unknown, toolName?: string): SocialItem[] {
  const fallbackPlatform: SocialPlatform = toolName === 'reddit_social_search'
    ? 'reddit'
    : toolName === 'aisa_x_search'
      ? 'x'
      : 'unknown'

  return extractItems(result).flatMap((value): SocialItem[] => {
    const record = asRecord(value)
    if (!record) return []

    const title = readString(record, ['title', 'headline'])
    const text = readString(record, ['text', 'content', 'selftext', 'body', 'snippet', 'fullText', 'full_text']) ?? title
    if (!text) return []

    return [{
      id: readString(record, ['id', 'postId', 'tweetId', 'tweet_id']),
      platform: detectPlatform(record, fallbackPlatform),
      title,
      text,
      author: readString(record, ['author', 'username', 'userName', 'screen_name']),
      url: readString(record, ['url', 'permalink', 'tweetUrl', 'tweet_url']),
      source: readString(record, ['source', 'subreddit', 'community']),
      score: readNumber(record, ['score', 'upvotes']),
      engagement: readNumber(record, ['engagement', 'numComments', 'comments', 'likeCount', 'retweetCount']),
      createdAt: readString(record, ['createdAt', 'created_at', 'date']),
    }]
  })
}

function platformLabel(platform: SocialPlatform) {
  if (platform === 'x') return 'X'
  if (platform === 'reddit') return 'Reddit'
  if (platform === 'web') return 'Web'
  return 'Social'
}

function platformClasses(platform: SocialPlatform) {
  if (platform === 'x') return 'border-sky-500/30 text-sky-300'
  if (platform === 'reddit') return 'border-orange-500/30 text-orange-300'
  if (platform === 'web') return 'border-emerald-500/30 text-emerald-300'
  return 'border-zinc-700 text-zinc-300'
}

export function SocialListeningResult({ toolInvocation }: SocialListeningResultProps) {
  const result = toolInvocation.result
  const record = asRecord(result)
  const isLoading = toolInvocation.state !== 'result' && toolInvocation.state !== 'output-available'
  const success = record?.success !== false
  const items = normalizeSocialItems(result, toolInvocation.toolName)
  const query = typeof record?.query === 'string'
    ? record.query
    : toolInvocation.args?.query
  const count = typeof record?.count === 'number' ? record.count : items.length

  if (isLoading) {
    return (
      <div className="my-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 animate-pulse">
        <p className="text-sm text-rose-300">Scanning public social conversations...</p>
      </div>
    )
  }

  if (!success) {
    const errorMessage = typeof record?.errorMessage === 'string'
      ? record.errorMessage
      : 'Social search failed. Try a narrower public query.'
    return (
      <div className="my-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
        {errorMessage}
      </div>
    )
  }

  return (
    <Card className="my-4 overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl border-l-4 border-l-rose-500/60">
      <CardHeader className="border-b border-zinc-800 bg-zinc-900/40 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Radio className="h-4 w-4 text-rose-300" />
              Social Listening
            </CardTitle>
            {query ? (
              <p className="mt-1 truncate text-sm text-zinc-400">Query: &ldquo;{query}&rdquo;</p>
            ) : null}
          </div>
          <Badge variant="outline" className="border-rose-500/30 text-rose-300">
            {count} results
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {items.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
            <Search className="h-4 w-4 text-zinc-500" />
            No public posts were returned for this search.
          </div>
        ) : (
          items.slice(0, 20).map((item, index) => (
            <div
              key={item.id ?? `${item.platform}-${index}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant="outline" className={cn('shrink-0 text-[10px]', platformClasses(item.platform))}>
                    {platformLabel(item.platform)}
                  </Badge>
                  <span className="truncate text-xs text-zinc-500">
                    {item.source ?? (item.author ? `@${item.author.replace(/^@/, '')}` : 'Public result')}
                  </span>
                </div>
                {typeof item.engagement === 'number' || typeof item.score === 'number' ? (
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <MessageCircle className="h-3 w-3" />
                    {(item.engagement ?? item.score ?? 0).toLocaleString()}
                  </span>
                ) : null}
              </div>
              {item.title ? (
                <p className="mt-3 text-sm font-medium text-zinc-100">{item.title}</p>
              ) : null}
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-zinc-300">{item.text}</p>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200"
                >
                  Open result
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
