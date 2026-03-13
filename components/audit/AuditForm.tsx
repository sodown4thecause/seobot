'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface AuditFormProps {
  onSubmit: (input: { domain: string }) => Promise<void>
  loading?: boolean
}

export function AuditForm({ onSubmit, loading }: AuditFormProps) {
  const [domain, setDomain] = useState('')

  return (
    <Card className="glass-panel overflow-hidden rounded-[2rem] border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-white">Get your AI visibility scorecard</CardTitle>
        <CardDescription>
          Start with your domain to preview how your brand is being evaluated across AI search. You can unlock the full scorecard after the preview.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="url"
          placeholder="yourdomain.com"
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        />
        <div className="grid gap-2 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-300 md:grid-cols-3">
          <div>AI visibility score</div>
          <div>Model-by-model snapshot</div>
          <div>Topical opportunity map</div>
        </div>
        <Button
          className="w-full bg-white text-black hover:bg-zinc-100"
          disabled={loading || !domain}
          onClick={() => {
            void onSubmit({ domain }).catch((error) => {
              console.error('[AuditForm] Submit failed:', error)
            })
          }}
        >
          {loading ? 'Previewing your scorecard...' : 'Preview My Scorecard'}
        </Button>
      </CardContent>
    </Card>
  )
}
