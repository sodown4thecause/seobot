import type {
  DailyDigestDocument,
  GeomodeCitation,
  GeomodeEngineSummary,
  SerpKeywordSnapshot,
} from '../contracts/digest.js'

export interface GeomodeDailySummary {
  status: 'ok' | 'degraded' | 'missing'
  engines: GeomodeEngineSummary[]
  citations: GeomodeCitation[]
  mentionDelta?: number
  citationDelta?: number
  error?: string
}

export interface DigestBuildInput {
  date: string
  brand: string
  windowHours: number
  geomode: GeomodeDailySummary
  serpSnapshots: SerpKeywordSnapshot[]
  previousSerpSnapshots?: SerpKeywordSnapshot[]
}

function diffSerpFeatures(current: SerpKeywordSnapshot, previous?: SerpKeywordSnapshot) {
  const currentFeatures = new Set(current.serpFeatures)
  const previousFeatures = new Set(previous?.serpFeatures ?? [])
  const added = [...currentFeatures].filter(feature => !previousFeatures.has(feature))
  const removed = [...previousFeatures].filter(feature => !currentFeatures.has(feature))
  return { added, removed }
}

export function buildDailyDigest(input: DigestBuildInput): DailyDigestDocument {
  const degradedSections: string[] = []
  if (input.geomode.status !== 'ok') degradedSections.push('geomode')
  if (input.serpSnapshots.length === 0) degradedSections.push('serp')

  const rankMovers = input.serpSnapshots
    .filter(snapshot => typeof snapshot.rankDelta === 'number' && snapshot.rankDelta !== 0)
    .sort((a, b) => Math.abs(b.rankDelta ?? 0) - Math.abs(a.rankDelta ?? 0))
    .slice(0, 10)

  const serpFeatureChanges = input.serpSnapshots
    .map(snapshot => {
      const previous = input.previousSerpSnapshots?.find(item => item.keyword === snapshot.keyword)
      const diff = diffSerpFeatures(snapshot, previous)
      return diff.added.length || diff.removed.length
        ? { keyword: snapshot.keyword, added: diff.added, removed: diff.removed }
        : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return {
    date: input.date,
    brand: input.brand,
    generatedAt: new Date().toISOString(),
    degraded: degradedSections.length > 0,
    degradedSections,
    geomode: {
      status: input.geomode.status,
      windowHours: input.windowHours,
      engines: input.geomode.engines,
      citations: input.geomode.citations,
      mentionDelta: input.geomode.mentionDelta,
      citationDelta: input.geomode.citationDelta,
    },
    serp: {
      status: input.serpSnapshots.length > 0 ? 'ok' : 'missing',
      keywords: input.serpSnapshots,
      rankMovers,
      serpFeatureChanges,
    },
  }
}

export function digestEmbeddingSections(digest: DailyDigestDocument): Array<{ sectionKey: string, content: string }> {
  const sections: Array<{ sectionKey: string, content: string }> = [
    {
      sectionKey: 'overview',
      content: `GEO digest ${digest.date} for ${digest.brand}. Degraded sections: ${digest.degradedSections.join(', ') || 'none'}.`,
    },
    {
      sectionKey: 'geomode',
      content: JSON.stringify(digest.geomode, null, 2),
    },
    {
      sectionKey: 'serp',
      content: JSON.stringify(digest.serp, null, 2),
    },
  ]

  return sections
}
