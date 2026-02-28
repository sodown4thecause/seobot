import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditResults } from '@/lib/audit/types'

interface ResultsHeroProps {
  results: AuditResults
}

export function ResultsHero({ results }: ResultsHeroProps) {
  const misses = Math.max(0, results.totalChecks - results.brandFoundCount)

  return (
    <Card className="border-red-200 bg-red-50/60">
      <CardHeader>
        <CardTitle>Competitive Visibility Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xl font-semibold leading-tight">
          Across {results.totalChecks} AI checks, <span className="underline">{results.brand}</span> was recommended{' '}
          <span className="text-red-700">{results.brandFoundCount}</span> times.
        </p>
        <p className="text-xl font-semibold leading-tight">
          <span className="underline">{results.topCompetitor}</span> was recommended{' '}
          <span className="text-red-700">{results.topCompetitorFoundCount}</span> times.
        </p>
        <p className="text-sm text-muted-foreground">{results.competitorAdvantage}</p>
        <p className="rounded-md border border-red-200 bg-white/70 p-3 text-sm font-medium text-red-900">
          Your brand was missing from {misses} of {results.totalChecks} buyer-intent checks. This is where AI-assisted buyers are choosing alternatives.
        </p>
      </CardContent>
    </Card>
  )
}
