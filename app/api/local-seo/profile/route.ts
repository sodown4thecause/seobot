import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  upsertLocalSEOProfile,
  getLocalSEOProfile,
  generateLocalContentIdeas,
  trackLocalSEOPerformance
} from '@/lib/local-seo/local-seo-service'

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
      case 'upsert_profile':
        result = await upsertLocalSEOProfile({
          userId: user.id,
          businessName: data.businessName,
          businessCategory: data.businessCategory,
          businessAddress: data.businessAddress,
          businessPhone: data.businessPhone,
          businessWebsite: data.businessWebsite,
          businessHours: data.businessHours,
          servicesOffered: data.servicesOffered,
          serviceAreas: data.serviceAreas,
          localKeywords: data.localKeywords,
          metadata: data.metadata
        })
        break

      case 'generate_content_ideas':
        result = await generateLocalContentIdeas({
          businessName: data.businessName,
          businessCategory: data.businessCategory,
          businessAddress: data.businessAddress,
          servicesOffered: data.servicesOffered,
          localKeywords: data.localKeywords
        })
        break

      case 'track_performance':
        result = await trackLocalSEOPerformance({
          businessId: data.businessId,
          dateRange: data.dateRange
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Local SEO API error:', error)
    
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

    const profile = await getLocalSEOProfile(user.id)

    return NextResponse.json({ success: true, data: profile })

  } catch (error) {
    console.error('Local SEO fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
