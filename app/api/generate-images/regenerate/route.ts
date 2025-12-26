import { NextRequest, NextResponse } from 'next/server'
import { EnhancedImageAgent } from '@/lib/agents/enhanced-image-agent'

export async function POST(request: NextRequest) {
  try {
    const { imageId, imageType, content, topic, keywords } = await request.json()

    if (!imageId || !imageType) {
      return NextResponse.json(
        { error: 'imageId and imageType are required' },
        { status: 400 }
      )
    }

    const imageAgent = new EnhancedImageAgent()
    let regeneratedImage

    switch (imageType) {
      case 'hero':
        regeneratedImage = await imageAgent.generateHeroImage({
          topic: topic || 'Article',
          keywords: keywords || [],
          mood: 'professional',
          aspectRatio: '16:9'
        })
        break
      case 'section':
        regeneratedImage = await imageAgent.generateSectionImage({
          heading: topic || 'Section',
          content: content || '',
          type: 'illustration',
          targetHeading: topic || 'Section',
          keywords: keywords || []
        })
        break
      case 'infographic':
        regeneratedImage = await imageAgent.generateInfographic({
          data: { value: 100, label: topic || 'Data' },
          type: 'bar',
          keywords: keywords || [],
          label: topic || 'Statistic'
        })
        break
      default:
        return NextResponse.json(
          { error: 'Invalid image type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      image: regeneratedImage,
      imageId
    })
  } catch (error) {
    console.error('Error regenerating image:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate image' },
      { status: 500 }
    )
  }
}

