'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { BrandDetectionPayload } from '@/lib/audit/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface BrandConfirmationProps {
  detected: BrandDetectionPayload
  onConfirm: (input: { context: BrandDetectionPayload; email: string }) => Promise<void>
  loading?: boolean
}

export function BrandConfirmation({ detected, onConfirm, loading }: BrandConfirmationProps) {
  const [context, setContext] = useState<BrandDetectionPayload>(detected)
  const [email, setEmail] = useState('')

  const competitorsText = useMemo(() => context.competitors.join(', '), [context.competitors])
  const trimmedEmail = email.trim()
  const isEmailValid = EMAIL_PATTERN.test(trimmedEmail)

  return (
    <Card className="border-white/10 bg-zinc-950 text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Confirm What We Detected</CardTitle>
        <CardDescription className="text-zinc-400">
          Edit anything before we run the 5 live AI checks. This keeps results accurate and avoids wasted API cost.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 rounded-[1.5rem] border border-emerald-400/10 bg-emerald-400/8 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Detected brand</p>
            <p className="mt-2 text-lg font-medium text-white">{context.brand}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">Category</p>
            <p className="mt-2 text-lg font-medium text-white">{context.category}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">What you unlock</p>
            <p className="mt-2 text-sm text-white">Scorecard, benchmark band, topical map, and 7/30/90-day plan.</p>
          </div>
        </div>
        <Input
          value={context.brand}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) => setContext((prev) => ({ ...prev, brand: event.target.value }))}
          placeholder="Brand"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          value={context.category}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) => setContext((prev) => ({ ...prev, category: event.target.value }))}
          placeholder="Category"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          value={context.icp}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) => setContext((prev) => ({ ...prev, icp: event.target.value }))}
          placeholder="ICP"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          value={context.vertical}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) => setContext((prev) => ({ ...prev, vertical: event.target.value }))}
          placeholder="Vertical"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          value={competitorsText}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) =>
            setContext((prev) => ({
              ...prev,
              competitors: event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            }))
          }
          placeholder="Competitor 1, Competitor 2"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Button className="w-full bg-white text-black hover:bg-zinc-200" disabled={loading} onClick={() => onConfirm(context)}>
          {loading ? 'Running 5 checks...' : 'Looks Right, Run Audit'}
        </Button>
      </CardContent>
    </Card>
  )
}
