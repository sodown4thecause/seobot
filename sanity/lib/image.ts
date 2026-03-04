import createImageUrlBuilder, { type SanityImageSource } from '@sanity/image-url'

import { dataset, hasSanityConfig, projectId } from '../env'

const SANITY_CONFIG_ERROR = 'Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID.'

// https://www.sanity.io/docs/image-url
const builder = hasSanityConfig ? createImageUrlBuilder({ projectId, dataset }) : null

export const urlFor = (source: SanityImageSource) => {
  if (!builder) {
    throw new Error(SANITY_CONFIG_ERROR)
  }

  return builder.image(source)
}
