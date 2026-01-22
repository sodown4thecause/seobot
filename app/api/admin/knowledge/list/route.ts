import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const _userId = await requireUserId()

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

    // TODO: Implement knowledge tables in schema
    // Tables needed: seo_aeo_knowledge, content_strategist_knowledge,
    // keyword_researcher_knowledge, competitor_analyst_knowledge
    // Each needs: id, user_id, title, file_type, created_at, metadata
    
    // const documents = await db
    //   .select({
    //     id: knowledgeTable.id,
    //     title: knowledgeTable.title,
    //     fileType: knowledgeTable.fileType,
    //     createdAt: knowledgeTable.createdAt,
    //     metadata: knowledgeTable.metadata,
    //   })
    //   .from(knowledgeTable)
    //   .where(eq(knowledgeTable.userId, userId))
    //   .orderBy(desc(knowledgeTable.createdAt))

    return NextResponse.json({
      success: true,
      documents: [],
      message: 'Knowledge listing not yet implemented - tables missing from schema'
    })
  } catch (error) {
    console.error('[Admin] List error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

