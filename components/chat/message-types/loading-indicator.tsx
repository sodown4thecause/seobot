'use client'

import { Loader2 } from 'lucide-react'

interface LoadingIndicatorProps {
  steps?: string[]
  currentStep?: string
}

export function LoadingIndicator({ steps = [], currentStep }: LoadingIndicatorProps) {
  return (
    <div className="space-y-3 py-2">
      {steps.length > 0 ? (
        steps.map((step, index) => {
          const isActive = step === currentStep
          const isComplete = currentStep && steps.indexOf(currentStep) > index
          
          return (
            <div key={index} className="flex items-center space-x-2 text-sm">
              {isComplete ? (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : isActive ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted" />
              )}
              <span className={isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                {step}
              </span>
            </div>
          )
        })
      ) : (
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {currentStep || 'Processing...'}
          </span>
        </div>
      )}
    </div>
  )
}

