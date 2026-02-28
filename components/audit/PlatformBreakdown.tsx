import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditResults, PlatformResult } from '@/lib/audit/types'

interface PlatformBreakdownProps {
  summary: AuditResults['platformResults']
  rawResults: PlatformResult[]
}

export function PlatformBreakdown({ summary, rawResults }: PlatformBreakdownProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Perplexity (3 checks)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {summary.perplexity.map((check, index) => (
            <div key={`perplexity-${index}`} className="flex items-center justify-between">
              <span>Prompt {index + 1}</span>
              <Badge variant={check.mentioned ? 'default' : 'outline'}>
                {check.mentioned ? `Mentioned (#{check.position || '-'})` : 'Not found'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grok</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={summary.grok.mentioned ? 'default' : 'outline'}>
            {summary.grok.mentioned ? `Mentioned (#${summary.grok.position || '-'})` : 'Not found'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gemini</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={summary.gemini.mentioned ? 'default' : 'outline'}>
            {summary.gemini.mentioned ? `Mentioned (#${summary.gemini.position || '-'})` : 'Not found'}
          </Badge>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Prompt Evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rawResults.map((result, index) => (
            <div key={`${result.platform}-${index}`} className="rounded-md border p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{result.platform.toUpperCase()}</span>
                <span className="text-xs text-muted-foreground">{result.prompt}</span>
              </div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant={result.brandMentioned ? 'default' : 'outline'}>
                  {result.brandMentioned ? `Brand found (#${result.brandPosition || '-'})` : 'Brand not found'}
                </Badge>
                {result.competitorsMentioned.length > 0 ? (
                  <Badge variant="secondary">Competitors: {result.competitorsMentioned.slice(0, 3).join(', ')}</Badge>
                ) : null}
              </div>
              <p className="line-clamp-2 text-muted-foreground">{result.brandContext || result.rawResponse}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
