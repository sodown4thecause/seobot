import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTwitterPosts, fetchLinkedInPosts } from '@/lib/api/apify-service'
import { serverEnv } from '@/lib/config/env'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

interface RequestBody {
  platform: 'twitter' | 'linkedin' | 'instagram'
  username?: string
  profileUrl?: string
  maxPosts?: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody
    const { platform, username, profileUrl, maxPosts = 50 } = body
    
    if (!username && !profileUrl) {
      return NextResponse.json(
        { error: 'Username or profile URL is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch posts based on platform
    let postsResult
    
    if (platform === 'twitter' && username) {
      postsResult = await fetchTwitterPosts({ username, maxPosts })
    } else if (platform === 'linkedin' && profileUrl) {
      postsResult = await fetchLinkedInPosts({ profileUrl, maxPosts })
    } else {
      return NextResponse.json(
        { error: 'Unsupported platform or missing credentials' },
        { status: 400 }
      )
    }

    if (!postsResult.success) {
      return NextResponse.json(
        { error: postsResult.error.message },
        { status: postsResult.error.statusCode }
      )
    }

    const posts = postsResult.data
    
    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'No posts found for analysis' },
        { status: 404 }
      )
    }

    // Analyze with Gemini AI
    const genAI = new GoogleGenerativeAI(serverEnv.GOOGLE_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    const postsText = posts.slice(0, 50).map(p => p.text).join('\n\n---\n\n')
    
    const prompt = `Analyze these ${posts.length} social media posts and extract brand voice characteristics:

${postsText}

Provide a JSON response with:
- tone: Overall tone (e.g., "Professional yet approachable", "Casual and friendly", "Technical and authoritative")
- style: Writing style (e.g., "Educational storytelling", "Direct and concise", "Conversational with humor")
- personality: Array of 3-5 personality traits
- samplePhrases: Array of 5-10 distinctive phrases or word choices
- themes: Array of 3-5 recurring themes/topics

Respond with only valid JSON, no markdown.`

    const aiResult = await model.generateContent(prompt)
    const aiText = aiResult.response.text()
    
    // Parse AI response
    let voiceAnalysis: {
      tone: string
      style: string
      personality: string[]
      samplePhrases: string[]
      themes: string[]
    }
    
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      voiceAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : aiText)
    } catch {
      return NextResponse.json(
        { error: 'Failed to analyze brand voice' },
        { status: 500 }
      )
    }

    // Save to database
    await supabase.from('brand_voices').upsert({
      user_id: user.id,
      tone: voiceAnalysis.tone,
      style: voiceAnalysis.style,
      personality: voiceAnalysis.personality,
      sample_phrases: voiceAnalysis.samplePhrases,
      source: 'social_media',
    })

    // Save social connection
    await supabase.from('social_connections').upsert({
      user_id: user.id,
      platform,
      profile_url: profileUrl || `https://${platform}.com/${username}`,
      posts_analyzed: posts.length,
      last_synced_at: new Date().toISOString(),
    })

    return NextResponse.json({
      analysis: voiceAnalysis,
      postsAnalyzed: posts.length,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Brand voice extraction error:', err)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
