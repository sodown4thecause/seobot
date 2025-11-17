import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('tableName')

    if (!tableName) {
      return NextResponse.json(
        { error: 'Missing tableName parameter' },
        { status: 400 }
      )
    }

    // Validate table name (security check)
    const validTables = [
      'seo_aeo_knowledge',
      'content_strategist_knowledge',
      'keyword_researcher_knowledge',
      'competitor_analyst_knowledge',
    ]
    if (!validTables.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    // Fetch documents
    const { data: documents, error } = await supabase
      .from(tableName)
      .select('id, title, file_type, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Admin] List error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
    })
  } catch (error) {
    console.error('[Admin] List error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

