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
  : unavailableClient
