'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface AuditFormProps {
  onSubmit: (input: { domain: string; email: string }) => Promise<void>
  loading?: boolean
}

export function AuditForm({ onSubmit, loading }: AuditFormProps) {
  const [domain, setDomain] = useState('')
  const [email, setEmail] = useState('')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Your AI Visibility Audit</CardTitle>
        <CardDescription>
          Enter your domain and email to see whether AI buyers are being sent to competitors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="url"
          placeholder="yourdomain.com"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        />
        <Input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button
          className="w-full"
          disabled={loading || !domain || !email}
          onClick={() => {
            void onSubmit({ domain, email }).catch((error) => {
              console.error('[AuditForm] Submit failed:', error)
            })
          }}
        >
          {loading ? 'Detecting your brand...' : 'Audit My AI Visibility'}
        </Button>
      </CardContent>
    </Card>
  )
}
