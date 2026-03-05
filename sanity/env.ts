export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-02'

const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export const dataset = configuredDataset === 'preview'
  ? 'production'
  : configuredDataset || 'production'

export const hasSanityProjectId = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'missing-project-id'
