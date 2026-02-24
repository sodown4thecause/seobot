import { useMemo } from 'react'

export type FreshnessState = 'fresh' | 'stale' | 'expired'

interface FreshnessResult {
  freshness: FreshnessState
  hoursAgo: number
  color: string
}

export function getFreshness(lastUpdated: Date): FreshnessResult {
  const now = Date.now()
  const hoursAgo = Math.max(0, Math.floor((now - lastUpdated.getTime()) / (1000 * 60 * 60)))

  if (hoursAgo < 24) {
    return { freshness: 'fresh', hoursAgo, color: 'text-green-500' }
  }

  if (hoursAgo < 48) {
    return { freshness: 'stale', hoursAgo, color: 'text-yellow-500' }
  }

  return { freshness: 'expired', hoursAgo, color: 'text-red-500' }
}

export function useFreshness(lastUpdated: Date): FreshnessResult {
  return useMemo(() => getFreshness(lastUpdated), [lastUpdated])
}
