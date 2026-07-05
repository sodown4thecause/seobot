'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Copy, Code2 } from 'lucide-react'

interface SchemaMarkupResultProps {
  toolInvocation: {
    result?: {
      success?: boolean
      error?: string
      schemaType?: string
      jsonLd?: Record<string, unknown>
      scriptTag?: string
      validation?: { isValid: boolean; errors: string[] }
      implementationNotes?: string[]
    }
  }
}

export function SchemaMarkupResult({ toolInvocation }: SchemaMarkupResultProps) {
  const result = toolInvocation.result
  const [copied, setCopied] = useState<'json' | 'script' | null>(null)

  if (!result?.success) {
    return (
      <div className="my-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
        {result?.error ?? 'Schema generation failed.'}
      </div>
    )
  }

  const copy = async (text: string, kind: 'json' | 'script') => {
    await navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  const jsonText = JSON.stringify(result.jsonLd, null, 2)

  return (
    <Card className="my-4 overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 border-l-4 border-l-amber-500/50">
      <CardHeader className="border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
              <Code2 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Schema Markup — {result.schemaType}</CardTitle>
              <Badge
                variant="outline"
                className={
                  result.validation?.isValid
                    ? 'mt-1 border-emerald-500/30 text-emerald-300'
                    : 'mt-1 border-rose-500/30 text-rose-300'
                }
              >
                {result.validation?.isValid ? 'Valid JSON-LD' : 'Validation issues'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700"
              onClick={() => copy(jsonText, 'json')}
            >
              {copied === 'json' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="ml-1.5">JSON</span>
            </Button>
            {result.scriptTag && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-200"
                onClick={() => copy(result.scriptTag!, 'script')}
              >
                {copied === 'script' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="ml-1.5">Script tag</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <pre className="max-h-80 overflow-auto rounded-xl border border-zinc-800 bg-black/40 p-4 text-xs text-zinc-300">
          {jsonText}
        </pre>
        {result.implementationNotes?.length ? (
          <ul className="space-y-1 text-xs text-zinc-400">
            {result.implementationNotes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function SchemaMarkupArtifact({ data }: { data: unknown }) {
  return <SchemaMarkupResult toolInvocation={{ result: data as SchemaMarkupResultProps['toolInvocation']['result'] }} />
}
