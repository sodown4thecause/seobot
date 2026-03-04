import { createClient } from 'next-sanity'

import { apiVersion, dataset, hasSanityConfig, projectId } from '../env'

const SANITY_CONFIG_ERROR = 'Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID.'

type SanityClient = ReturnType<typeof createClient>

const unavailableClient = new Proxy({} as object, {
  get() {
    throw new Error(SANITY_CONFIG_ERROR)
  },
}) as unknown as SanityClient

export const client: SanityClient = hasSanityConfig
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false, // Disabled to ensure ISR revalidation fetches fresh content
    })
  : unavailableClient
