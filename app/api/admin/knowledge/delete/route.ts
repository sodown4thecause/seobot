import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, tableName } = await request.json()

    if (!documentId || !tableName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Delete document (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[Admin] Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[Admin] Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

