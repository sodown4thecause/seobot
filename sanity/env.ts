import {
  DEFAULT_SANITY_API_VERSION,
  DEFAULT_SANITY_DATASET,
  DEFAULT_SANITY_PROJECT_ID,
} from './project-config'

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || DEFAULT_SANITY_API_VERSION

const configuredProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const canUseDefaultProject =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

if (!configuredProjectId && canUseDefaultProject && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[Sanity] NEXT_PUBLIC_SANITY_PROJECT_ID not set. Falling back to the repository default Sanity project.',
  )
}

export const projectId = configuredProjectId || (canUseDefaultProject ? DEFAULT_SANITY_PROJECT_ID : '')
export const hasSanityConfig = Boolean(configuredProjectId)

if (configuredProjectId && configuredDataset === undefined) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SANITY_DATASET')
}

export const dataset = configuredDataset === 'preview'
  ? 'production'
  : configuredDataset || DEFAULT_SANITY_DATASET
