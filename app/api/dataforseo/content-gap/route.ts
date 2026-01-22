import { NextRequest, NextResponse } from 'next/server'
import { 
  performContentGapAnalysis, 
  getContentGapSummary,
} from '@/lib/services/dataforseo/content-gap-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      targetDomain, 
      competitorDomains, 
      limit = 100,
      includeContentAnalysis = true,
      summaryOnly = false
    } = body

    // Validation
    if (!targetDomain || typeof targetDomain !== 'string') {
      return NextResponse.json(
        { error: 'Target domain is required and must be a string' },
        { status: 400 }
      )
    }

    if (!competitorDomains || !Array.isArray(competitorDomains) || competitorDomains.length === 0) {
      return NextResponse.json(
        { error: 'Competitor domains are required and must be a non-empty array' },
        { status: 400 }
      )
    }

    if (competitorDomains.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 competitor domains allowed' },
        { status: 400 }
      )
    }

    // Validate domain formats
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
    if (!domainRegex.test(targetDomain)) {
      return NextResponse.json(
        { error: 'Invalid target domain format' },
        { status: 400 }
      )
    }

    for (const domain of competitorDomains) {
      if (typeof domain !== 'string' || !domainRegex.test(domain)) {
        return NextResponse.json(
          { error: `Invalid competitor domain format: ${domain}` },
          { status: 400 }
        )
      }
    }

    // Perform content gap analysis
    const analysis = await performContentGapAnalysis(
      targetDomain,
      competitorDomains,
      {
        limit,
        includeContentAnalysis
      }
    )

    // Return summary or full analysis based on request
    if (summaryOnly) {
      const summary = getContentGapSummary(analysis)
      return NextResponse.json({
        success: true,
        data: summary
      })
    }

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Content gap analysis error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('No relevant pages data received')) {
        return NextResponse.json(
          { error: 'No data available for the specified domains' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('Failed to analyze relevant pages')) {
        return NextResponse.json(
          { error: 'Failed to fetch data from DataForSEO API' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during content gap analysis' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetDomain = searchParams.get('target')
  const competitorDomains = searchParams.get('competitors')?.split(',') || []
  const summaryOnly = searchParams.get('summary') === 'true'

  if (!targetDomain) {
    return NextResponse.json(
      { error: 'Target domain parameter is required' },
      { status: 400 }
    )
  }

  if (competitorDomains.length === 0) {
    return NextResponse.json(
      { error: 'At least one competitor domain is required' },
      { status: 400 }
    )
  }

  try {
    const analysis = await performContentGapAnalysis(
      targetDomain,
      competitorDomains,
      { limit: 50 } // Smaller limit for GET requests
    )

    if (summaryOnly) {
      const summary = getContentGapSummary(analysis)
      return NextResponse.json({
        success: true,
        data: summary
      })
    }

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Content gap analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to perform content gap analysis' },
      { status: 500 }
    )
  }
}