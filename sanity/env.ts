export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-02'

const configuredDataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
)

export const dataset = configuredDataset === 'preview'
  ? 'production'
  : configuredDataset

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
export const hasSanityConfig = projectId.length > 0
