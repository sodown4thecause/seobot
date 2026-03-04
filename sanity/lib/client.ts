import { createClient } from 'next-sanity'

import { apiVersion, dataset, hasSanityProjectId, projectId } from '../env'

const baseClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Disabled to ensure ISR revalidation fetches fresh content
})

function fallbackForQuery<T>(query: string): T {
  return (query.trimEnd().endsWith('[0]') ? null : []) as T
}

const originalFetch = baseClient.fetch.bind(baseClient)

const safeFetch = async <T>(
  query: string,
  params: Parameters<typeof baseClient.fetch>[1] = {},
  options?: Parameters<typeof baseClient.fetch>[2]
): Promise<T> => {
  if (!hasSanityProjectId) {
    return fallbackForQuery<T>(query)
  }

  try {
    if (typeof options === 'undefined') {
      return await originalFetch<T>(query, params)
    }
    const response = await originalFetch(query, params, options)
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

export const client = Object.assign(baseClient, {
  fetch: safeFetch as typeof baseClient.fetch,
})
