import 'server-only'
import { redditApiFetch } from './client'
import type { RedditPost } from './search'

export interface RedditComment {
  id: string
  author: string
  body: string
  score: number
  createdUtc: number
  parentId: string
  isSubmitter: boolean
  replies: RedditComment[]
}

export interface RedditThread {
  post: RedditPost
  comments: RedditComment[]
  commentCount: number
}

interface RedditListingChild {
  kind: string
  data: Record<string, unknown>
}

interface RedditCommentData {
  id: string
  author: string
  body: string
  score: number
  created_utc: number
  parent_id: string
  is_submitter: boolean
  replies?: unknown
  kind?: string
}

function parseComments(data: unknown): RedditComment[] {
  if (!data || typeof data !== 'object') return []
  if (Array.isArray(data)) {
    return data.flatMap((item) => parseComments(item))
  }

  const obj = data as { kind?: string; data?: Record<string, unknown> }

  if (obj.kind === 'Listing' && obj.data?.children) {
    return (obj.data.children as RedditListingChild[]).flatMap((child) =>
      parseComments(child)
    )
  }

  if (obj.kind === 't1' && obj.data) {
    const d = obj.data as unknown as RedditCommentData
    const comment: RedditComment = {
      id: d.id || '',
      author: d.author || '[deleted]',
      body: d.body || '',
      score: typeof d.score === 'number' ? d.score : 0,
      createdUtc: typeof d.created_utc === 'number' ? d.created_utc : 0,
      parentId: d.parent_id || '',
      isSubmitter: d.is_submitter || false,
      replies: parseComments(d.replies),
    }
    return [comment]
  }

  return []
}

export async function getThreadWithComments(
  subreddit: string,
  postId: string,
  commentLimit = 50,
  sort: 'confidence' | 'top' | 'new' | 'controversial' | 'old' | 'random' | 'qa' = 'top'
): Promise<RedditThread> {
  const params = new URLSearchParams({
    limit: String(commentLimit),
    sort,
    showtitle: 'true',
    raw_json: '1',
  })

  const response = await redditApiFetch<unknown[]>(
    `/r/${subreddit}/comments/${postId}?${params.toString()}`
  )

  if (!Array.isArray(response) || response.length < 2) {
    throw new Error(`[Reddit] Unexpected thread response format for post ${postId}`)
  }

  const postData = response[0] as { data: { children: RedditListingChild[] } }
  const commentsData = response[1]

  const postChild = postData.data?.children?.[0]
  if (!postChild || postChild.kind !== 't3') {
    throw new Error(`[Reddit] Could not parse post data for ${postId}`)
  }

  const d = postChild.data
  const post: RedditPost = {
    id: (d.id as string) || '',
    title: (d.title as string) || '',
    selftext: (d.selftext as string) || '',
    url: (d.url as string) || '',
    subreddit: (d.subreddit as string) || subreddit,
    author: (d.author as string) || '[deleted]',
    score: (d.score as number) || 0,
    upvoteRatio: (d.upvote_ratio as number) || 0,
    numComments: (d.num_comments as number) || 0,
    createdUtc: (d.created_utc as number) || 0,
    permalink: (d.permalink as string) || '',
    linkFlairText: (d.link_flair_text as string) || null,
    isSelf: (d.is_self as boolean) || false,
  }

  const comments = parseComments(commentsData)

  return {
    post,
    comments,
    commentCount: post.numComments,
  }
}

export function extractQuestionsFromThread(thread: RedditThread): Array<{
  question: string
  context: string
  upvotes: number
  source: string
  sourceUrl: string
}> {
  const questions: Array<{
    question: string
    context: string
    upvotes: number
    source: string
    sourceUrl: string
  }> = []

  const questionPatterns = [
    /\?\s*$/m,
    /^(?:how|what|why|when|where|which|who|can|does|is|are|do|should|would|could|will)\b/im,
  ]

  function isQuestion(text: string): boolean {
    if (!text || text.length < 10) return false
    return questionPatterns.some((pattern) => pattern.test(text))
  }

  if (thread.post.isSelf && isQuestion(thread.post.title)) {
    questions.push({
      question: thread.post.title,
      context: thread.post.selftext?.slice(0, 500) || '',
      upvotes: thread.post.score,
      source: `r/${thread.post.subreddit}`,
      sourceUrl: `https://reddit.com${thread.post.permalink}`,
    })
  }

  function processComment(comment: RedditComment): void {
    if (isQuestion(comment.body)) {
      questions.push({
        question: comment.body.slice(0, 300).replace(/\n/g, ' ').trim(),
        context: comment.body.slice(0, 500),
        upvotes: comment.score,
        source: `r/${thread.post.subreddit}`,
        sourceUrl: `https://reddit.com${thread.post.permalink}${comment.id}`,
      })
    }
    if (comment.replies?.length) {
      for (const reply of comment.replies) {
        processComment(reply)
      }
    }
  }

  for (const comment of thread.comments) {
    processComment(comment)
  }

  return questions.sort((a, b) => b.upvotes - a.upvotes)
}