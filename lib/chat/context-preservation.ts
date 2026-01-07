/**
 * Chat Context Preservation
 * Handles preserving context across conversations
 * 
 * TODO: Migrate to Drizzle ORM once chat_contexts table is created
 * Currently uses in-memory storage after Supabase removal
 */

export type ContextType = 'workflow' | 'analysis' | 'business' | 'preference'

export interface ChatContext {
  contextKey: string
  contextType: ContextType
  contextData: Record<string, any>
  expiresAt?: Date
}

// In-memory context storage (temporary until Drizzle migration)
const contextStore = new Map<string, Map<string, ChatContext>>()

export class ChatContextPreservation {
  private userId: string | null = null

  /**
   * Set user ID for context operations
   */
  setUserId(userId: string) {
    this.userId = userId
  }

  /**
   * Get user context for a conversation
   * TODO: Implement with Drizzle
   */
  async getUserContext(contextKeys?: string[]): Promise<Record<string, any>> {
    if (!this.userId) return {}

    const userContexts = contextStore.get(this.userId)
    if (!userContexts) return {}

    const result: Record<string, any> = {}
    if (contextKeys) {
      contextKeys.forEach(key => {
        const ctx = userContexts.get(key)
        if (ctx) result[key] = ctx.contextData
      })
    } else {
      userContexts.forEach((ctx, key) => {
        result[key] = ctx.contextData
      })
    }
    return result
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
    if (!this.userId) throw new Error('User not authenticated')

    if (!contextStore.has(this.userId)) {
      contextStore.set(this.userId, new Map())
    }
    contextStore.get(this.userId)!.set(contextKey, {
      contextKey,
      contextType,
      contextData,
      expiresAt,
    })
  }

  /**
   * Clear user context
   * TODO: Implement with Drizzle
   */
  async clearContext(contextKey: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const userContexts = contextStore.get(this.userId)
    if (userContexts) {
      userContexts.delete(contextKey)
    }
  }

  /**
   * Clear all expired contexts
   * TODO: Implement with Drizzle
   */
  async clearExpiredContexts(): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated')

    const userContexts = contextStore.get(this.userId)
    if (!userContexts) return

    const now = new Date()
    userContexts.forEach((ctx, key) => {
      if (ctx.expiresAt && ctx.expiresAt < now) {
        userContexts.delete(key)
      }
    })
  }
}

export const chatContextPreservation = new ChatContextPreservation()

