'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { OnboardingProgressBar } from '@/components/onboarding/progress-bar'
import { 
  type OnboardingState, 
  type OnboardingData, 
  type OnboardingStep,
  calculateProgress,
  detectStepFromData,
  getStepCompletionStatus,
  ONBOARDING_STEPS
} from '@/lib/onboarding/state'
import { STEP_1_INITIAL_MESSAGE } from '@/lib/onboarding/prompts'

interface ConversationalOnboardingProps {
  userId?: string
  onComplete?: (data: OnboardingData) => void
}

export function ConversationalOnboarding({ userId, onComplete }: ConversationalOnboardingProps) {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 1,
    data: {},
    progress: 0,
    isComplete: false,
  })

  const updateOnboardingState = useCallback(() => {
    setOnboardingState((prev) => {
      const newState = { ...prev }
      
      // Detect current step from data
      const detectedStep = detectStepFromData(newState.data)
      
      // Check if current step is complete
      const isStepComplete = getStepCompletionStatus(newState.data, newState.currentStep)
      
      // Auto-advance if step is complete
      if (isStepComplete && detectedStep > newState.currentStep) {
        newState.currentStep = detectedStep as OnboardingStep
      }
      
      // Calculate progress
      newState.progress = calculateProgress(newState)
      
      // Check if onboarding is complete
      if (newState.currentStep === 6 && isStepComplete) {
        newState.isComplete = true
        if (onComplete) {
          onComplete(newState.data)
        }
      }
      
      return newState
    })
  }, [onComplete])

  const handleComponentSubmit = useCallback((componentType: string, data: any) => {
    setOnboardingState((prev) => {
      const newData: OnboardingData = { ...prev.data }
      
      // Update data based on component type
      switch (componentType) {
        case 'url_input':
          newData.websiteUrl = data
          break
        
        case 'card_selector':
          // Determine which selection based on current step
          if (prev.currentStep === 1) {
            // Business goals
            newData.goals = Array.isArray(data) ? data : [data]
          } else if (prev.currentStep === 4) {
            // Content types
            newData.contentTypes = Array.isArray(data) ? data : [data]
          }
          break
        
        case 'location_picker':
          newData.location = data
          break
        
        case 'confirmation_buttons':
          // Handle confirmations
          if (data === 'yes' || data === 'Yes') {
            // Update state will be called after message is processed
          }
          break
      }
      
      const updatedState = {
        ...prev,
        data: newData,
        progress: calculateProgress({ ...prev, data: newData }),
      }
      
      // Trigger state update
      setTimeout(() => {
        updateOnboardingState()
      }, 100)
      
      return updatedState
    })
  }, [updateOnboardingState])

  // Update state when data changes
  useEffect(() => {
    updateOnboardingState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen purple-gradient flex flex-col">
      {/* Minimal Top Bar */}
      <div className="glass-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-primary flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Flow Intent</span>
            </div>
            <div className="text-sm text-white/70">
              Step {onboardingState.currentStep} of {ONBOARDING_STEPS.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <OnboardingProgressBar state={onboardingState} />

      {/* Chat Interface - Full Screen */}
      <div className="flex-1 overflow-hidden">
        <AIChatInterface
          context={useMemo(
            () => ({
              page: 'onboarding',
              onboarding: onboardingState,
            }),
            [
              onboardingState.currentStep,
              onboardingState.progress,
              onboardingState.isComplete,
              JSON.stringify(onboardingState.data),
            ]
          )}
          onComponentSubmit={handleComponentSubmit}
          className="h-full"
          placeholder="Type your response..."
          initialMessage={STEP_1_INITIAL_MESSAGE}
        />
      </div>
    </div>
  )
}

