import { NextRequest, NextResponse } from 'next/server'
import { serverEnv } from '@/lib/config/env'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use DALL-E 3 for image generation
    const response = await fetch('https://api.openai.com/v1/images/generations', {
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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate image')
    }

    const data = await response.json()
    const imageData = data.data[0]

    return NextResponse.json({
      id: `dalle-${Date.now()}`,
      data: imageData.b64_json,
      mediaType: 'image/png',
      prompt: body.prompt,
      timestamp: Date.now(),
    })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
