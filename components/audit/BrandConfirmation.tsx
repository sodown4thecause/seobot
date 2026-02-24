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
    <Card>
      <CardHeader>
        <CardTitle>Confirm What We Detected</CardTitle>
        <CardDescription>
          Edit anything before we run the 5 live AI checks. This keeps results accurate and avoids wasted API cost.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={context.brand}
          onChange={(event) => setContext((prev) => ({ ...prev, brand: event.target.value }))}
          placeholder="Brand"
        />
        <Input
          value={context.category}
          onChange={(event) => setContext((prev) => ({ ...prev, category: event.target.value }))}
          placeholder="Category"
        />
        <Input
          value={context.icp}
          onChange={(event) => setContext((prev) => ({ ...prev, icp: event.target.value }))}
          placeholder="ICP"
        />
        <Input
          value={context.vertical}
          onChange={(event) => setContext((prev) => ({ ...prev, vertical: event.target.value }))}
          placeholder="Vertical"
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
        />
        <Button className="w-full" disabled={loading} onClick={() => onConfirm(context)}>
          {loading ? 'Running 5 checks...' : 'Looks Right, Run Audit'}
        </Button>
      </CardContent>
    </Card>
  )
}
