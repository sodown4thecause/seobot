import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/clerk'
import { guidedWorkflowEngine } from '@/lib/proactive'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get('conversationId')

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
        }

        const suggestions = await guidedWorkflowEngine.generateSuggestions({
            userId: user.id,
            conversationId,
        })

        return NextResponse.json(suggestions)
    } catch (error) {
        console.error('[Suggestions API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate suggestions' },
            { status: 500 }
        )
    }
}
