/**
 * Chat Context Preservation
 * Handles preserving context across conversations
 * 
 * TODO: Migrate to Drizzle ORM once chat_contexts table is created
 * Currently uses in-memory storage after Supabase removal
 */

import { requireUserId } from '@/lib/auth/clerk'

export type ContextType = 'workflow' | 'analysis' | 'business' | 'preference'

export interface ChatContext {
  contextKey: string
  contextType: ContextType
  contextData: Record<string, any>
  expiresAt?: Date
  lastAccess: Date
}

// Simple async mutex for concurrency control keyed by user ID
const locks = new Map<string, Promise<void>>()

async function withMutex<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  let unlock: () => void
  
  while (true) {
    const existingLock = locks.get(userId)
    if (!existingLock) {
      break
    }
    await existingLock
  }

  const lockPromise = new Promise<void>(resolve => {
    unlock = resolve
  })
  locks.set(userId, lockPromise)

  try {
    return await fn()
  } finally {
    locks.delete(userId)
    unlock!()
  }
}

// In-memory context storage (temporary until Drizzle migration)
const contextStore = new Map<string, Map<string, ChatContext>>()
const CONTEXT_TTL_MS = 30 * 60 * 1000 // 30 minutes default TTL
const MAX_CONTEXTS_PER_USER = 100 // FIFO eviction limit per user to prevent memory bloat

// Cleanup task to evict stale contexts
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanupTask() {
  if (cleanupInterval) return
  
  cleanupInterval = setInterval(() => {
    const now = new Date()
    contextStore.forEach((userMap, userId) => {
      userMap.forEach((ctx, key) => {
        if (ctx.lastAccess.getTime() < now.getTime() - CONTEXT_TTL_MS) {
          userMap.delete(key)
        }
      })
      // Remove empty user maps
      if (userMap.size === 0) {
        contextStore.delete(userId)
      }
    })
  }, 5 * 60 * 1000) // Run every 5 minutes
}

// Start cleanup on module load
startCleanupTask()

export class ChatContextPreservation {
  private userId: string | null = null

  /**
   * Set user ID for context operations with authentication validation
   * Requires the caller to be authenticated and userId must match authenticated user
   * Throws error if userId is already set (prevents reassignment within same request)
   */
  async setUserId(userId: string): Promise<void> {
    if (this.userId) {
      throw new Error('UserId already set for this request - create a new instance for a different user')
    }

    const authenticatedUserId = await requireUserId()
    
    if (authenticatedUserId !== userId) {
      console.error('[ContextPreservation] Unauthorized userId assignment attempt:', {
        requestedUserId: userId,
        authenticatedUserId,
        timestamp: new Date().toISOString()
      })
      throw new Error('Unauthorized: userId does not match authenticated user')
    }
    
    this.userId = userId
  }

  /**
   * Clear user ID to prevent cross-request leakage
   */
  clearUserId(): void {
    this.userId = null
  }

  /**
   * Get user context for a conversation
   * TODO: Implement with Drizzle
   */
  async getUserContext(contextKeys?: string[]): Promise<Record<string, any>> {
    if (!this.userId) {
      throw new Error('UserId not set - call setUserId with authenticated user first')
    }

    return withMutex(this.userId, async () => {
      const userContexts = contextStore.get(this.userId!)
      if (!userContexts) return {}

      const result: Record<string, any> = {}
      const now = new Date()
      
      if (contextKeys) {
        contextKeys.forEach(key => {
          const ctx = userContexts.get(key)
          if (ctx) {
            ctx.lastAccess = now
            result[key] = ctx.contextData
          }
        })
      } else {
        userContexts.forEach((ctx, key) => {
          ctx.lastAccess = now
          result[key] = ctx.contextData
        })
      }
      return result
    })
  }

  /**
   * Set user context
   * TODO: Implement with Drizzle
   */
  async setUserContext(
    contextKey: string,
    contextType: ContextType,
    contextData: Record<string, any>,
    expiresAt?: Date
  ): Promise<void> {
    if (!this.userId) {
      throw new Error('UserId not set - call setUserId with authenticated user first')
    }

    return withMutex(this.userId, () => {
      if (!contextStore.has(this.userId!)) {
        contextStore.set(this.userId!, new Map())
      }

      const userContexts = contextStore.get(this.userId!)!

      // FIFO eviction: if at capacity, remove the oldest context before adding
      if (userContexts.size >= MAX_CONTEXTS_PER_USER) {
        const oldestKey = userContexts.keys().next().value
        if (oldestKey !== undefined) {
          userContexts.delete(oldestKey)
        }
      }

      userContexts.set(contextKey, {
        contextKey,
        contextType,
        contextData,
        expiresAt,
        lastAccess: new Date(),
      })
      return Promise.resolve()
    })
  }

  /**
   * Clear user context
   * TODO: Implement with Drizzle
   */
  async clearContext(contextKey: string): Promise<void> {
    if (!this.userId) {
      throw new Error('UserId not set - call setUserId with authenticated user first')
    }

    return withMutex(this.userId, () => {
      const userContexts = contextStore.get(this.userId!)
      if (userContexts) {
        userContexts.delete(contextKey)
      }
      return Promise.resolve()
    })
  }

  /**
   * Clear all expired contexts
   * TODO: Implement with Drizzle
   */
  async clearExpiredContexts(): Promise<void> {
    if (!this.userId) {
      throw new Error('UserId not set - call setUserId with authenticated user first')
    }

    return withMutex(this.userId, () => {
      const userContexts = contextStore.get(this.userId!)
      if (!userContexts) return Promise.resolve()

      const now = new Date()
      userContexts.forEach((ctx, key) => {
        if (ctx.expiresAt && ctx.expiresAt < now) {
          userContexts.delete(key)
        }
      })
      return Promise.resolve()
    })
  }
}

// Factory function to create a new request-scoped instance
// This prevents cross-request context leakage and ensures proper authentication
export function createChatContextPreservation(): ChatContextPreservation {
  return new ChatContextPreservation()
}

// Singleton is REMOVED to prevent cross-request context leakage and impersonation risks
// Use createChatContextPreservation() instead for request-scoped instances
// export const chatContextPreservation = new ChatContextPreservation()