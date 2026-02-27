'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { getRankTrackerHistory, getRankTrackerJob, runRankTracker, type RunRankTrackerInput } from '@/lib/dashboard/api-client'
import { useJobStatus } from '@/lib/hooks/use-job-status'

export function useRankTrackerWorkspace() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [historyDomain, setHistoryDomain] = useState<string | undefined>(undefined)

  const runMutation = useMutation({
    mutationFn: (input: RunRankTrackerInput) => runRankTracker(input),
    onSuccess: (payload) => {
      setActiveJobId(payload.jobId)
      setHistoryDomain(payload.websiteUrl)
    },
  })

  const jobQuery = useQuery({
    queryKey: ['dashboard', 'rank-tracker', activeJobId],
    queryFn: () => getRankTrackerJob(activeJobId as string),
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'completed' ? false : 5_000
    },
    retry: 1,
  })

  const historyQuery = useQuery({
    queryKey: ['dashboard', 'rank-tracker', 'history', historyDomain],
    queryFn: () => getRankTrackerHistory({ websiteUrl: historyDomain, limit: 10 }),
    enabled: Boolean(historyDomain),
    refetchInterval: 30_000,
    retry: 1,
  })

  const stream = useJobStatus(Boolean(activeJobId))
  const streamStatus = useMemo(() => {
    if (!activeJobId || stream.job?.jobId !== activeJobId) {
      return null
    }

    return {
      progress: stream.progress,
      status: stream.status,
      isConnected: stream.isConnected,
      error: stream.error,
    }
  }, [activeJobId, stream.error, stream.isConnected, stream.job?.jobId, stream.progress, stream.status])

  const snapshot = jobQuery.data?.snapshot ?? runMutation.data?.snapshot ?? null

  return {
    run: runMutation.mutateAsync,
    runMutation,
    activeJobId,
    setActiveJobId,
    jobQuery,
    historyQuery,
    snapshot,
    streamStatus,
  }
}
