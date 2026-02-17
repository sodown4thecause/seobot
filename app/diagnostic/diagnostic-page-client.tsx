'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Plus, Shield, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MAX_KEYWORDS = 5

interface DiagnosticPageClientProps {
  aiAuditsRun?: number
  avgCitationIncrease?: number
  agenciesTrustUs?: number
}

export function DiagnosticPageClient({
  aiAuditsRun: initialAiAuditsRun,
  avgCitationIncrease: initialAvgCitationIncrease,
  agenciesTrustUs: initialAgenciesTrustUs,
}: DiagnosticPageClientProps) {
  const router = useRouter()
  const [domain, setDomain] = useState('')
  const [brandIdentity, setBrandIdentity] = useState('')
  const [keywords, setKeywords] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const hasRealMetrics = initialAiAuditsRun !== undefined && initialAvgCitationIncrease !== undefined && initialAgenciesTrustUs !== undefined

  const aiAuditsRun = initialAiAuditsRun ?? null
  const avgCitationIncrease = initialAvgCitationIncrease ?? null
  const agenciesTrustUs = initialAgenciesTrustUs ?? null

  const canAddKeyword = keywords.length < MAX_KEYWORDS

  const normalizedKeywords = useMemo(
    () => keywords.map((keyword) => keyword.trim()).filter(Boolean),
    [keywords],
  )

  const updateKeyword = (index: number, nextValue: string) => {
    setKeywords((current) => current.map((value, i) => (i === index ? nextValue : value)))
  }

  const addKeyword = () => {
    if (!canAddKeyword) return
    setKeywords((current) => [...current, ''])
  }

  const removeKeyword = (index: number) => {
    setKeywords((current) => {
      const next = current.filter((_, i) => i !== index)
      return next.length > 0 ? next : ['']
    })
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const domainRegex = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(?:\/.*)?$/i

    if (!domain || !domainRegex.test(domain)) {
      setError('Please enter a valid domain (e.g., example.com)')
      setSubmitting(false)
      return
    }

    const domainOnly = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    if (domainOnly.length < 4 || domainOnly.includes(' ') || domainOnly.length > 253) {
      setError('Please enter a valid domain (e.g., example.com)')
      setSubmitting(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch('/api/diagnostic/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          brandIdentity,
          keywords: normalizedKeywords,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const payload = (await response.json()) as { id?: string; error?: string }

      if (!response.ok || !payload.id) {
        throw new Error(payload.error || 'Failed to run the instant snapshot')
      }

      router.push(`/diagnostic/result/${payload.id}`)
    } catch (submitError) {
      if (submitError instanceof Error && submitError.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Something went wrong')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-sm font-mono uppercase tracking-[0.2em] text-zinc-500 hover:text-white">
            {'<- Back to FlowIntent'}
          </Link>
          <span className="border border-white/20 px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-zinc-300">
            Lead Magnet / Step 1
          </span>
        </div>

        <section>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-none uppercase italic text-gradient">
            Your Competitors Are
            <br />
            Stealing Your <span className="bg-white px-3 text-black not-italic inline-block">AI Citations</span>.
            <br />
            Take Them Back.
          </h1>

          <p className="mt-8 text-xs font-mono uppercase tracking-[0.35em] text-zinc-500">SEO AGENTIC CLOUD / v2.0</p>
          <p className="mt-4 max-w-4xl text-xl md:text-3xl uppercase tracking-tight text-zinc-300">
            While you focus on Google, AI engines are redirecting your traffic. Stop the bleed. Capture LLM mentions
            before your market share vanishes.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#snapshot-form">
              <Button className="h-14 rounded-none border-4 border-white bg-white px-8 text-base font-black uppercase tracking-[0.1em] text-black hover:bg-zinc-200">
                Run Free Audit
              </Button>
            </a>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">No signup required</p>
              {aiAuditsRun !== null ? (
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-600">{aiAuditsRun.toLocaleString()} audits this month</p>
              ) : (
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-600">Audits this month (illustrative)</p>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="border border-white/10 bg-white/[0.02] px-6 py-7 text-center">
              <p className="text-4xl md:text-5xl font-black">
                {aiAuditsRun !== null ? (
                  <>{(aiAuditsRun || 0).toLocaleString()}+</>
                ) : (
                  <span className="text-zinc-600">--</span>
                )}
              </p>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                AI Audits Run {!hasRealMetrics && '(Illustrative)'}
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.02] px-6 py-7 text-center">
              <p className="text-4xl md:text-5xl font-black">
                {avgCitationIncrease !== null ? (
                  <>{avgCitationIncrease}%</>
                ) : (
                  <span className="text-zinc-600">--</span>
                )}
              </p>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                Avg Citation Increase {!hasRealMetrics && '(Illustrative)'}
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.02] px-6 py-7 text-center">
              <p className="text-4xl md:text-5xl font-black">
                {agenciesTrustUs !== null ? (
                  <>{agenciesTrustUs.toLocaleString()}</>
                ) : (
                  <span className="text-zinc-600">--</span>
                )}
              </p>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                Agencies Trust Us {!hasRealMetrics && '(Illustrative)'}
              </p>
            </div>
          </div>
        </section>

        <section id="snapshot-form" className="mt-16 border-2 border-white/10 bg-zinc-950 p-6 md:p-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 border border-white/15 bg-white/5 px-5 py-2 text-xs font-mono uppercase tracking-[0.3em]">
              <Shield className="h-4 w-4" /> Free AI Trust Audit
            </div>
            <h2 className="mt-8 text-4xl md:text-6xl font-black uppercase italic tracking-tight">
              Is AI Lying About Your <span className="border border-white/20 bg-zinc-900 px-3">Brand?</span>
            </h2>
            <p className="mt-5 text-lg md:text-2xl uppercase tracking-tight text-zinc-400">
              Discover how ChatGPT, Perplexity, and Google AI perceive your brand.
            </p>
            <p className="mt-5 inline-block border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.25em] text-zinc-200">
              Get actionable fixes in 30 seconds
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-12 space-y-10">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-5">
                <label htmlFor="diagnostic-domain" className="block text-xs font-mono uppercase tracking-[0.35em] text-zinc-300">
                  Website URL / Domain
                </label>
                <Input
                  id="diagnostic-domain"
                  type="text"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="WWW.YOURCOMPANY.COM"
                  required
                  className="h-16 rounded-none border-0 border-b-2 border-white/20 bg-transparent px-0 text-xl font-black uppercase tracking-tight text-white placeholder:text-zinc-700 focus-visible:border-white focus-visible:ring-0"
                />
              </div>

              <div className="space-y-5">
                <label htmlFor="diagnostic-brand" className="block text-xs font-mono uppercase tracking-[0.35em] text-zinc-300">
                  Brand Identity
                </label>
                <Input
                  id="diagnostic-brand"
                  type="text"
                  value={brandIdentity}
                  onChange={(event) => setBrandIdentity(event.target.value)}
                  placeholder="YOUR COMPANY NAME"
                  className="h-16 rounded-none border-0 border-b-2 border-white/20 bg-transparent px-0 text-xl font-black uppercase tracking-tight text-white placeholder:text-zinc-700 focus-visible:border-white focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500">Optional keywords (0-5)</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canAddKeyword}
                  onClick={addKeyword}
                  className="rounded-none border-white/20 bg-transparent text-zinc-200 hover:bg-white/10"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                {keywords.map((keyword, index) => (
                  <div key={`keyword-${index}`} className="flex items-center gap-2">
                    <Input
                      value={keyword}
                      onChange={(event) => updateKeyword(index, event.target.value)}
                      placeholder={index === 0 ? 'e.g. AI visibility software' : 'Optional keyword'}
                      className="h-12 rounded-none border-white/10 bg-black/40 text-white placeholder:text-zinc-600"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeKeyword(index)}
                      disabled={keywords.length === 1}
                      className="text-zinc-500 hover:bg-white/10 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {error ? (
              <div className="border border-rose-500/50 bg-rose-950/60 px-4 py-3 text-sm uppercase tracking-wide text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">System status: [ active ]</p>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">Latency: 30 seconds</p>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="h-16 rounded-none border-4 border-white bg-white px-9 text-lg font-black uppercase tracking-[0.08em] text-black hover:bg-zinc-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Snapshot
                  </>
                ) : (
                  <>
                    Analyze Brand Trust
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
