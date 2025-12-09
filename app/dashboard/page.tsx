'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { useAgent } from '@/components/providers/agent-provider'

export default function DashboardPage() {
  const { state } = useAgent()
  const activeConversationId = state.activeConversation?.id
  const activeAgentId = state.activeAgent?.id

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-[#1a1a1a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 px-6 pt-6"
      >
        <AIChatInterface
          context={useMemo(
            () => ({
              page: 'dashboard',
              conversationId: activeConversationId,
            }),
            [activeConversationId]
          )}
          placeholder="Ask anything..."
          className="h-full"
          conversationId={activeConversationId}
          agentId={activeAgentId}
        />
      </motion.div>
    </div>
  )
}
