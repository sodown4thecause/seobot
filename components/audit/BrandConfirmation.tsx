'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { BrandDetectionPayload } from '@/lib/audit/types'

interface BrandConfirmationProps {
  detected: BrandDetectionPayload
  onConfirm: (context: BrandDetectionPayload) => Promise<void>
  loading?: boolean
}

export function BrandConfirmation({ detected, onConfirm, loading }: BrandConfirmationProps) {
  const [context, setContext] = useState<BrandDetectionPayload>(detected)

  const competitorsText = useMemo(() => context.competitors.join(', '), [context.competitors])

  return (
    <Card className="border-white/10 bg-zinc-950 text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Confirm What We Detected</CardTitle>
        <CardDescription className="text-zinc-400">
          Edit anything before we run the 5 live AI checks. This keeps results accurate and avoids wasted API cost.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={context.brand}
          onChange={(event) => setContext((prev) => ({ ...prev, brand: event.target.value }))}
          placeholder="Brand"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          value={context.category}
          onChange={(event) => setContext((prev) => ({ ...prev, category: event.target.value }))}
          placeholder="Category"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          value={context.icp}
          onChange={(event) => setContext((prev) => ({ ...prev, icp: event.target.value }))}
          placeholder="ICP"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          value={context.vertical}
          onChange={(event) => setContext((prev) => ({ ...prev, vertical: event.target.value }))}
          placeholder="Vertical"
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          value={competitorsText}
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
