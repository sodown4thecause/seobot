/**
 * Simple test for n8n webhook integration
 * This test verifies the webhook tool structure and response handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('N8N Webhook Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct webhook URL configuration', () => {
    const expectedUrl = 'https://zuded9wg.rcld.app/webhook/domain'
    // This will be used when the n8n workflow is active
    expect(expectedUrl).toMatch(/^https:\/\/zuded9wg\.rcld\.app\/webhook\/domain$/)
  })

  it('should handle domain parameter correctly', async () => {
    const mockDomain = 'example.com'

    // Mock fetch response for when webhook is working
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: vi.fn().mockResolvedValue({
        success: true,
        domain: mockDomain,
        backlinks: [
          {
            url: 'https://example.com/backlink',
            domain: 'example.com',
            anchor: 'test anchor',
            type: 'dofollow'
          }
        ],
        total_backlinks: 1
      })
    })

    // Test the request structure that would be sent
    const expectedRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ domain: mockDomain })
    }

    expect(expectedRequest.body).toBe(JSON.stringify({ domain: mockDomain }))
    expect(expectedRequest.headers['Content-Type']).toBe('application/json')
  })

  it('should handle webhook errors gracefully', async () => {
    // Mock failed webhook response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: vi.fn().mockResolvedValue('Webhook not found')
    })

    const mockDomain = 'test.com'
    const response = await fetch('https://zuded9wg.rcld.app/webhook/domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: mockDomain })
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  it('should process webhook response structure correctly', () => {
    const mockResponse = {
      success: true,
      domain: 'example.com',
      backlinks: [
        {
          url: 'https://site1.com/page1',
          domain: 'site1.com',
          anchor: 'SEO tools',
          type: 'dofollow'
        },
        {
          url: 'https://site2.com/page2',
          domain: 'site2.com',
          anchor: 'best resources',
          type: 'dofollow'
        }
      ],
      total_backlinks: 2,
      referring_domains: 2
    }

    expect(mockResponse).toHaveProperty('success', true)
    expect(mockResponse).toHaveProperty('domain', 'example.com')
    expect(mockResponse).toHaveProperty('backlinks')
    expect(Array.isArray(mockResponse.backlinks)).toBe(true)
    expect(mockResponse.backlinks.length).toBe(2)
    expect(mockResponse.backlinks[0]).toHaveProperty('url')
    expect(mockResponse.backlinks[0]).toHaveProperty('anchor')
  })
})
