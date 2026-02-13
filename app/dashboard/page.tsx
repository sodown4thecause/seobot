'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState, useRef } from 'react'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { useAgent } from '@/components/providers/agent-provider'
import { useUserMode } from '@/components/providers/user-mode-provider'
import { useUser } from '@clerk/nextjs'
import { getWorkflowPrompt } from '@/lib/workflows/guided-prompts'
import { useClerkLoadGuard } from '@/hooks/use-clerk-load-guard'


export default function DashboardPage() {
  const { state } = useAgent()
  const { state: userModeState } = useUserMode()
  const activeConversationId = state.activeConversation?.id
  const activeAgentId = state.activeAgent?.id
  const { user, isLoaded } = useUser()
  const { ready: clerkReady, timedOut: clerkTimedOut } = useClerkLoadGuard(isLoaded, 5000)

  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialMessage, setInitialMessage] = useState<string | undefined>()
  const [_userName, setUserName] = useState<string>('')
  const [workflowMessage, setWorkflowMessage] = useState<string | undefined>()

  // Refs to track fetch state and cleanup
  const _abortControllerRef = useRef<AbortController | null>(null)
  const _timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user has a business profile (first-time user detection)
  useEffect(() => {
    // Cleanup function to abort any in-flight requests
    const controller = new AbortController()
    let timeoutId: NodeJS.Timeout | null = null

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

        // Fetch profile with retry logic for cold DB connections
        const fetchWithRetry = async (retries = 3, delay = 2000): Promise<Response> => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              const response = await fetch('/api/user/profile', {
                signal: controller.signal,
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
              })
              return response
            } catch (err) {
              if (attempt === retries || (err instanceof Error && err.name === 'AbortError')) {
                throw err
              }
              console.warn(`[Dashboard] Profile fetch attempt ${attempt} failed, retrying in ${delay}ms...`)
              await new Promise(r => setTimeout(r, delay))
              delay *= 1.5 // Exponential backoff
            }
          }
          throw new Error('Max retries exceeded')
        }

        // Set overall timeout for all retries
        timeoutId = setTimeout(() => {
          controller.abort()
          console.warn('[Dashboard] Profile fetch timeout after 45s')
        }, 45000)

        const response = await fetchWithRetry()

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
          window.location.href = '/sign-in'
        } else {
          // Server error or other issues - show error state
          console.error(`[Dashboard] Profile fetch failed with status ${response.status}`)
          // Show error notification or state instead of onboarding
          setInitialMessage('Failed to load profile. Please refresh or contact support.')
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('[Dashboard] Profile fetch timed out - proceeding with defaults')
          // Don't block the UI - just proceed without profile data
          // User can still use the dashboard
        } else {
          console.error('[Dashboard] Error checking user profile:', error)
          // Don't trigger onboarding on errors - proceed with defaults
        }
      } finally {
        setIsLoading(false)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }

    checkUserProfile()

    // Cleanup function: abort controller and clear timeout on unmount or dependency change
    return () => {
      if (controller) {
        controller.abort()
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [user, isLoaded])

  const _handleWorkflowSelect = (workflowId: string) => {
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
    if (!clerkReady && !isLoaded) {
      return (
        <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      )
    }

    if (clerkTimedOut && !isLoaded) {
      return (
        <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-xl rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Clerk auth is not loading in the browser. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, then restart `npm run dev`.
            <div className="mt-2">
              <a className="underline" href="/sign-in">
                Open sign in
              </a>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  // Dashboard always shows all NextPhase features now

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 px-6 pt-6"
      >
        {/* Chat Interface - Full height */}
        <div className="max-w-7xl mx-auto">
          <AIChatInterface
            context={context}
            placeholder={isNewUser ? "Tell me about your business..." : "Ask anything..."}
            className="h-[calc(100vh-12rem)]"
            conversationId={activeConversationId}
            agentId={activeAgentId}
            initialMessage={initialMessage}
            autoSendMessage={workflowMessage}
            key={workflowMessage}
          />
        </div>
      </motion.div>
    </div>
  )
}
