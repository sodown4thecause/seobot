'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { useAgent } from '@/components/providers/agent-provider'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const { state } = useAgent()
  const activeConversationId = state.activeConversation?.id
  const activeAgentId = state.activeAgent?.id

  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialMessage, setInitialMessage] = useState<string | undefined>()

  // Check if user has a business profile (first-time user detection)
  useEffect(() => {
    async function checkUserProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        // Check if user has a business profile
        const { data: profile, error } = await supabase
          .from('business_profiles')
          .select('id, website_url, industry')
          .eq('user_id', user.id)
          .single()

        if (error || !profile?.website_url) {
          // First-time user - trigger onboarding
          setIsNewUser(true)
        }
      } catch (error) {
        console.error('[Dashboard] Error checking user profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserProfile()
  }, [])

  // Build context with onboarding flag
  const context = useMemo(
    () => ({
      page: isNewUser ? 'onboarding' : 'dashboard',
      conversationId: activeConversationId,
      isNewUser,
    }),
    [activeConversationId, isNewUser]
  )

  if (isLoading) {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-[#1a1a1a]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-[#1a1a1a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 px-6 pt-6"
      >
        <AIChatInterface
          context={context}
          placeholder={isNewUser ? "Tell me about your business..." : "Ask anything..."}
          className="h-full"
          conversationId={activeConversationId}
          agentId={activeAgentId}
          initialMessage={initialMessage}
        />
      </motion.div>
    </div>
  )
}
