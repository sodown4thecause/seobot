'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { useAgent } from '@/components/providers/agent-provider'
import { useUserMode } from '@/components/providers/user-mode-provider'
import { ModeSelectionDialog } from '@/components/user-mode/mode-selection-dialog'
import { createClient } from '@/lib/supabase/client'
import { WelcomeSection } from '@/components/dashboard/welcome-section'
import { QuickStartGrid } from '@/components/dashboard/quick-start-grid'
import { ProgressWidgets } from '@/components/dashboard/progress-widgets'
import { PendingActions } from '@/components/dashboard/pending-actions'
import { AIInsightsCard } from '@/components/dashboard/ai-insights-card'
import { ActionGenerator } from '@/lib/actions/action-generator'
import type { ActionItem } from '@/types/actions'

export default function DashboardPage() {
  const { state } = useAgent()
  const { state: userModeState } = useUserMode()
  const activeConversationId = state.activeConversation?.id
  const activeAgentId = state.activeAgent?.id

  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialMessage, setInitialMessage] = useState<string | undefined>()
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [pendingActions, setPendingActions] = useState<ActionItem[]>([])
  const [nextAction, setNextAction] = useState<ActionItem | undefined>()
  const [userName, setUserName] = useState<string>('')

  // Check if user has a business profile (first-time user detection)
  useEffect(() => {
    async function checkUserProfile() {
      try {
        const supabase = createClient()

        // Get user from Supabase auth
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        // Get user name from metadata
        const fullName = (user as any).fullName || user.user_metadata?.full_name
        if (fullName) {
          setUserName(fullName)
        } else if (user.email) {
          setUserName(user.email.split('@')[0])
        }

        // Check if user has a business profile
        const { data: profile, error } = await supabase
          .from('business_profiles')
          .select('id, website_url, industry')
          .eq('user_id', user.id)
          .single()

        // Only treat as new user if profile doesn't exist (PGRST116 error code)
        // or if profile exists but has no website_url
        if (error) {
          // PGRST116 = "not found" - this is expected for new users
          if (error.code === 'PGRST116') {
            setIsNewUser(true)
            setInitialMessage('__START_ONBOARDING__')
            // Show mode selection for new users after a brief delay
            setTimeout(() => {
              setShowModeSelection(true)
            }, 1000)
          } else {
            // Real error - log it but don't trigger onboarding
            console.error('[Dashboard] Database error loading profile:', error)
          }
        } else if (!profile?.website_url) {
          // Profile exists but incomplete - trigger onboarding
          setIsNewUser(true)
          setInitialMessage('__START_ONBOARDING__')
          setTimeout(() => {
            setShowModeSelection(true)
          }, 1000)
        } else {
          // Load actions for existing users
          await loadActions()
        }
      } catch (error) {
        console.error('[Dashboard] Unexpected error checking user profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserProfile()
  }, [])

  const loadActions = async () => {
    try {
      // Mock action generation - in production, this would use real analysis context
      const actionGenerator = new ActionGenerator()
      const mockContext = {
        keywords: { current: [], opportunities: [], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: { issues: [], scores: { pageSpeed: 75, coreWebVitals: 80 } },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' as const }
      }

      const config = {
        userMode: userModeState.currentMode?.level || 'beginner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'medium' as const,
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(mockContext, config)
      setPendingActions(result.actions)
      setNextAction(result.recommendations.startWith[0])
    } catch (error) {
      console.error('[Dashboard] Failed to load actions:', error)
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

  if (isLoading || userModeState.isLoading) {
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
          {/* Welcome Section with Next Action */}
          <WelcomeSection nextAction={nextAction} userName={userName} />

          {/* Quick Start Grid */}
          <QuickStartGrid />

          {/* Progress & Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Widgets */}
            <div className="lg:col-span-2">
              <ProgressWidgets
                campaignProgress={{
                  active: 3,
                  completed: 12,
                  total: 15
                }}
                rankingProgress={{
                  keywordsTracked: 24,
                  averagePosition: 12.3,
                  top10Count: 8
                }}
                learningProgress={{
                  tutorialsCompleted: 2,
                  totalTutorials: 8,
                  currentTutorial: 'SEO Fundamentals'
                }}
              />
            </div>

            {/* AI Insights */}
            <AIInsightsCard
              insights={[
                {
                  id: '1',
                  type: 'opportunity',
                  title: 'High-value keyword opportunity',
                  description: 'Found 5 keywords with low competition and high search volume',
                  action: {
                    label: 'View keywords',
                    onClick: () => console.log('View keywords')
                  },
                  confidence: 'high'
                },
                {
                  id: '2',
                  type: 'tip',
                  title: 'Content freshness matters',
                  description: '3 of your top pages haven\'t been updated in 6+ months',
                  confidence: 'medium'
                }
              ]}
            />
          </div>

          {/* Pending Actions */}
          <PendingActions actions={pendingActions} />

          {/* Chat Interface - Always visible below dashboard */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">AI Assistant</h2>
            <AIChatInterface
              context={context}
              placeholder={isNewUser ? "Tell me about your business..." : "Ask anything..."}
              className="h-[500px]"
              conversationId={activeConversationId}
              agentId={activeAgentId}
              initialMessage={initialMessage}
            />
          </div>
        </div>
      </motion.div>

      {/* Mode Selection Dialog for new users */}
      <ModeSelectionDialog
        open={showModeSelection}
        onOpenChange={setShowModeSelection}
        onModeSelected={() => {
          setShowModeSelection(false)
        }}
      />
    </div>
  )
}
