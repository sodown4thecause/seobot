import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  upsertWhiteLabelSettings,
  getWhiteLabelSettings,
  createClientPortal,
  getClientPortals,
  generateWhiteLabelCSS,
  generateEmailTemplate,
  validateCustomDomain,
  getWhiteLabelAnalytics
} from '@/lib/white-label/white-label-service'

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
      case 'upsert_settings':
        result = await upsertWhiteLabelSettings(user.id, data.settings)
        break

      case 'create_portal':
        result = await createClientPortal({
          whiteLabelId: data.whiteLabelId,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          subdomain: data.subdomain,
          settings: data.settings
        })
        break

      case 'generate_css':
        const settings = await getWhiteLabelSettings(user.id, data.teamId)
        if (!settings) {
          return NextResponse.json(
            { error: 'White-label settings not found' },
            { status: 404 }
          )
        }
        result = generateWhiteLabelCSS(settings)
        break

      case 'generate_email_template':
        const templateSettings = await getWhiteLabelSettings(user.id, data.teamId)
        if (!templateSettings) {
          return NextResponse.json(
            { error: 'White-label settings not found' },
            { status: 404 }
          )
        }
        result = await generateEmailTemplate(data.templateType, templateSettings)
        break

      case 'validate_domain':
        result = await validateCustomDomain(data.domain)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('White-label API error:', error)
    
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
    const teamId = searchParams.get('teamId')
    const whiteLabelId = searchParams.get('whiteLabelId')
    const type = searchParams.get('type') // 'settings', 'portals', 'analytics', 'css'

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

    switch (type) {
      case 'settings':
        result = await getWhiteLabelSettings(user.id, teamId || undefined)
        break

      case 'portals':
        if (!whiteLabelId) {
          return NextResponse.json(
            { error: 'White-label ID required for portals' },
            { status: 400 }
          )
        }
        result = await getClientPortals(whiteLabelId)
        break

      case 'analytics':
        if (!whiteLabelId) {
          return NextResponse.json(
            { error: 'White-label ID required for analytics' },
            { status: 400 }
          )
        }
        const dateRange = {
          start: searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: searchParams.get('end') || new Date().toISOString()
        }
        result = await getWhiteLabelAnalytics(whiteLabelId, dateRange)
        break

      case 'css':
        const cssSettings = await getWhiteLabelSettings(user.id, teamId || undefined)
        if (!cssSettings) {
          return NextResponse.json(
            { error: 'White-label settings not found' },
            { status: 404 }
          )
        }
        result = generateWhiteLabelCSS(cssSettings)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('White-label fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
