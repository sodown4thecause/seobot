import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
}

describe('sanity env defaults', () => {
  afterEach(() => {
    vi.resetModules()

    if (ORIGINAL_ENV.NEXT_PUBLIC_SANITY_PROJECT_ID === undefined) {
      delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    } else {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = ORIGINAL_ENV.NEXT_PUBLIC_SANITY_PROJECT_ID
    }

    if (ORIGINAL_ENV.NEXT_PUBLIC_SANITY_DATASET === undefined) {
      delete process.env.NEXT_PUBLIC_SANITY_DATASET
    } else {
      process.env.NEXT_PUBLIC_SANITY_DATASET = ORIGINAL_ENV.NEXT_PUBLIC_SANITY_DATASET
    }

    if (ORIGINAL_ENV.NEXT_PUBLIC_SANITY_API_VERSION === undefined) {
      delete process.env.NEXT_PUBLIC_SANITY_API_VERSION
    } else {
      process.env.NEXT_PUBLIC_SANITY_API_VERSION = ORIGINAL_ENV.NEXT_PUBLIC_SANITY_API_VERSION
    }
  })

  it('falls back to the repo Sanity project when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    delete process.env.NEXT_PUBLIC_SANITY_DATASET
    delete process.env.NEXT_PUBLIC_SANITY_API_VERSION

    const sanityEnv = await import('@/sanity/env')

    expect(sanityEnv.projectId).toBe('5hi8oae6')
    expect(sanityEnv.dataset).toBe('production')
    expect(sanityEnv.apiVersion).toBe('2025-12-30')
    expect(sanityEnv.hasSanityConfig).toBe(false)
  })
})
