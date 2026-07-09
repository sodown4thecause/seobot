/**
 * Langfuse alert webhook receiver.
 * Point Langfuse alert webhooks to POST /api/webhooks/langfuse
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { appLogger } from '@/lib/observability/app-logger'
import { serverEnv } from '@/lib/config/env'

export const runtime = 'nodejs'

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function POST(req: NextRequest) {
  const configuredSecret = serverEnv.LANGFUSE_WEBHOOK_SECRET
  if (configuredSecret) {
    const provided = req.headers.get('x-langfuse-signature') ?? req.headers.get('authorization')
    const bearerProvided = provided?.startsWith('Bearer ') ? provided.slice(7) : provided
    if (!bearerProvided || (!safeEqual(bearerProvided, configuredSecret) && !safeEqual(provided ?? '', configuredSecret))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const payload = await req.json()
    appLogger.warn('Langfuse alert webhook received', {
      endpoint: '/api/webhooks/langfuse',
      metadata: { payload },
    })
    return NextResponse.json({ received: true })
  } catch (error) {
    appLogger.error('Langfuse webhook parse failed', {
      endpoint: '/api/webhooks/langfuse',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    })
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
