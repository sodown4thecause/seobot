import 'server-only'

import { aisaFetch } from './client'
import { aisaTwitterSearchSchema, aisaTwitterUserInfoSchema } from './schemas'

export function getTwitterUserInfo(params: {
  userName: string
  signal?: AbortSignal
  fetchImpl?: typeof fetch
}) {
  const query = new URLSearchParams({ userName: params.userName })
  return aisaFetch(
    `/apis/v1/twitter/user/info?${query.toString()}`,
    aisaTwitterUserInfoSchema,
    { signal: params.signal, fetchImpl: params.fetchImpl },
  )
}

export function searchTwitter(params: {
  query: string
  type?: 'Top' | 'Latest' | 'People' | 'Photos' | 'Videos'
  limit?: number
  signal?: AbortSignal
  fetchImpl?: typeof fetch
}) {
  const query = new URLSearchParams({
    query: params.query,
    type: params.type ?? 'Latest',
  })
  if (params.limit) query.set('limit', String(params.limit))

  return aisaFetch(
    `/apis/v1/twitter/search?${query.toString()}`,
    aisaTwitterSearchSchema,
    { signal: params.signal, fetchImpl: params.fetchImpl },
  )
}
