'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TopicFormProps {
  onSubmit: (topic: string, url?: string) => void
  loading: boolean
  error: string | null
}

export function TopicForm({ onSubmit, loading, error }: TopicFormProps) {
  const [topic, setTopic] = useState('')
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim()) {
      onSubmit(topic.trim(), url.trim() || undefined)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <div>
        <label className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2 block">
          What topic should we analyze?
        </label>
        <Input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., SEO tools, web development, SaaS marketing"
          className="h-14 bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 text-lg rounded-none"
          disabled={loading}
        />
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2 block">
          Your website URL (optional)
        </label>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yoursite.com"
          className="h-12 bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 rounded-none"
          disabled={loading}
        />
        <p className="text-xs text-zinc-600 mt-1 font-mono">We&apos;ll compare Reddit questions against your site&apos;s content coverage</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-none text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading || !topic.trim()}
        className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-wider text-base disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Scanning Reddit...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Find Content Gaps
          </>
        )}
      </Button>

      <p className="text-center text-xs font-mono text-zinc-600">
        Free. No credit card. Results in ~60 seconds.
      </p>
    </form>
  )
}