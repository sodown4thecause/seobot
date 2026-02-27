export type ProviderStatus = 'ok' | 'partial' | 'failed'

export type RankTrackerProviderName = 'dataforseo' | 'googleSearchConsole'

export type RankTrackerProviderStatuses = Record<RankTrackerProviderName, ProviderStatus>

export interface RankTrackerProviderStatusSummary {
  overall: ProviderStatus
  providers: RankTrackerProviderStatuses
}

export interface NormalizedRankKeyword {
  keyword: string
  currentPosition: number
  previousPosition: number
  change: number
}

export interface RankTrackerMovementBucket {
  count: number
  keywords: NormalizedRankKeyword[]
}

export interface RankTrackerSummary {
  trackedKeywords: number
  averagePosition: number
  visibility: number
}

export interface NormalizedRankTrackerPayload {
  summary: RankTrackerSummary
  movements: {
    winners: RankTrackerMovementBucket
    losers: RankTrackerMovementBucket
    unchanged: RankTrackerMovementBucket
  }
  keywords: NormalizedRankKeyword[]
  providerStatus: RankTrackerProviderStatusSummary
}
