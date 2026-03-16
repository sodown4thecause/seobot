import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

type SanityClient = ReturnType<typeof createClient>

const baseClient: SanityClient | null = projectId
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
    console.error('[Sanity] Query failed:', {
      message,
      queryPreview: query.trim().slice(0, 120),
      projectId: projectId || 'NOT_SET',
      dataset: dataset || 'NOT_SET',
    })
    // Throw error in development to catch issues early
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Sanity query failed: ${message}`)
    }
    return fallbackForQuery<T>(query)
  }
}

const fallbackClient: Pick<SanityClient, 'fetch'> = {
  fetch: safeFetch as SanityClient['fetch'],
}

export const client: SanityClient = baseClient
  ? Object.assign(baseClient, { fetch: safeFetch as SanityClient['fetch'] })
  : (fallbackClient as SanityClient)
