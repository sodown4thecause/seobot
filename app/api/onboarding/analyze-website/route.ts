import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractCleanText } from '@/lib/api/jina-service'
import { serverEnv } from '@/lib/config/env'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

interface RequestBody {
  websiteUrl: string
}

interface AnalysisResult {
  industry: string
  pages: number
  blogPosts: number
  topics: string[]
  domain: string
  description?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody
    const { websiteUrl } = body
    
    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract content using Jina
    const extractionResult = await extractCleanText(websiteUrl)
    
    if (!extractionResult.success) {
      return NextResponse.json(
        { error: extractionResult.error.message },
        { status: extractionResult.error.statusCode || 500 }
      )
    }

    const { data: extraction } = extractionResult
    
    // Analyze with Gemini AI
    const genAI = new GoogleGenerativeAI(serverEnv.GOOGLE_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    const prompt = `Analyze this website content and provide structured insights:

URL: ${websiteUrl}
Title: ${extraction.title}
Content preview: ${extraction.content.slice(0, 3000)}

Provide a JSON response with:
- industry: Primary industry/vertical (e.g., "E-commerce - Fashion", "SaaS - Marketing", "Healthcare")
- description: Brief 1-sentence description of what the business does
- topics: Array of 3-5 main topics/themes
- estimatedPages: Rough estimate of total pages (number)
- hasBlog: Boolean if they have a blog

Respond with only valid JSON, no markdown.`

    const aiResult = await model.generateContent(prompt)
    const aiText = aiResult.response.text()
    
    // Parse AI response
    let aiAnalysis: {
      industry: string
      description: string
      topics: string[]
      estimatedPages: number
      hasBlog: boolean
    }
    
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      aiAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : aiText)
    } catch {
      // Fallback if AI doesn't return valid JSON
      aiAnalysis = {
        industry: 'General',
        description: extraction.description || 'Business website',
        topics: extraction.title ? [extraction.title] : ['General'],
        estimatedPages: 10,
        hasBlog: extraction.links.some(link => 
          link.href.includes('blog') || link.href.includes('article')
        ),
      }
    }
    
    const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    
    const analysis: AnalysisResult = {
      industry: aiAnalysis.industry,
      pages: aiAnalysis.estimatedPages,
      blogPosts: aiAnalysis.hasBlog ? 5 : 0,
      topics: aiAnalysis.topics,
      domain,
      description: aiAnalysis.description,
    }

    // Save to database
    await supabase.from('business_profiles').upsert({
      user_id: user.id,
      website_url: websiteUrl,
      industry: analysis.industry,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(analysis)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Website analysis error:', err)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

