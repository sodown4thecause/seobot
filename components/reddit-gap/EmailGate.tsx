'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmailGateProps {
  topic: string
  onSubmit: (email: string) => void
  loading: boolean
  error: string | null
}

export function EmailGate({ topic, onSubmit, loading, error }: EmailGateProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    if (email) onSubmit(email)
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500 mb-2">
          Unlock Full Report
        </p>
        <h3 className="text-xl font-bold text-white">
          Enter your email to see all content gaps and the full brief
        </h3>
        <p className="text-sm text-zinc-400 mt-2">
          We&apos;ll send you a PDF content brief with all {topic} content gaps, Reddit thread sources, and action items.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className="w-full h-14 px-4 bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 text-lg rounded-none"
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-wider text-base disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing Reddit...
            </>
          ) : (
            'Get Full Report'
          )}
        </Button>

        <p className="text-center text-xs font-mono text-zinc-600">
          Free. No spam. Unsubscribe anytime.
        </p>
      </form>
    </div>
  )
}