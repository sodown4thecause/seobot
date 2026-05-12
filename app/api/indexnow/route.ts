import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/config/env'
import { getIndexableUrls } from '@/lib/seo/indexable-routes'
import { INDEXNOW_KEY_LOCATION, normalizeIndexNowUrls, submitIndexNowUrls } from '@/lib/seo/indexnow'

export const maxDuration = 60

type IndexNowRequestBody = {
  urls?: string[]
}

function isAuthorized(request: Request): boolean {
  if (!serverEnv.CRON_SECRET) return true
  return request.headers.get('authorization') === `Bearer ${serverEnv.CRON_SECRET}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const urls = await getIndexableUrls()
  const result = await submitIndexNowUrls(urls)

  return NextResponse.json({
    success: result.ok,
    status: result.status,
    submitted: result.submittedUrls.length,
    keyLocation: INDEXNOW_KEY_LOCATION,
    response: result.body,
  }, { status: result.ok ? 200 : result.status })
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as IndexNowRequestBody
  const urls = normalizeIndexNowUrls(body.urls ?? [])

  if (urls.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Provide at least one valid FlowIntent URL in the urls array.' },
      { status: 400 },
    )
  }

  const result = await submitIndexNowUrls(urls)

  return NextResponse.json({
    success: result.ok,
    status: result.status,
    submitted: result.submittedUrls.length,
    keyLocation: INDEXNOW_KEY_LOCATION,
    response: result.body,
  }, { status: result.ok ? 200 : result.status })
}
