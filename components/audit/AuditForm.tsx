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
    <Card className="border-white/10 bg-zinc-950 text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Start Your Content Gap Audit</CardTitle>
        <CardDescription className="text-zinc-400">
          Enter your domain and email to find the high-intent buyer questions your competitors are missing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="url"
          placeholder="yourdomain.com"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Button
          className="w-full bg-white text-black hover:bg-zinc-200"
          disabled={loading || !domain}
          onClick={() => {
            void onSubmit({ domain }).catch((error) => {
              console.error('[AuditForm] Submit failed:', error)
            })
          }}
        >
          {loading ? 'Scanning Reddit discussions...' : 'Reveal My Content Gaps'}
        </Button>
      </CardContent>
    </Card>
  )
}
