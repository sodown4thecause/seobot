import { describe, expect, it } from 'vitest'
import { metadata as loginMetadata } from '@/app/login/[[...rest]]/page'
import { metadata as signupMetadata } from '@/app/signup/[[...rest]]/page'
import { metadata as signInMetadata } from '@/app/sign-in/[[...sign-in]]/page'
import { metadata as signUpMetadata } from '@/app/sign-up/[[...sign-up]]/page'

describe('auth page metadata', () => {
  it.each([
    ['login', loginMetadata],
    ['signup', signupMetadata],
    ['sign-in', signInMetadata],
    ['sign-up', signUpMetadata],
  ])('keeps %s out of the search index', (_name, metadata) => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    })
  })
})
