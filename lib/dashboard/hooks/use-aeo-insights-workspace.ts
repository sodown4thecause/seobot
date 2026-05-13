'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getAeoInsightsSnapshot,
  refreshAeoInsights,
  type AeoRefreshInput,
  type AeoSnapshotInput,
} from '@/lib/dashboard/api-client'
import type { WorkspaceSnapshot } from '@/lib/dashboard/analytics/contracts'
import { buildWorkspaceSnapshot } from '@/lib/dashboard/analytics/contracts'

const QUERY_KEY = ['dashboard', 'aeo-insights', 'snapshot'] as const

const FALLBACK: WorkspaceSnapshot = buildWorkspaceSnapshot('aeo-insights')

export function useAeoInsightsWorkspace(input: AeoSnapshotInput | null) {
  const queryClient = useQueryClient()

  const snapshotQuery = useQuery({
    queryKey: [...QUERY_KEY, input],
    queryFn: () => getAeoInsightsSnapshot(input as AeoSnapshotInput),
    enabled: Boolean(input && input.keywords.length > 0),
    staleTime: 5 * 60 * 1_000,
    retry: 1,
  })

  const refreshMutation = useMutation({
    mutationFn: (refreshInput: AeoRefreshInput) => refreshAeoInsights(refreshInput),
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
