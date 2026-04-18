'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { useAgent } from '@/components/providers/agent-provider'
import { useUser } from '@clerk/nextjs'
import { buildWorkflowAutoSendKey } from '@/lib/chat/conversation-bootstrap'
import { getWorkflowLaunchConfig } from '@/lib/workflows/launch-config'
import { useClerkLoadGuard } from '@/hooks/use-clerk-load-guard'

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
      <DashboardInner />
    </Suspense>
  )
}

function DashboardInner() {
  const { state, actions } = useAgent()
  const activeAgentId = state.activeAgent?.id
  const { user, isLoaded } = useUser()
  const { ready: clerkReady, timedOut: clerkTimedOut } = useClerkLoadGuard(isLoaded, 5000)
  const searchParams = useSearchParams()
  const workflowId = searchParams?.get('workflow') ?? undefined
  const explicitConversationId = searchParams?.get('conversationId') ?? undefined

  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialMessage, setInitialMessage] = useState<string | undefined>()
  const [_userName, setUserName] = useState<string>('')
  const workflowLaunch = useMemo(
    () => (workflowId ? getWorkflowLaunchConfig(workflowId) : null),
    [workflowId]
  )
  const resolvedConversationId = explicitConversationId
  const workflowMessage = workflowLaunch?.initialPrompt
  const workflowAutoSendKey = buildWorkflowAutoSendKey(workflowId, resolvedConversationId)

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

  useEffect(() => {
    if (explicitConversationId) {
      return
    }

    if (!state.activeConversation?.id) {
      return
    }

    actions.setActiveConversation(null)
  }, [actions, explicitConversationId, state.activeConversation?.id])

  useEffect(() => {
    if (!explicitConversationId) {
      return
    }

    if (state.activeConversation?.id === explicitConversationId) {
      return
    }

    const matchingConversation = state.conversations.find(
      (conversation) => conversation.id === explicitConversationId
    )

    if (matchingConversation) {
      actions.setActiveConversation(matchingConversation)
    }
  }, [actions, explicitConversationId, state.activeConversation?.id, state.conversations])

  // Build context with onboarding flag
  const context = useMemo(
    () => ({
      page: isNewUser ? 'onboarding' : 'dashboard',
      conversationId: resolvedConversationId,
      isNewUser,
      userMode: 'default',
    }),
    [isNewUser, resolvedConversationId]
  )

  if (!isLoaded || isLoading) {
    if (!clerkReady && !isLoaded) {
      return (
        <div className="relative h-full flex flex-col items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      )
    }

    if (clerkTimedOut && !isLoaded) {
      return (
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
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
      <div className="relative h-full flex flex-col items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  // Dashboard always shows all NextPhase features now

  return (
    <div className="relative flex h-full flex-col bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 min-h-0 px-6 pt-6"
      >
        {/* Chat Interface - Full height */}
        <div className="max-w-7xl mx-auto h-full">
          <AIChatInterface
            context={context}
            placeholder={isNewUser ? "Tell me about your business..." : "Ask anything..."}
            className="h-full"
            conversationId={resolvedConversationId}
            agentId={activeAgentId}
            initialMessage={initialMessage}
            autoSendMessage={workflowMessage}
            autoSendKey={workflowAutoSendKey}
            key={`${resolvedConversationId ?? 'no-conversation'}:${workflowId ?? 'no-workflow'}`}
          />
        </div>
      </motion.div>
    </div>
  )
}
