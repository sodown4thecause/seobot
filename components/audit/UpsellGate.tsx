'use client'

import Link from 'next/link'
import { ArrowRight, Lock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AuditConversionEvent } from '@/lib/audit/types'

interface UpsellGateProps {
  auditId: string | null
  brand: string
  visibilityRate: number
  topCompetitor: string
}

export function UpsellGate({ auditId, brand, visibilityRate, topCompetitor }: UpsellGateProps) {
  const headroom = Math.max(0, 100 - visibilityRate)

  const trackConversion = (event: AuditConversionEvent) => {
    if (!auditId) {
      return
    }

    void fetch('/api/audit/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId, event }),
      keepalive: true,
    }).catch(() => {
      // Best-effort attribution should never affect CTA navigation.
    })
  }

  return (
    <Card className="glass-card relative overflow-hidden rounded-[1.75rem] border-white/8 bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_45%)]" />
      <CardHeader className="relative">
        <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">
          <Lock className="h-3.5 w-3.5" />
          Next Step: Deeper Scorecard
        </div>
        <CardTitle className="text-xl text-white">Turn this scorecard into a deeper AI visibility roadmap</CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-200">
            Full 15-query deep audit across AI platforms
          </div>
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-200">
            Competitor citation matrix by buying intent stage
          </div>
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-200">
            Content roadmap to make {brand} more cite-worthy
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-400/10 bg-emerald-400/8 p-4 text-sm leading-relaxed text-emerald-50">
          You still have <span className="font-semibold">{headroom}%</span> of scoreable headroom in this sample. The clearest upside is capturing more of the buyer journeys where <span className="font-semibold">{topCompetitor}</span> currently has stronger coverage.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="w-full sm:w-auto" onClick={() => trackConversion('strategy-call')}>
            <Button className="w-full bg-white text-black hover:bg-zinc-100">
              Book Strategy Review
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-up" className="w-full sm:w-auto" onClick={() => trackConversion('full-audit')}>
            <Button variant="outline" className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10">
              <Sparkles className="mr-2 h-4 w-4" />
              Unlock Deep Scan
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
