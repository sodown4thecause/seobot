'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { getWebsiteAuditJob, runWebsiteAudit, type RunWebsiteAuditInput } from '@/lib/dashboard/api-client'
import { useJobStatus } from '@/lib/hooks/use-job-status'

export function useWebsiteAuditWorkspace() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const runMutation = useMutation({
    mutationFn: (input: RunWebsiteAuditInput) => runWebsiteAudit(input),
    onSuccess: (payload) => {
      setActiveJobId(payload.jobId)
    },
  })

  const jobQuery = useQuery({
    queryKey: ['dashboard', 'website-audit', activeJobId],
    queryFn: () => getWebsiteAuditJob(activeJobId as string),
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'completed' ? false : 5_000
    },
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
    snapshot,
    streamStatus,
  }
}
