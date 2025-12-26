import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * AI Search Volume endpoint - placeholder
 * TODO: Implement DataForSEO AI search volume integration
 */
export async function POST() {
    return NextResponse.json(
        { error: 'Not implemented' },
        { status: 501 }
    )
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    )
}
