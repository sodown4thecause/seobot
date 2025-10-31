import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractCleanText } from '@/lib/api/jina-service'
import { serverEnv } from '@/lib/config/env'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'edge'

interface AnalysisResult {
  url: string
  title: string
  description: string
  industry: string
  businessType: string
  targetAudience: string[]
  mainTopics: string[]
  contentQuality: {
    score: number
    strengths: string[]
    improvements: string[]
  }
  technicalSeo: {
    hasSitemap: boolean
    hasRobotsTxt: boolean
    isResponsive: boolean
    loadSpeed: string
  }
}

interface RequestBody {
  url: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody
    const { url } = body
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Jina service to extract content
    const extractionResult = await extractCleanText(url)
    
    if (!extractionResult.success) {
      return NextResponse.json(
        { error: extractionResult.error.message },
        { status: extractionResult.error.statusCode }
      )
    }

    const content = extractionResult.data.content

    // Analyze with Gemini
    const analysis = await analyzeWithGemini(content, url)

    // Save to database
    await supabase.from('business_profiles').upsert({
      user_id: user.id,
      website_url: url,
      industry: analysis.industry,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(analysis)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Website analysis error:', err)
    return NextResponse.json(
      { error: err.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}

async function analyzeWithGemini(content: string, url: string): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(serverEnv.GOOGLE_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `Analyze this website content and provide a structured analysis in JSON format.

Website URL: ${url}

Content:
${content.slice(0, 10000)} // Limit content length

Please analyze and return JSON with this exact structure:
{
  "url": "${url}",
  "title": "Company/Website Name",
  "description": "Brief description of what the business does",
  "industry": "Primary industry (e.g., E-commerce, SaaS, Healthcare, etc.)",
  "businessType": "Type (e.g., B2B, B2C, B2B2C)",
  "targetAudience": ["audience segment 1", "audience segment 2"],
  "mainTopics": ["main topic 1", "main topic 2", "main topic 3"],
  "contentQuality": {
    "score": 85,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
  },
  "technicalSeo": {
    "hasSitemap": true,
    "hasRobotsTxt": true,
    "isResponsive": true,
    "loadSpeed": "Good"
  }
}

Focus on SEO and content marketing analysis. Return only valid JSON.`

  const result = await model.generateContent(prompt)
  const response = result.response.text()
  
  // Extract JSON from response (remove markdown code blocks if present)
  let jsonStr = response.trim()
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '')
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '')
  }
  
  return JSON.parse(jsonStr)
}
