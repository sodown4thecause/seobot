import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditResults } from '@/lib/audit/types'

interface ResultsHeroProps {
  results: AuditResults
}

export function ResultsHero({ results }: ResultsHeroProps) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle>Competitive Visibility Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-lg font-semibold">
          Across 5 AI checks, <span className="underline">{results.brand}</span> was recommended{' '}
          <span className="text-red-700">{results.brandFoundCount}</span> times.
        </p>
        <p className="text-lg font-semibold">
          <span className="underline">{results.topCompetitor}</span> was recommended{' '}
          <span className="text-red-700">{results.topCompetitorFoundCount}</span> times.
        </p>
        <p className="text-sm text-muted-foreground">{results.competitorAdvantage}</p>
      </CardContent>
    </Card>
  )
}
