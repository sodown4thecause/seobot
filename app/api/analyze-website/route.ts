import { requireUserId } from '@/lib/auth/clerk'
import { db, businessProfiles } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { extractCleanText } from '@/lib/api/jina-service'
// import { serverEnv } from '@/lib/config/env'
// import { GoogleGenerativeAI } from '@google/generative-ai' // Removed, using gateway
// import { z } from 'zod'

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

    const userId = await requireUserId()

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

    // Upsert to database
    await db
      .insert(businessProfiles)
      .values({
        userId,
        websiteUrl: url,
        industry: analysis.industry,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [businessProfiles.userId],
        set: {
          websiteUrl: sql`excluded.website_url`,
          industry: sql`excluded.industry`,
          updatedAt: new Date(),
        }
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

import { generateText } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'

async function analyzeWithGemini(content: string, url: string): Promise<AnalysisResult> {
  // Use Vercel Gateway for analysis
  const prompt = `Analyze this website content and provide a structured analysis in JSON format.
  
  URL: ${url}
  
  Content:
  ${content.slice(0, 20000)}...
  
  Return the following structure:
  {
    "healthScore": number (0-100),
    "technicalHealth": number (0-100),
    "contentQuality": number (0-100),
    "backlinkProfile": number (0-100),
    "mobileOptimization": number (0-100),
    "userExperience": number (0-100),
    "keywordRankings": number (0-100),
    "issues": [
      {
        "type": "critical" | "warning" | "info",
        "category": "seo" | "performance" | "accessibility" | "content",
        "message": string,
        "impact": "high" | "medium" | "low"
      }
    ],
    "opportunities": [
      {
        "title": string,
        "description": string,
        "potentialImpact": "high" | "medium" | "low",
        "difficulty": "hard" | "medium" | "easy"
      }
    ]
  }
  
  Ensure the JSON is valid and parseable.`

  try {
    const { text } = await generateText({
      model: vercelGateway.languageModel('google/gemini-2.0-pro-exp-02-05'), // Use standard model ID supported by gateway/provider
      prompt: prompt,
      system: 'You are an expert SEO analyst. Output ONLY valid JSON.',
    })
    
    // Parse the JSON response (handle markdown code blocks if present)
    const cleanText = text.replace(/```json\n|\n```/g, '').replace(/```/g, '')
    return JSON.parse(cleanText)
  } catch (error) {
    console.error('Gemini Analysis Error:', error)
    // Return default error result or rethrow
    throw error
  }
}
