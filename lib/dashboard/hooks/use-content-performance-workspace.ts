'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getContentPerformanceSnapshot,
  refreshContentPerformance,
  type ContentPerformanceRefreshInput,
  type ContentPerformanceSnapshotInput,
} from '@/lib/dashboard/api-client'
import type { WorkspaceSnapshot } from '@/lib/dashboard/analytics/contracts'
import { buildWorkspaceSnapshot } from '@/lib/dashboard/analytics/contracts'

const QUERY_KEY = ['dashboard', 'content-performance', 'snapshot'] as const

const FALLBACK: WorkspaceSnapshot = buildWorkspaceSnapshot('content-performance')

export function useContentPerformanceWorkspace(input: ContentPerformanceSnapshotInput | null) {
  const queryClient = useQueryClient()

  const snapshotQuery = useQuery({
    queryKey: [...QUERY_KEY, input],
    queryFn: () => getContentPerformanceSnapshot(input as ContentPerformanceSnapshotInput),
    enabled: Boolean(input?.domain),
    staleTime: 5 * 60 * 1_000,
    retry: 1,
  })

  const refreshMutation = useMutation({
    mutationFn: (refreshInput: ContentPerformanceRefreshInput) => refreshContentPerformance(refreshInput),
    onSuccess: (data) => {
      queryClient.setQueryData([...QUERY_KEY, input], { success: true, data: data.data })
    },
  })

  const snapshot: WorkspaceSnapshot = snapshotQuery.data?.data ?? FALLBACK

  return {
    snapshot,
    kpis: snapshot.kpis,
    modules: snapshot.modules,
    isLoading: snapshotQuery.isLoading,
    isFetching: snapshotQuery.isFetching,
    isRefreshing: refreshMutation.isPending,
    error: snapshotQuery.error,
    refresh: refreshMutation.mutateAsync,
    refreshError: refreshMutation.error,
  }
}
