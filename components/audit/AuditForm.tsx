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
        <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Start Your AI Visibility Audit</CardTitle>
        <CardDescription className="text-zinc-400">
          Enter your domain and email to see whether AI buyers are being sent to competitors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="url"
          placeholder="yourdomain.com"
          className="glass-input h-12 border-white/10 bg-black/20 text-white placeholder:text-zinc-500"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border-white/15 bg-zinc-900 text-white"
        />
        <Button
          className="w-full bg-white text-black hover:bg-zinc-200"
          disabled={loading || !domain || !email}
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
