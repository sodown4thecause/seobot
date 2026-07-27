import { expect, test, type APIRequestContext } from '@playwright/test'

const serviceRoutes = [
  '/api/cron/weekly-seo-research',
  '/api/cron/weekly-geo-research',
  '/api/cron/fortnightly-industry-research',
  '/api/rag/ingest',
]

const paidSmokeEnabled = process.env.SMOKE_RUN_PAID === 'true'
const sessionCookie = process.env.SMOKE_SESSION_COOKIE

function requireSessionCookie() {
  if (!sessionCookie) {
    throw new Error('SMOKE_SESSION_COOKIE is required for paid-product smoke tests')
  }
  return sessionCookie
}

async function runChat(request: APIRequestContext, mode: 'seo' | 'geo', prompt: string) {
  const response = await request.post('/api/chat', {
    headers: sessionCookie ? { cookie: sessionCookie } : undefined,
    data: {
      messages: [
        {
          id: `smoke-${mode}-${Date.now()}`,
          role: 'user',
          parts: [{ type: 'text', text: prompt }],
        },
      ],
      context: { mode },
    },
    timeout: 120_000,
  })

  expect(response.ok(), await response.text()).toBe(true)
  return response.text()
}

test.describe('credential-free post-deployment smoke', () => {
  test('homepage and free Reddit audit are publicly reachable', async ({ request }) => {
    const homepage = await request.get('/', { maxRedirects: 0 })
    expect(homepage.status()).toBe(200)

    const redditAudit = await request.get('/reddit-gap', { maxRedirects: 0 })
    expect(redditAudit.status()).toBe(200)
    expect(redditAudit.headers().location).toBeUndefined()
    await expect(redditAudit.text()).resolves.toContain('Reddit')
  })

  test('Google sign-in is offered', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('dashboard and chat enforce authentication', async ({ request }) => {
    const dashboard = await request.get('/dashboard', { maxRedirects: 0 })
    expect(dashboard.status()).toBe(307)
    expect(dashboard.headers().location).toContain('/login')

    const chat = await request.post('/api/chat', {
      data: {
        messages: [
          { id: 'unauthenticated-smoke', role: 'user', parts: [{ type: 'text', text: 'test' }] },
        ],
        context: { mode: 'seo' },
      },
    })
    expect(chat.status()).toBe(401)
  })

  for (const route of serviceRoutes) {
    test(`${route} rejects missing service credentials without redirecting`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 })
      expect(response.status()).toBe(401)
      expect(response.headers().location).toBeUndefined()
    })
  }
})

test.describe('credentialed paid-product smoke', () => {
  test.beforeAll(() => {
    if (paidSmokeEnabled && !sessionCookie) {
      throw new Error('SMOKE_SESSION_COOKIE is required when SMOKE_RUN_PAID=true')
    }
  })

  test.skip(!paidSmokeEnabled, 'Set SMOKE_RUN_PAID=true with a dedicated paid test session')

  test('runs SEO and GEO tool calls and saves an artifact to Workspace', async ({ request }) => {
    const seoStream = await runChat(
      request,
      'seo',
      'Use the keyword research tool for "AI SEO platform" and summarize one result.'
    )
    expect(seoStream).toMatch(/tool|keyword/i)

    const geoStream = await runChat(
      request,
      'geo',
      'Use a GEO\/AEO analysis tool to assess FlowIntent visibility in ChatGPT or Perplexity.'
    )
    expect(geoStream).toMatch(/tool|geo|visibility|citation/i)

    const title = `Post-deploy smoke artifact ${Date.now()}`
    const cookie = requireSessionCookie()
    const saved = await request.post('/api/library/save', {
      headers: { cookie },
      data: {
        title,
        itemType: 'component',
        data: { smoke: true },
        metadata: { artifactType: 'keyword', chatMode: 'seo', artifactVersion: 1 },
        tags: ['post-deploy-smoke'],
      },
    })
    expect(saved.ok(), await saved.text()).toBe(true)

    const workspace = await request.get('/api/library?artifactsOnly=true', {
      headers: { cookie },
    })
    expect(workspace.ok(), await workspace.text()).toBe(true)
    expect(await workspace.text()).toContain(title)
  })
})
