import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/clerk'
import { guidedWorkflowEngine } from '@/lib/proactive'
import { getConversationForUser } from '@/lib/chat/storage'
import { logError } from '@/lib/errors/logger'

// In-memory cache for conversation lookups to reduce redundant DB calls
interface CacheEntry {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
    expiresAt: number
}

const conversationCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 1000 // 1 minute

function getCacheKey(userId: string, conversationId: string): string {
    return `${userId}:${conversationId}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCachedConversation(userId: string, conversationId: string): any | null {
    const key = getCacheKey(userId, conversationId)
    const entry = conversationCache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
        conversationCache.delete(key)
        return null
    }
    
    return entry.data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setCachedConversation(userId: string, conversationId: string, data: any): void {
    const key = getCacheKey(userId, conversationId)
    conversationCache.set(key, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS
    })
    
    // Cleanup expired entries periodically (simple approach)
    if (conversationCache.size > 100) {
        const now = Date.now()
        for (const [k, entry] of conversationCache.entries()) {
            if (now > entry.expiresAt) {
                conversationCache.delete(k)
            }
        }
    }
}

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

        // Check cache first
        let conversation = getCachedConversation(userId, conversationId)
        
        if (!conversation) {
            // Cache miss - fetch from storage
            conversation = await getConversationForUser(userId, conversationId)
            
            if (conversation) {
                // Store in cache for future requests
                setCachedConversation(userId, conversationId, conversation)
            }
        }
        
        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        const suggestions = await guidedWorkflowEngine.generateSuggestions({
            userId,
            conversationId,
        })

        return NextResponse.json(suggestions)
    } catch (error) {
        await logError(error, {
            endpoint: '/api/suggestions',
            ...(userId ? { userId } : {})
        })
        return NextResponse.json(
            { error: 'Failed to generate suggestions' },
            { status: 500 }
        )
    }
}
