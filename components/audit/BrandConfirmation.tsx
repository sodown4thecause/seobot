'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { BrandDetectionPayload } from '@/lib/audit/types'

interface BrandConfirmationProps {
  detected: BrandDetectionPayload
  onConfirm: (input: { context: BrandDetectionPayload; email: string }) => Promise<void>
  loading?: boolean
}

export function BrandConfirmation({ detected, onConfirm, loading }: BrandConfirmationProps) {
  const [context, setContext] = useState<BrandDetectionPayload>(detected)
  const [email, setEmail] = useState('')

  const competitorsText = useMemo(() => context.competitors.join(', '), [context.competitors])

  return (
    <Card className="glass-panel rounded-[2rem] border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-white">Preview complete. Unlock the full scorecard.</CardTitle>
        <CardDescription>
          Refine the brand context, add the email for your saved scorecard link, and we will run the full cross-model audit.
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
        />
        <Input
          value={context.category}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) => setContext((prev) => ({ ...prev, category: event.target.value }))}
          placeholder="Category"
        />
        <Input
          value={context.icp}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) => setContext((prev) => ({ ...prev, icp: event.target.value }))}
          placeholder="ICP"
        />
        <Input
          value={context.vertical}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) => setContext((prev) => ({ ...prev, vertical: event.target.value }))}
          placeholder="Vertical"
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
        />
        <Input
          type="email"
          value={email}
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
        />
        <Button className="w-full bg-white text-black hover:bg-zinc-100" disabled={loading || !email} onClick={() => onConfirm({ context, email })}>
          {loading ? 'Building your scorecard...' : 'Unlock Full Scorecard'}
        </Button>
      </CardContent>
    </Card>
  )
}
