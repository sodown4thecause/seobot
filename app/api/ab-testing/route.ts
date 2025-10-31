import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createABTest,
  startABTest,
  getUserABTests,
  calculateABTestInsights,
  recordImpression,
  recordClick,
  getVariantForUser
} from '@/lib/ab-testing/ab-testing-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    let result

    switch (action) {
      case 'create':
        result = await createABTest({
          name: data.name,
          description: data.description,
          contentId: data.contentId,
          type: data.type,
          originalContent: data.originalContent,
          userId: user.id
        })
        break

      case 'start':
        result = await startABTest(data.testId, user.id)
        break

      case 'record_impression':
        await recordImpression(
          data.testId,
          data.variantId,
          request.headers.get('user-agent'),
          request.ip
        )
        result = { success: true }
        break

      case 'record_click':
        await recordClick(
          data.testId,
          data.variantId,
          request.headers.get('user-agent'),
          request.ip
        )
        result = { success: true }
        break

      case 'get_variant':
        result = await getVariantForUser(
          data.testId,
          user.id,
          data.sessionId
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('A/B testing API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const limit = parseInt(searchParams.get('limit') || '20')

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const tests = await getUserABTests(user.id, status, limit)

    return NextResponse.json({ success: true, data: tests })

  } catch (error) {
    console.error('A/B testing fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
