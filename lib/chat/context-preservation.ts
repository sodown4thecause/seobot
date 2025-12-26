/**
 * Chat Context Preservation
 * Handles preserving context across conversations
 */

import { createClient } from '@/lib/supabase/client'

export type ContextType = 'workflow' | 'analysis' | 'business' | 'preference'

export interface ChatContext {
  contextKey: string
  contextType: ContextType
  contextData: Record<string, any>
  expiresAt?: Date
}

export class ChatContextPreservation {
  private supabase = createClient()

  /**
   * Get user context for a conversation
   */
  async getUserContext(contextKeys?: string[]): Promise<Record<string, any>> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return {}

    const { data, error } = await this.supabase.rpc('get_user_chat_context', {
      p_user_id: user.id,
      p_context_keys: contextKeys || null
    })

    if (error) {
      console.error('Failed to get user context:', error)
      return {}
    }

    return data || {}
  }

  /**
   * Set user context
   */
  async setUserContext(
    contextKey: string,
    contextType: ContextType,
    contextData: Record<string, any>,
    expiresAt?: Date
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase.rpc('set_user_chat_context', {
      p_user_id: user.id,
      p_context_key: contextKey,
      p_context_type: contextType,
      p_context_data: contextData,
      p_expires_at: expiresAt?.toISOString() || null
    })

    if (error) {
      throw new Error(`Failed to set context: ${error.message}`)
    }
  }

  /**
   * Clear user context
   */
  async clearContext(contextKey: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('chat_contexts')
      .delete()
      .eq('user_id', user.id)
      .eq('context_key', contextKey)

    if (error) {
      throw new Error(`Failed to clear context: ${error.message}`)
    }
  }

  /**
   * Clear all expired contexts
   */
  async clearExpiredContexts(): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('chat_contexts')
      .delete()
      .eq('user_id', user.id)
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Failed to clear expired contexts:', error)
    }
  }
}

export const chatContextPreservation = new ChatContextPreservation()

