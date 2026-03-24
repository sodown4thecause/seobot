'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Sparkles, Brain, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion, AnimatePresence } from 'framer-motion'

export interface ReasoningStep {
  id?: string
  title?: string
  description?: string
  status?: 'completed' | 'in-progress' | 'pending'
  timestamp?: string
}

interface ReasoningProps {
  steps: ReasoningStep[]
  className?: string
  title?: string
  isActive?: boolean
}

export function Reasoning({ steps, className, title = 'Reasoning', isActive = false }: ReasoningProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  if (!steps || steps.length === 0) return null

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const inProgressSteps = steps.filter(s => s.status === 'in-progress').length
  const progress = Math.round((completedSteps / steps.length) * 100)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('my-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden', className)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-auto p-3 hover:bg-zinc-800/50 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-5 h-5 rounded flex items-center justify-center',
                isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-700/50 text-zinc-400'
              )}>
                {isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-3 h-3" />
                  </motion.div>
                ) : (
                  <Brain className="w-3 h-3" />
                )}
              </div>
              <span className="text-sm font-medium text-zinc-300">{title}</span>
              <span className="text-xs text-zinc-500">
                {completedSteps}/{steps.length} steps
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isActive && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                  <Zap className="w-3 h-3" />
                  <span>In progress</span>
                </div>
              )}
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-zinc-500 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* Progress bar */}
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            
            {steps.map((step, index) => (
              <ReasoningStepComponent key={step.id || index} step={step} index={index} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function ReasoningStepComponent({ step, index }: { step: ReasoningStep; index: number }) {
  const statusIcons = {
    completed: (
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    'in-progress': (
      <motion.div
        className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-2 h-2 rounded-full bg-indigo-400" />
      </motion.div>
    ),
    pending: (
      <div className="w-5 h-5 rounded-full bg-zinc-700/50 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-zinc-500" />
      </div>
    ),
  }

  return (
    <div className="flex items-start gap-3 py-2">
      {statusIcons[step.status || 'pending']}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          step.status === 'completed' ? 'text-zinc-200' : 
          step.status === 'in-progress' ? 'text-zinc-100' : 'text-zinc-500'
        )}>
          {step.title || `Step ${index + 1}`}
        </p>
        {step.description && (
          <p className={cn(
            'text-xs mt-0.5',
            step.status === 'completed' ? 'text-zinc-400' : 'text-zinc-600'
          )}>
            {step.description}
          </p>
        )}
      </div>
      {step.timestamp && (
        <span className="text-xs text-zinc-600 flex-shrink-0">
          {step.timestamp}
        </span>
      )}
    </div>
  )
}
