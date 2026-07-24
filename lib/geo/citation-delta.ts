import type { GeoEngine } from '@/lib/geo/types'

export type CitationDeltaVerdict = 'improved' | 'no_change' | 'regressed' | 'pending'

export interface CitationDeltaRun {
  engine: string
  status: string
  sentiment: string | null
  brandPosition: number | null
  citedUrls: string[] | null
  citedDomains: string[] | null
  mentionedBrands: string[] | null
  capturedAt?: Date | string
  brand?: string
}

export interface GeoCitationDelta {
  perEngine: Array<{
    engine: GeoEngine
    baseline: {
      mentioned: boolean
      sentiment: string | null
      brandPosition: number | null
      citedDomains: string[]
    }
    current: {
      mentioned: boolean
      sentiment: string | null
      brandPosition: number | null
      citedDomains: string[]
    }
    shippedUrlCited: boolean
  }>
  mentionRateBefore: number
  mentionRateAfter: number
  newCitations: string[]
  lostCitations: string[]
  verdict: CitationDeltaVerdict
  runsCompared: {
    baselineAt: string
    currentAt: string
    verificationCount: number
  }
}

const SENTIMENT_RANK: Record<string, number> = {
  negative: 0,
  absent: 0,
  not_mentioned: 0,
  neutral: 1,
  positive: 2,
}

function successful(run: CitationDeltaRun): boolean {
  return run.status === 'completed'
}

function mentioned(run: CitationDeltaRun): boolean {
  return (run.mentionedBrands ?? []).some((brand) => !run.brand || brand.toLowerCase() === run.brand.toLowerCase()) ||
    run.brandPosition !== null && run.brandPosition !== undefined
}

function aggregateRuns(runs: CitationDeltaRun[]): CitationDeltaRun | null {
  const successfulRuns = runs.filter(successful)
  if (successfulRuns.length === 0) return null

  const citedUrls = Array.from(new Set(successfulRuns.flatMap((run) => run.citedUrls ?? [])))
  const citedDomains = Array.from(new Set(successfulRuns.flatMap((run) => run.citedDomains ?? [])))
  const sentiments = successfulRuns.map((run) => run.sentiment).filter((value): value is string => Boolean(value))
  const sentiment = sentiments.sort((a, b) => (SENTIMENT_RANK[b] ?? 0) - (SENTIMENT_RANK[a] ?? 0))[0] ?? null

  return {
    ...successfulRuns[successfulRuns.length - 1],
    citedUrls,
    citedDomains,
    mentionedBrands: successfulRuns.some(mentioned) ? successfulRuns.flatMap((run) => run.mentionedBrands ?? []) : [],
    sentiment,
    brandPosition: successfulRuns.find((run) => run.brandPosition !== null)?.brandPosition ?? null,
  }
}

function isoDate(run: CitationDeltaRun | null): string {
  if (!run?.capturedAt) return new Date(0).toISOString()
  return new Date(run.capturedAt).toISOString()
}

function normaliseDomain(value: string): string {
  return value.toLowerCase().replace(/^www\./, '').replace(/\/$/, '')
}

function urlOrDomainMatches(shippedUrl: string | undefined, current: CitationDeltaRun): boolean {
  if (!shippedUrl) return false
  try {
    const shipped = new URL(shippedUrl)
    const shippedDomain = normaliseDomain(shipped.hostname)
    return (current.citedUrls ?? []).some((url) => url === shippedUrl) ||
      (current.citedDomains ?? []).some((domain) => normaliseDomain(domain) === shippedDomain)
  } catch {
    return (current.citedDomains ?? []).some((domain) => normaliseDomain(domain) === normaliseDomain(shippedUrl))
  }
}

export function computeCitationDelta(
  baselineRuns: CitationDeltaRun[],
  verificationRuns: CitationDeltaRun[],
  shippedUrl?: string | null,
): GeoCitationDelta {
  const baselineByEngine = new Map<string, CitationDeltaRun[]>()
  const verificationByEngine = new Map<string, CitationDeltaRun[]>()

  for (const run of baselineRuns) {
    const group = baselineByEngine.get(run.engine) ?? []
    group.push(run)
    baselineByEngine.set(run.engine, group)
  }
  for (const run of verificationRuns) {
    const group = verificationByEngine.get(run.engine) ?? []
    group.push(run)
    verificationByEngine.set(run.engine, group)
  }

  const engines = Array.from(new Set([...baselineByEngine.keys(), ...verificationByEngine.keys()])) as GeoEngine[]
  const perEngine = engines.flatMap((engine) => {
    const baseline = aggregateRuns(baselineByEngine.get(engine) ?? [])
    const current = aggregateRuns(verificationByEngine.get(engine) ?? [])
    if (!baseline || !current) return []

    return [{
      engine,
      baseline: {
        mentioned: mentioned(baseline),
        sentiment: baseline.sentiment,
        brandPosition: baseline.brandPosition,
        citedDomains: baseline.citedDomains ?? [],
      },
      current: {
        mentioned: mentioned(current),
        sentiment: current.sentiment,
        brandPosition: current.brandPosition,
        citedDomains: current.citedDomains ?? [],
      },
      shippedUrlCited: urlOrDomainMatches(shippedUrl ?? undefined, current),
    }]
  })

  const beforeMentioned = perEngine.filter((entry) => entry.baseline.mentioned).length
  const afterMentioned = perEngine.filter((entry) => entry.current.mentioned).length
  const mentionRateBefore = perEngine.length ? beforeMentioned / perEngine.length : 0
  const mentionRateAfter = perEngine.length ? afterMentioned / perEngine.length : 0
  const oldCitations = new Set(perEngine.flatMap((entry) => entry.baseline.citedDomains))
  const currentCitations = new Set(perEngine.flatMap((entry) => entry.current.citedDomains))
  const newCitations = Array.from(currentCitations).filter((domain) => !oldCitations.has(domain))
  const lostCitations = Array.from(oldCitations).filter((domain) => !currentCitations.has(domain))
  const sentimentImproved = perEngine.some((entry) =>
    (SENTIMENT_RANK[entry.current.sentiment ?? ''] ?? 0) > (SENTIMENT_RANK[entry.baseline.sentiment ?? ''] ?? 0)
  )
  const shippedCitation = perEngine.some((entry) => entry.shippedUrlCited)
  const verdict: CitationDeltaVerdict =
    mentionRateAfter > mentionRateBefore || shippedCitation || sentimentImproved
      ? 'improved'
      : mentionRateAfter < mentionRateBefore
        ? 'regressed'
        : 'no_change'

  const latestVerification = verificationRuns.filter(successful).at(-1) ?? null
  const earliestBaseline = baselineRuns.filter(successful)[0] ?? null

  return {
    perEngine,
    mentionRateBefore,
    mentionRateAfter,
    newCitations,
    lostCitations,
    verdict,
    runsCompared: {
      baselineAt: isoDate(earliestBaseline),
      currentAt: isoDate(latestVerification),
      verificationCount: verificationRuns.filter(successful).length,
    },
  }
}
