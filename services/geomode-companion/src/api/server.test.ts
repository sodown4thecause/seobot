import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { MAX_JSON_BODY_BYTES, READ_API_HOST, parseTrendsDays, readJsonBody } from './server.js'

describe('read API safeguards', () => {
  it('binds the read API to loopback', () => {
    expect(READ_API_HOST).toBe('127.0.0.1')
  })

  it.each(['0', '91', '1.5', 'abc'])('rejects invalid trends days: %s', value => {
    expect(() => parseTrendsDays(value)).toThrow('days must be an integer from 1 to 90')
  })

  it('accepts trends days integers from 1 to 90', () => {
    expect(parseTrendsDays('1')).toBe(1)
    expect(parseTrendsDays('90')).toBe(90)
  })

  it('rejects JSON request bodies larger than 1 MiB', async () => {
    const request = Readable.from([Buffer.alloc(MAX_JSON_BODY_BYTES + 1, 0x20)])

    await expect(readJsonBody(request)).rejects.toMatchObject({ status: 413 })
  })
})
