import { describe, expect, it } from 'vitest'
import { getSafeHostname, isSafeExternalUrl, toSafeExternalUrl } from '@/lib/utils/safe-external-url'

describe('safe external URL helpers', () => {
  it('accepts only http and https URLs', () => {
    expect(isSafeExternalUrl('https://example.com/path')).toBe(true)
    expect(isSafeExternalUrl('http://example.com')).toBe(true)
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalUrl('data:text/html;base64,abc')).toBe(false)
    expect(isSafeExternalUrl('not a url')).toBe(false)
  })

  it('returns normalized safe URLs or null', () => {
    expect(toSafeExternalUrl('https://example.com')).toBe('https://example.com/')
    expect(toSafeExternalUrl('')).toBeNull()
    expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull()
  })

  it('extracts hostnames only for safe URLs', () => {
    expect(getSafeHostname('https://example.com/path')).toBe('example.com')
    expect(getSafeHostname('ftp://example.com')).toBeNull()
    expect(getSafeHostname('bad url')).toBeNull()
  })
})
