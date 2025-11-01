import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  generateImageSuggestions,
  generateImageWithOpenAI,
  generateImageVariations,
  ImageGenerationOptions,
  generateImageWithGemini,
  editImageWithGemini,
  generateImageVariationsWithGemini,
  type GeminiImageRequest
} from '@/lib/ai/image-generation'

// Initialize Supabase client
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
      case 'suggestions':
        const { title, content, targetKeyword } = data
        result = await generateImageSuggestions(title, content, targetKeyword)
        break

      case 'generate':
        const options: ImageGenerationOptions = data
        result = await generateImageWithOpenAI(options)

        // Store generated images in database for user
        if (Array.isArray(result) && result.length > 0) {
          const { error: dbError } = await supabase
            .from('generated_images')
            .insert(
              result.map(image => ({
                user_id: user.id,
                image_url: image.url,
                alt_text: image.altText,
                caption: image.caption,
                metadata: image.metadata,
                created_at: new Date().toISOString()
              }))
            )

          if (dbError) {
            console.error('Failed to store images in database:', dbError)
            // Don't fail the request, just log the error
          }
        }
        break

      case 'variations':
        const { prompt, articleContext } = data
        result = await generateImageVariations(prompt, articleContext)
        break

      // Gemini 2.5 Flash Actions
      case 'generate-gemini':
        const geminiRequest: GeminiImageRequest = data
        result = await generateImageWithGemini(geminiRequest)
        break

      case 'edit-gemini':
        const { imageUrl, editPrompt } = data
        result = await editImageWithGemini(imageUrl, editPrompt)
        break

      case 'variations-gemini':
        const { basePrompt, styles } = data
        result = await generateImageVariationsWithGemini(basePrompt, styles)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Image generation API error:', error)
    
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

    // Get user's generated images
    const { data: images, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch user images:', error)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: images })

  } catch (error) {
    console.error('Image fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { imageId } = await request.json()

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

    // Delete image from database
    const { error } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete image:', error)
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Image deletion API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
