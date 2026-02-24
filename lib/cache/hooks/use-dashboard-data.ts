'use client'

import { useQuery, type QueryKey } from '@tanstack/react-query'
import { getStaleTimeForDataType } from '@/lib/cache/query-client'

type UseDashboardDataOptions<T> = {
  queryKey: QueryKey
  dataType: string
  queryFn: () => Promise<T>
  enabled?: boolean
}

export function useDashboardData<T>(options: UseDashboardDataOptions<T>) {
  return useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    staleTime: getStaleTimeForDataType(options.dataType),
    gcTime: 1000 * 60 * 60,
    enabled: options.enabled,
    placeholderData: previousData => previousData,
  })
}
