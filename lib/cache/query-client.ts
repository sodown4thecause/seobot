import { QueryClient } from '@tanstack/react-query'

export const dashboardQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

export function getStaleTimeForDataType(dataType: string): number {
  switch (dataType) {
    case 'rankings':
      return 1000 * 60 * 60 * 6
    case 'backlinks':
      return 1000 * 60 * 60 * 48
    case 'audit':
      return 1000 * 60 * 60 * 24
    case 'competitor':
      return 1000 * 60 * 60 * 12
    default:
      return 1000 * 60 * 5
  }
}
