'use client'

import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query'
import { getStaleTimeForDataType } from '@/lib/cache/query-client'

type UseDashboardDataOptions<TQueryFnData, TData = TQueryFnData> = {
  queryKey: QueryKey
  dataType: string
  queryFn: () => Promise<TQueryFnData>
} & Pick<
  UseQueryOptions<TQueryFnData, Error, TData, QueryKey>,
  'enabled' | 'initialData' | 'refetchInterval' | 'refetchOnReconnect' | 'refetchOnWindowFocus' | 'retry' | 'select'
>

export function useDashboardData<TQueryFnData, TData = TQueryFnData>(
  options: UseDashboardDataOptions<TQueryFnData, TData>
) {
  return useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    staleTime: getStaleTimeForDataType(options.dataType),
    gcTime: 1000 * 60 * 60,
    enabled: options.enabled,
    initialData: options.initialData,
    refetchInterval: options.refetchInterval,
    refetchOnReconnect: options.refetchOnReconnect,
    refetchOnWindowFocus: options.refetchOnWindowFocus,
    retry: options.retry,
    select: options.select,
    placeholderData: previousData => previousData,
  })
}
