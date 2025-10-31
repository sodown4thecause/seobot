import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createCompetitorAlert,
  getCompetitorAlerts,
  getAlertEvents,
  monitorCompetitors,
  sendAlertNotifications,
  generateCompetitorInsights,
  updateAlertEventStatus,
  deleteCompetitorAlert
} from '@/lib/competitor/competitor-alerts-service'

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
      case 'create_alert':
        result = await createCompetitorAlert({
          userId: user.id,
          alertName: data.alertName,
          competitorDomains: data.competitorDomains,
          targetKeywords: data.targetKeywords,
          alertTypes: data.alertTypes,
          notificationChannels: data.notificationChannels,
          alertFrequency: data.alertFrequency,
          alertConditions: data.alertConditions
        })
        break

      case 'monitor_competitors':
        result = await monitorCompetitors(user.id)
        break

      case 'send_notifications':
        result = await sendAlertNotifications(data.events)
        break

      case 'generate_insights':
        result = await generateCompetitorInsights({
          competitorDomain: data.competitorDomain,
          targetKeywords: data.targetKeywords,
          timeRange: data.timeRange
        })
        break

      case 'update_event_status':
        result = await updateAlertEventStatus(data.eventId, data.status)
        break

      case 'delete_alert':
        result = await deleteCompetitorAlert(data.alertId, user.id)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Competitor alerts API error:', error)
    
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
    const type = searchParams.get('type') // 'alerts' or 'events'
    const alertId = searchParams.get('alertId')
    const limit = parseInt(searchParams.get('limit') || '50')

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
      case 'alerts':
        result = await getCompetitorAlerts(user.id)
        break

      case 'events':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }
        result = await getAlertEvents(alertId, limit)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Competitor alerts fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
