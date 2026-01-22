'use client'

import { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ContentType = 'blog_post' | 'article' | 'landing_page'

type ProgressEvent = {
  phase: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message: string
  details?: string
}

function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
}

function parseSseEventChunk(chunk: string): { event?: string; data?: string } {
  const lines = splitLines(chunk)
  const eventLine = lines.find((l) => l.startsWith('event:'))
  const dataLines = lines.filter((l) => l.startsWith('data:'))

  return {
    event: eventLine ? eventLine.replace(/^event:\s*/, '').trim() : undefined,
    data: dataLines.length
      ? dataLines.map((l) => l.replace(/^data:\s*/, '')).join('\n')
      : undefined,
  }
}

export default function ContentZonePage() {
  const { user, isLoaded } = useUser()

  const [topic, setTopic] = useState('')
  const [primaryKeyword, setPrimaryKeyword] = useState('')
  const [secondaryKeywordsCsv, setSecondaryKeywordsCsv] = useState('')
  const [contentType, setContentType] = useState<ContentType>('blog_post')
  const [tone, setTone] = useState('confident, concise, practical')
  const [audience, setAudience] = useState('SEO-aware marketers and founders')
  const [wordCount, setWordCount] = useState(1200)
  const [competitorUrlsText, setCompetitorUrlsText] = useState('')

  const [deepwikiRepo, setDeepwikiRepo] = useState('')
  const [deepwikiQuestion, setDeepwikiQuestion] = useState('')

  const [isBriefLoading, setIsBriefLoading] = useState(false)
  const [briefError, setBriefError] = useState<string | null>(null)
  const [briefJson, setBriefJson] = useState<unknown>(null)
  const [briefMarkdown, setBriefMarkdown] = useState<string | null>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<ProgressEvent[]>([])
  const [draft, setDraft] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const secondaryKeywords = useMemo(() => {
    return secondaryKeywordsCsv
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .slice(0, 20)
  }, [secondaryKeywordsCsv])

  const competitorUrls = useMemo(() => {
    return competitorUrlsText
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .slice(0, 10)
  }, [competitorUrlsText])

  const canRun = topic.trim().length > 0 && primaryKeyword.trim().length > 0

  const handleGenerateBrief = async () => {
    if (!canRun) return

    setIsBriefLoading(true)
    setBriefError(null)
    setBriefJson(null)
    setBriefMarkdown(null)

    try {
      const res = await fetch('/api/content-zone/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          primaryKeyword,
          secondaryKeywords,
          contentType,
          tone,
          audience,
          wordCount,
          competitorUrls: competitorUrls.length ? competitorUrls : undefined,
          deepwikiRepo: deepwikiRepo.trim() || undefined,
          deepwikiQuestion: deepwikiQuestion.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Failed to create brief')
      }

      setBriefJson(json.brief)
      setBriefMarkdown(json.brief?.briefMarkdown || null)
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : 'Failed to create brief')
    } finally {
      setIsBriefLoading(false)
    }
  }

  const handleGenerateDraft = async () => {
    if (!canRun || isGenerating) return

    setIsGenerating(true)
    setGenerateError(null)
    setDraft(null)
    setProgress([])

    try {
      const res = await fetch('/api/content/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          type: contentType,
          keywords: [primaryKeyword, ...secondaryKeywords],
          tone,
          wordCount,
          competitorUrls: competitorUrls.length ? competitorUrls : undefined,
        }),
      })

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => '')
        throw new Error(errorText || 'Failed to start generation')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const evt = parseSseEventChunk(part)
          if (!evt.event || !evt.data) continue

          if (evt.event === 'progress') {
            try {
              const update = JSON.parse(evt.data) as ProgressEvent
              setProgress((prev) => [...prev, update])
            } catch {
              // ignore
            }
          }

          if (evt.event === 'complete') {
            const payload = JSON.parse(evt.data) as { content?: string }
            setDraft(payload.content ?? null)
          }

          if (evt.event === 'error') {
            const payload = JSON.parse(evt.data) as { message?: string; details?: string }
            setGenerateError(payload.details || payload.message || 'Generation failed')
          }
        }
      }
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isLoaded) {
    return <div className="p-8 text-zinc-300">Loading…</div>
  }

  if (!user) {
    return <div className="p-8 text-zinc-300">Please sign in to use Content Zone.</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-8 text-zinc-100">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Content Zone</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Generate an SEO/AEO brief (SERP + competitor + citations), then stream a draft with the RAG writer pipeline.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. AI SEO content briefs" />
            </div>
            <div className="space-y-2">
              <Label>Primary keyword</Label>
              <Input
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                placeholder="e.g. seo content brief"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Secondary keywords (comma-separated)</Label>
              <Input
                value={secondaryKeywordsCsv}
                onChange={(e) => setSecondaryKeywordsCsv(e.target.value)}
                placeholder="e.g. aeo, answer engine optimization, content outline"
              />
            </div>

            <div className="space-y-2">
              <Label>Content type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger className="bg-white/[0.04] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog_post">Blog post</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="landing_page">Landing page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target word count</Label>
              <Input
                inputMode="numeric"
                value={String(wordCount)}
                onChange={(e) => setWordCount(Number(e.target.value || 0))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Tone</Label>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. friendly, authoritative" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Audience</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who is this for?" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Competitor URLs (optional, one per line)</Label>
              <Textarea
                value={competitorUrlsText}
                onChange={(e) => setCompetitorUrlsText(e.target.value)}
                placeholder="https://example.com/post-1\nhttps://example.com/post-2"
                className="min-h-[88px] bg-white/[0.04] border-white/10"
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-sm font-medium">Optional: DeepWiki (GitHub repo docs)</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Repo (owner/repo)</Label>
                <Input
                  value={deepwikiRepo}
                  onChange={(e) => setDeepwikiRepo(e.target.value)}
                  placeholder="e.g. vercel/next.js"
                />
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  value={deepwikiQuestion}
                  onChange={(e) => setDeepwikiQuestion(e.target.value)}
                  placeholder="e.g. What is the recommended approach for…"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Uses the DeepWiki MCP to pull product/docs insights into your brief.
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleGenerateBrief} disabled={!canRun || isBriefLoading}>
              {isBriefLoading ? 'Creating brief…' : 'Create brief'}
            </Button>
            <Button variant="secondary" onClick={handleGenerateDraft} disabled={!canRun || isGenerating}>
              {isGenerating ? 'Generating draft…' : 'Generate draft'}
            </Button>
          </div>

          {(briefError || generateError) && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {briefError || generateError}
            </div>
          )}
        </div>

        {briefMarkdown && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold">Brief (Markdown)</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-zinc-200">{briefMarkdown}</pre>
          </div>
        )}

        {briefJson != null && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold">Brief (JSON)</h2>
            <pre className="mt-3 overflow-auto text-xs text-zinc-300">{JSON.stringify(briefJson, null, 2)}</pre>
          </div>
        )}

        {progress.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold">Generation progress</h2>
            <div className="mt-3 space-y-2">
              {progress.slice(-12).map((p, idx) => (
                <div key={`${p.phase}-${idx}`} className="text-sm text-zinc-300">
                  <span className="text-zinc-100">{p.phase}</span> — {p.message}
                  {p.details ? <span className="text-zinc-500"> ({p.details})</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {draft && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold">Draft</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-zinc-200">{draft}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
