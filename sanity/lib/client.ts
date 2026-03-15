import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

type SanityClient = ReturnType<typeof createClient>

const unavailableClient = {
  async fetch<T>(query: string): Promise<T> {
    const defaultValue = query.includes('[0]') ? null : []
    return defaultValue as T
  },
} as unknown as SanityClient

export const client: SanityClient = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false, // Disabled to ensure ISR revalidation fetches fresh content
    })
  : null

function fallbackForQuery<T>(query: string): T {
  return (query.trimEnd().endsWith('[0]') ? null : []) as T
}

const safeFetch = async <T>(
  query: string,
  params: Parameters<SanityClient['fetch']>[1] = {},
  options?: Parameters<SanityClient['fetch']>[2]
): Promise<T> => {
  if (!baseClient) {
    return fallbackForQuery<T>(query)
  }

  try {
    if (typeof options === 'undefined') {
      return await baseClient.fetch<T>(query, params)
    }
    const response = await baseClient.fetch(query, params, options)
    return response as unknown as T
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Sanity fetch error'
    console.warn('[Sanity] Falling back to empty result:', {
      message,
      queryPreview: query.trim().slice(0, 120),
    })
    return fallbackForQuery<T>(query)
  }
}

const fallbackClient: Pick<SanityClient, 'fetch'> = {
  fetch: safeFetch as SanityClient['fetch'],
}

export const client: SanityClient = baseClient
  ? Object.assign(baseClient, { fetch: safeFetch as SanityClient['fetch'] })
  : (fallbackClient as SanityClient)
