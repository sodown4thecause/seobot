'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Download, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Response } from '@/components/ai-elements/response'

interface BlogArtifactProps {
  content: string
  isStreaming?: boolean
  title?: string
}

function extractTitle(content: string): string {
  const h1 = content.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  const firstLine = content.split('\n').find(l => l.trim().length > 0)
  return firstLine?.replace(/^#+\s*/, '').trim() ?? 'Blog Post'
}

function generateImagePrompt(content: string): string {
  const title = extractTitle(content)
  const words = content
    .replace(/[#*_`>\[\]]/g, ' ')
    .split(/\s+/)
    .slice(0, 60)
    .join(' ')
  return `Professional blog hero image for: "${title}". ${words}. Clean, modern editorial photography style, high quality.`
}

export function BlogArtifact({ content, isStreaming = false, title }: BlogArtifactProps) {
  const [copied, setCopied] = useState(false)
  const [heroUrl, setHeroUrl] = useState<string | null>(null)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [imagesGenerated, setImagesGenerated] = useState(false)
  const [imagesFailed, setImagesFailed] = useState(false)

  const displayTitle = title ?? extractTitle(content)

  // Auto-generate images once streaming is complete and we have content
  useEffect(() => {
    if (isStreaming || imagesGenerated || content.length < 200) return

    const generate = async () => {
      setImagesLoading(true)
      try {
        const prompt = generateImagePrompt(content)
        const thumbPrompt = `Blog thumbnail for: "${displayTitle}". Minimal, modern, editorial style. Square format.`

        const [heroRes, thumbRes] = await Promise.allSettled([
          fetch('/api/image/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, size: '1792x1024', n: 1 }),
          }),
          fetch('/api/image/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: thumbPrompt, size: '1024x1024', n: 1 }),
          }),
        ])

        const extractUrl = (data: any): string | null =>
          data?.files?.[0]?.url ?? data?.files?.[0]?.dataUrl ?? data?.url ?? data?.imageUrl ?? data?.dataUrl ?? null

        if (heroRes.status === 'fulfilled' && heroRes.value.ok) {
          const data = await heroRes.value.json()
          setHeroUrl(extractUrl(data))
        }
        if (thumbRes.status === 'fulfilled' && thumbRes.value.ok) {
          const data = await thumbRes.value.json()
          setThumbUrl(extractUrl(data))
        }
      } catch {
        setImagesFailed(true)
      } finally {
        setImagesLoading(false)
        setImagesGenerated(true)
      }
    }

    generate()
  }, [isStreaming, content, displayTitle, imagesGenerated])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${displayTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden my-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Blog Post</span>
          {imagesLoading && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating images…
            </span>
          )}
          {imagesGenerated && !imagesLoading && (heroUrl || thumbUrl) && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500">
              <ImageIcon className="w-3 h-3" />
              Images ready
            </span>
          )}
          {imagesFailed && (
            <span className="text-[10px] text-zinc-500">Images unavailable</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            .md
          </button>
        </div>
      </div>

      {/* Blog Preview */}
      <div className="overflow-y-auto max-h-[70vh]">
        {/* Hero Image */}
        {(heroUrl || imagesLoading) && (
          <div className="relative w-full aspect-[16/7] bg-zinc-900 overflow-hidden">
            {heroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroUrl}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-zinc-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-mono">Generating hero image…</span>
                </div>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
          </div>
        )}

        {/* Meta strip: thumbnail + title */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-2">
          {(thumbUrl || imagesLoading) && (
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900">
              {thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className={cn(
              'text-xl font-bold text-zinc-100 leading-tight',
              isStreaming && 'animate-pulse'
            )}>
              {displayTitle}
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-2">
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-zinc-100 prose-headings:font-bold
            prose-p:text-zinc-300 prose-p:leading-relaxed
            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-zinc-100
            prose-code:text-amber-300 prose-code:bg-zinc-900 prose-code:px-1 prose-code:rounded
            prose-blockquote:border-l-emerald-500 prose-blockquote:text-zinc-400
            prose-ul:text-zinc-300 prose-ol:text-zinc-300
            prose-li:marker:text-emerald-500
          ">
            <Response isStreaming={isStreaming}>
              {content}
            </Response>
          </div>
        </div>
      </div>
    </div>
  )
}
