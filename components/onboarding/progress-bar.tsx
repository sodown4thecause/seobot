'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { type OnboardingState, ONBOARDING_STEPS } from '@/lib/onboarding/state'

interface ProgressBarProps {
  state: OnboardingState
}

export function OnboardingProgressBar({ state }: ProgressBarProps) {
  const progress = state.progress
  
  return (
    <div className="w-full px-8 py-6 glass-dark border-b border-white/10">
      {/* Step Indicators */}
      <div className="flex justify-between items-center mb-4">
        {ONBOARDING_STEPS.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === state.currentStep
          const isComplete = stepNumber < state.currentStep
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Circle */}
              <div className="relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "font-semibold text-sm transition-all duration-300",
                    isComplete && "bg-white text-purple-deep",
                    isActive && "bg-white text-purple-deep ring-4 ring-white/20",
                    !isActive && !isComplete && "bg-white/20 text-white/60"
                  )}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                
                {/* Label */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <p className={cn(
                    "text-xs font-medium",
                    isActive ? "text-white" : "text-white/60"
                  )}>
                    {step.name}
                  </p>
                </div>
              </div>
              
              {/* Connecting Line */}
              {index < ONBOARDING_STEPS.length - 1 && (
                <div className="flex-1 h-0.5 bg-white/20 mx-2">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: isComplete ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-white">
            {ONBOARDING_STEPS[state.currentStep - 1]?.description}
          </p>
          <p className="text-sm font-semibold text-white">
            {Math.round(progress)}% Complete
          </p>
        </div>
        <Progress value={progress} className="h-2 bg-white/20" />
      </div>
    </div>
  )
}
