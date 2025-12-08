'use client'

import { motion } from 'framer-motion'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { useAgent } from '@/components/providers/agent-provider'

export default function DashboardPage() {
  const { state } = useAgent()
  const activeConversationId = state.activeConversation?.id
  const activeAgentId = state.activeAgent?.id

  // Create a stable key that changes when conversation or agent changes
  // This forces AIChatInterface to remount with fresh state
  const chatKey = `chat-${activeConversationId ?? 'new'}-${activeAgentId ?? 'general'}`

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-[#1a1a1a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 px-6 pt-6"
      >
        <AIChatInterface
          key={chatKey}
          context={{ page: 'dashboard', conversationId: activeConversationId }}
          placeholder="Ask anything..."
          className="h-full"
          conversationId={activeConversationId}
          agentId={activeAgentId}
        />
      </motion.div>
    </div>
  )
}
