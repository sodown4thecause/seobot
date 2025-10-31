import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  generateSchemaMarkup,
  createSchemaTemplate,
  getSchemaTemplates,
  getGeneratedSchemas,
  generateImplementationCode,
  generateSchemaFromTemplate
} from '@/lib/schema/schema-markup-service'

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
      case 'generate':
        result = await generateSchemaMarkup(data.request, user.id)
        break

      case 'create_template':
        result = await createSchemaTemplate({
          templateName: data.templateName,
          schemaType: data.schemaType,
          templateContent: data.templateContent,
          isPublic: data.isPublic,
          userId: user.id
        })
        break

      case 'generate_from_template':
        result = await generateSchemaFromTemplate(
          data.templateId,
          data.contentData,
          user.id
        )
        break

      case 'generate_implementation':
        result = await generateImplementationCode(data.schemaId, data.format)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Schema markup API error:', error)
    
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
    const type = searchParams.get('type') // 'templates' or 'schemas'
    const schemaType = searchParams.get('schemaType')
    const limit = parseInt(searchParams.get('limit') || '20')
    const includePublic = searchParams.get('includePublic') === 'true'

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
      case 'templates':
        result = await getSchemaTemplates(
          user.id,
          schemaType as any,
          includePublic
        )
        break

      case 'schemas':
        result = await getGeneratedSchemas(
          user.id,
          schemaType as any,
          limit
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Schema markup fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
