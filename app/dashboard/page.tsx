'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { useAgent } from '@/components/providers/agent-provider'
import { useUserMode } from '@/components/providers/user-mode-provider'
import { useUser } from '@clerk/nextjs'
import { WelcomeSection } from '@/components/dashboard/welcome-section'
import { QuickStartGrid } from '@/components/dashboard/quick-start-grid'
import { getWorkflowPrompt } from '@/lib/workflows/guided-prompts'

export default function DashboardPage() {
  const { state } = useAgent()
  const { state: userModeState } = useUserMode()
  const activeConversationId = state.activeConversation?.id
  const activeAgentId = state.activeAgent?.id
  const { user, isLoaded } = useUser()

  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialMessage, setInitialMessage] = useState<string | undefined>()
  const [userName, setUserName] = useState<string>('')
  const [workflowMessage, setWorkflowMessage] = useState<string | undefined>()

  // Check if user has a business profile (first-time user detection)
  useEffect(() => {
    async function checkUserProfile() {
      try {
        // Wait for Clerk to load user data
        if (!isLoaded) {
          return
        }

        if (!user) {
          setIsLoading(false)
          return
        }

        // Get user name from Clerk
        const fullName = user.fullName || user.firstName || ''
        if (fullName) {
          setUserName(fullName)
        } else if (user.emailAddresses?.[0]?.emailAddress) {
          setUserName(user.emailAddresses[0].emailAddress.split('@')[0])
        }

        // Check if user has a business profile using API route (Drizzle runs server-side)
        const response = await fetch('/api/user/profile')
        
        if (response.ok) {
          const data = await response.json()
          if (!data.profile?.websiteUrl) {
            // Profile exists but incomplete - trigger onboarding
            setIsNewUser(true)
            setInitialMessage('__START_ONBOARDING__')
          }
        } else if (response.status === 404) {
          // New user - no profile exists
          setIsNewUser(true)
          setInitialMessage('__START_ONBOARDING__')
        } else if (response.status === 401) {
          // Unauthorized - redirect to sign-in
          window.location.href = '/auth/sign-in'
        } else {
          // Server error or other issues - show error state
          console.error(`[Dashboard] Profile fetch failed with status ${response.status}`)
          // Show error notification or state instead of onboarding
          setInitialMessage('Failed to load profile. Please refresh or contact support.')
        }
      } catch (error) {
        console.error('[Dashboard] Error checking user profile:', error)
        // Don't trigger onboarding on errors
      } finally {
        setIsLoading(false)
      }
    }

    checkUserProfile()
  }, [user, isLoaded])

  const handleWorkflowSelect = (workflowId: string) => {
    const workflow = getWorkflowPrompt(workflowId)
    if (workflow) {
      // Set the workflow message which will be picked up by the chat
      setWorkflowMessage(workflow.initialPrompt)
      // Scroll to chat
      setTimeout(() => {
        const chatElement = document.getElementById('dashboard-chat-section')
        if (chatElement) {
          chatElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }



  // Build context with onboarding flag
  const context = useMemo(
    () => ({
      page: isNewUser ? 'onboarding' : 'dashboard',
      conversationId: activeConversationId,
      isNewUser,
      userMode: userModeState.currentMode?.level || 'beginner',
    }),
    [activeConversationId, isNewUser, userModeState.currentMode?.level]
  )

  if (!isLoaded || isLoading || userModeState.isLoading) {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-[#1a1a1a]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  // Dashboard always shows all NextPhase features now

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-[#1a1a1a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 px-6 pt-6"
      >
        {/* Action-Oriented Dashboard - Always Visible */}
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <WelcomeSection userName={userName} />

          {/* Quick Start Grid */}
          <QuickStartGrid onWorkflowSelect={handleWorkflowSelect} />

          {/* Chat Interface - Always visible below dashboard */}
          <div id="dashboard-chat-section" className="mt-8 scroll-mt-8">
            <AIChatInterface
              context={context}
              placeholder={isNewUser ? "Tell me about your business..." : "Ask anything..."}
              className="h-[500px]"
              conversationId={activeConversationId}
              agentId={activeAgentId}
              initialMessage={initialMessage}
              autoSendMessage={workflowMessage}
              key={workflowMessage}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
