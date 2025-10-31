'use client'

import { GradientOrb } from '@/components/ui/gradient-orb'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1"
      >
        <AIChatInterface
          context={{ page: 'dashboard' }}
          placeholder="Ask anything..."
          className="h-full"
        />
      </motion.div>
    </div>
  )
}
