import { NextRequest, NextResponse } from 'next/server'
import { serverEnv } from '@/lib/config/env'
import { generateText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

export const maxDuration = 300

// Initialize providers
const gateway = serverEnv.AI_GATEWAY_API_KEY
  ? createGateway({
      apiKey: serverEnv.AI_GATEWAY_API_KEY,
      baseURL: serverEnv.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1/ai',
    })
  : null

const google = serverEnv.GOOGLE_API_KEY
  ? createGoogleGenerativeAI({ apiKey: serverEnv.GOOGLE_API_KEY })
  : null

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use Gemini 2.5 Flash Image via Vercel AI Gateway or direct Google
    const model = gateway
      ? gateway('google/gemini-2.5-flash-image')
      : google
        ? google('gemini-2.5-flash-image')
        : null

    if (model) {
      const result = await generateText({
        model,
        providerOptions: {
          google: { responseModalities: ['TEXT', 'IMAGE'] },
        },
        prompt: body.prompt,
      })

      console.log('[Image API] Generation result:', {
        hasFiles: !!result.files,
        fileCount: result.files?.length || 0,
        fileTypes: result.files?.map(f => f.mediaType),
        textLength: result.text?.length || 0,
      })

      // Extract generated images from files
      const generatedImages = result.files?.filter(f => f.mediaType.startsWith('image/')) || []

      if (generatedImages.length > 0) {
        const image = generatedImages[0]
        // AI SDK returns base64 as data URL format already
        const imageUrl = image.base64.startsWith('data:') 
          ? image.base64 
          : `data:${image.mediaType || 'image/png'};base64,${image.base64}`
        
        return NextResponse.json({
          id: `gemini-${Date.now()}`,
          url: imageUrl,
          imageUrl: imageUrl,
          base64: image.base64,
          mediaType: image.mediaType || 'image/png',
          prompt: body.prompt,
          timestamp: Date.now(),
        })
      }

      // Fallback if no images returned but text was generated
      return NextResponse.json(
        { error: 'No image was generated', text: result.text },
        { status: 422 }
      )
    }

    // Fallback to OpenAI DALL-E if no Gemini/Gateway available
    if (!serverEnv.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'No image generation provider configured' },
        { status: 503 }
      )
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverEnv.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: body.prompt,
        n: 1,
        size: body.size === 'large' ? '1792x1024' : '1024x1024',
        quality: 'standard',
        response_format: 'b64_json',
      }),
    })

    if (!openAiResponse.ok) {
      const error = await openAiResponse.json().catch(() => ({}))
      throw new Error(error.error?.message || 'Failed to generate image')
    }

    const data = await openAiResponse.json()
    const imageData = data.data?.[0]

    return NextResponse.json({
      id: `dalle-${Date.now()}`,
      base64: imageData?.b64_json,
      url: `data:image/png;base64,${imageData?.b64_json}`,
      mediaType: 'image/png',
      prompt: body.prompt,
      timestamp: Date.now(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate image'
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
