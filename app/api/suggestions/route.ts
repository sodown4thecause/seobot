import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/clerk'
import { guidedWorkflowEngine } from '@/lib/proactive'
import { getConversationForUser } from '@/lib/chat/storage'
import { logError } from '@/lib/errors/logger'

export async function GET(request: NextRequest) {
    let userId: string | null = null

    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        userId = user.id

        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get('conversationId')

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
        }

        const conversation = await getConversationForUser(userId, conversationId)
        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        const suggestions = await guidedWorkflowEngine.generateSuggestions({
            userId,
            conversationId,
        })

        return NextResponse.json(suggestions)
    } catch (error) {
        await logError(error, { endpoint: '/api/suggestions', userId: userId || undefined })
        return NextResponse.json(
            { error: 'Failed to generate suggestions' },
            { status: 500 }
        )
    }
}
