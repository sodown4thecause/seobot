'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  GraduationCap, 
  Briefcase, 
  Building2, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Users,
  Zap
} from 'lucide-react'
import { UserModeLevel, USER_MODE_CONFIGS } from '@/types/user-mode'
import { useUserMode } from '@/components/providers/user-mode-provider'

interface ModeSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onModeSelected?: (mode: UserModeLevel) => void
  showTransitionInfo?: boolean
}

interface ModeOption {
  level: UserModeLevel
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  benefits: string[]
  color: string
  gradient: string
}

const MODE_OPTIONS: ModeOption[] = [
  {
    level: 'beginner',
    title: 'Beginner',
    description: 'Perfect for those new to SEO who want guided, step-by-step learning',
    icon: <GraduationCap className="w-8 h-8" />,
    features: [
      'Interactive tutorials',
      'Jargon explanations',
      'Progress tracking',
      'Guided workflows',
      'Simple analytics'
    ],
    benefits: [
      'Learn SEO fundamentals',
      'Build confidence gradually',
      'Avoid overwhelming complexity',
      'Track your learning progress'
    ],
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  {
    level: 'practitioner',
    title: 'Practitioner',
    description: 'For SEO professionals who want powerful tools with flexible workflows',
    icon: <Briefcase className="w-8 h-8" />,
    features: [
      'Advanced keyword research',
      'Competitor analysis',
      'Content optimization',
      'Technical SEO tools',
      'Performance tracking'
    ],
    benefits: [
      'Access professional tools',
      'Streamline your workflow',
      'Handle complex campaigns',
      'Detailed analytics'
    ],
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    level: 'agency',
    title: 'Agency',
    description: 'Enterprise-grade features for agencies managing multiple clients',
    icon: <Building2 className="w-8 h-8" />,
    features: [
      'Multi-client management',
      'White-label reporting',
      'Team collaboration',
      'API access',
      'Advanced automation'
    ],
    benefits: [
      'Scale your agency',
      'Manage multiple clients',
      'Custom branding',
      'Team workflows'
    ],
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-500/20'
  }
]

export function ModeSelectionDialog({ 
  open, 
  onOpenChange, 
  onModeSelected,
  showTransitionInfo = false 
}: ModeSelectionDialogProps) {
  const { state, actions } = useUserMode()
  const [selectedMode, setSelectedMode] = useState<UserModeLevel | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleModeSelect = async (mode: UserModeLevel) => {
    if (isTransitioning) return

    setSelectedMode(mode)
    setIsTransitioning(true)

    try {
      const success = await actions.switchMode(mode)
      if (success) {
        onModeSelected?.(mode)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Failed to switch mode:', error)
    } finally {
      setIsTransitioning(false)
      setSelectedMode(null)
    }
  }

  const canTransitionTo = async (mode: UserModeLevel): Promise<boolean> => {
    return await actions.canTransitionTo(mode)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader className="text-center space-y-4">
          <DialogTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Choose Your Experience Level
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-lg max-w-2xl mx-auto">
            {showTransitionInfo 
              ? "Ready to level up? Choose the mode that best fits your current SEO expertise."
              : "Select the experience level that matches your SEO knowledge. You can always change this later as you grow."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <AnimatePresence>
            {MODE_OPTIONS.map((option, index) => {
              const isCurrentMode = state.currentMode?.level === option.level
              const isSelected = selectedMode === option.level

              return (
                <motion.div
                  key={option.level}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Card 
                    className={`
                      relative overflow-hidden cursor-pointer transition-all duration-300 border-2
                      ${isCurrentMode 
                        ? 'border-yellow-400 bg-yellow-400/5' 
                        : isSelected
                        ? 'border-white bg-white/5'
                        : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
                      }
                    `}
                    onClick={() => !isTransitioning && handleModeSelect(option.level)}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-50`} />
                    
                    {/* Current mode indicator */}
                    {isCurrentMode && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Current
                        </Badge>
                      </div>
                    )}

                    {/* Loading indicator */}
                    {isSelected && isTransitioning && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                      </div>
                    )}

                    <CardContent className="relative p-6 space-y-4">
                      {/* Header */}
                      <div className="text-center space-y-2">
                        <div className={`${option.color} flex justify-center`}>
                          {option.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{option.title}</h3>
                        <p className="text-sm text-gray-300">{option.description}</p>
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Key Features
                        </h4>
                        <ul className="space-y-1">
                          {option.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                              <div className="w-1 h-1 bg-gray-400 rounded-full" />
                              {feature}
                            </li>
                          ))}
                          {option.features.length > 3 && (
                            <li className="text-xs text-gray-400">
                              +{option.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Perfect For
                        </h4>
                        <ul className="space-y-1">
                          {option.benefits.slice(0, 2).map((benefit, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                              <div className="w-1 h-1 bg-gray-400 rounded-full" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action button */}
                      <div className="pt-4">
                        <Button
                          variant={isCurrentMode ? "secondary" : "default"}
                          className={`
                            w-full transition-all duration-200
                            ${isCurrentMode 
                              ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' 
                              : 'bg-white text-gray-900 hover:bg-gray-100'
                            }
                          `}
                          disabled={isTransitioning}
                        >
                          {isCurrentMode ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Current Mode
                            </>
                          ) : (
                            <>
                              Select {option.title}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Additional info */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">Don't worry about choosing wrong</h4>
              <p className="text-xs text-gray-300">
                You can switch between modes anytime as your skills grow. Your data and settings are preserved during transitions.
              </p>
            </div>
          </div>
        </div>

        {/* Error display */}
        {state.error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-sm text-red-300">{state.error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={actions.clearError}
              className="mt-2 text-red-300 hover:text-red-200"
            >
              Dismiss
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}