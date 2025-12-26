'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  CheckCircle,
  PlayCircle,
  Pause,
  SkipForward,
  AlertCircle,
  TrendingUp,
  Zap,
  Users,
  BarChart3,
  ExternalLink,
  Star
} from 'lucide-react'
import { ActionItem, ActionPriority, ActionCategory, ActionStatus } from '@/types/actions'
import { useModeAdaptations } from '@/hooks/use-mode-adaptations'

interface ActionCardProps {
  action: ActionItem
  onStatusChange?: (actionId: string, status: ActionStatus) => void
  onComplete?: (actionId: string) => void
  onSkip?: (actionId: string) => void
  className?: string
  compact?: boolean
}

export function ActionCard({
  action,
  onStatusChange,
  onComplete,
  onSkip,
  className = '',
  compact = false
}: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const { classes, shouldShowFeature } = useModeAdaptations()

  const getPriorityColor = (priority: ActionPriority) => {
    const colors = {
      critical: 'bg-red-500 text-white border-red-500',
      high: 'bg-orange-500 text-white border-orange-500',
      medium: 'bg-yellow-500 text-black border-yellow-500',
      low: 'bg-gray-500 text-white border-gray-500'
    }
    return colors[priority]
  }

  const getCategoryIcon = (category: ActionCategory) => {
    const icons = {
      content: <Target className="w-4 h-4" />,
      technical: <Zap className="w-4 h-4" />,
      links: <Users className="w-4 h-4" />,
      local: <BarChart3 className="w-4 h-4" />,
      aeo: <Star className="w-4 h-4" />,
      analytics: <TrendingUp className="w-4 h-4" />,
      keywords: <Target className="w-4 h-4" />
    }
    return icons[category] || <Target className="w-4 h-4" />
  }

  const getStatusColor = (status: ActionStatus) => {
    const colors = {
      pending: 'text-gray-400',
      in_progress: 'text-blue-400',
      completed: 'text-green-400',
      skipped: 'text-yellow-400',
      failed: 'text-red-400'
    }
    return colors[status]
  }

  const handleStartAction = () => {
    onStatusChange?.(action.id, 'in_progress')
  }

  const handleCompleteAction = () => {
    onStatusChange?.(action.id, 'completed')
    onComplete?.(action.id)
  }

  const handleSkipAction = () => {
    onStatusChange?.(action.id, 'skipped')
    onSkip?.(action.id)
  }

  const progress = action.status === 'completed' ? 100 :
    action.status === 'in_progress' ? (currentStep / action.steps.length) * 100 : 0

  if (compact) {
    return (
      <Card className={`bg-gray-800 border-gray-600 hover:border-gray-500 transition-colors ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-blue-400">
                {getCategoryIcon(action.category)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">{action.title}</h4>
                <p className="text-sm text-gray-400 truncate">{action.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getPriorityColor(action.priority)}>
                {action.priority}
              </Badge>
              <Button
                size="sm"
                variant={action.status === 'pending' ? 'default' : 'outline'}
                onClick={action.status === 'pending' ? handleStartAction : undefined}
                className={getStatusColor(action.status)}
              >
                {action.status === 'pending' && <PlayCircle className="w-3 h-3 mr-1" />}
                {action.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                {action.status === 'in_progress' && <Pause className="w-3 h-3 mr-1" />}
                {action.status === 'skipped' && <SkipForward className="w-3 h-3 mr-1" />}
                {action.status.replace('_', ' ')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gray-800 border-gray-600 hover:border-gray-500 transition-colors ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-blue-400 mt-1">
              {getCategoryIcon(action.category)}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white text-lg">{action.title}</h3>
                <Badge variant="outline" className={getPriorityColor(action.priority)}>
                  {action.priority}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {action.category}
                </Badge>
                {action.automatable && (
                  <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                    <Zap className="w-3 h-3 mr-1" />
                    Automatable
                  </Badge>
                )}
              </div>
              <p className="text-gray-300 leading-relaxed">{action.description}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Progress bar for in-progress actions */}
        {action.status === 'in_progress' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="text-blue-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400">Time Required</div>
            <div className="font-medium text-white flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {action.estimatedTime}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Time to Results</div>
            <div className="font-medium text-white">{action.timeToSeeResults}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Difficulty</div>
            <div className="font-medium text-white capitalize">{action.difficulty}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Impact</div>
            <div className="font-medium text-white capitalize">{action.impact.confidence}</div>
          </div>
        </div>

        {/* Impact preview */}
        <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/30">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Expected Impact
          </h4>
          <p className="text-blue-200 text-sm mb-2">{action.impact.description}</p>
          {Object.entries(action.impact.metrics).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(action.impact.metrics).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {value}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {action.status === 'pending' && (
            <>
              <Button onClick={handleStartAction} className="flex-1">
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Action
              </Button>
              <Button variant="outline" onClick={handleSkipAction}>
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
            </>
          )}

          {action.status === 'in_progress' && (
            <>
              <Button onClick={handleCompleteAction} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
              <Button variant="outline" onClick={() => onStatusChange?.(action.id, 'pending')}>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            </>
          )}

          {action.status === 'completed' && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Completed</span>
              {action.completedAt && (
                <span className="text-xs text-gray-400">
                  on {new Date(action.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {action.status === 'skipped' && (
            <div className="flex items-center gap-2 text-yellow-400">
              <SkipForward className="w-4 h-4" />
              <span className="text-sm">Skipped</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange?.(action.id, 'pending')}
                className="text-blue-400 hover:text-blue-300"
              >
                Restart
              </Button>
            </div>
          )}
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-gray-600"
            >
              {/* Steps */}
              <div className="space-y-3">
                <h4 className="font-medium text-white">Action Steps</h4>
                <div className="space-y-2">
                  {action.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`
                        p-3 rounded-lg border transition-colors
                        ${index === currentStep && action.status === 'in_progress'
                          ? 'border-blue-500 bg-blue-900/20'
                          : index < currentStep && action.status === 'in_progress'
                            ? 'border-green-500 bg-green-900/20'
                            : 'border-gray-600 bg-gray-700/50'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                          ${index < currentStep && action.status === 'in_progress'
                            ? 'bg-green-500 text-white'
                            : index === currentStep && action.status === 'in_progress'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-600 text-gray-300'
                          }
                        `}>
                          {index < currentStep && action.status === 'in_progress' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h5 className="font-medium text-white">{step.title}</h5>
                          <p className="text-sm text-gray-300">{step.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.estimatedTime}
                            </span>
                            {step.tools && step.tools.length > 0 && (
                              <span>Tools: {step.tools.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification */}
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  Verification
                </h4>
                <p className="text-sm text-gray-300 mb-2">{action.verification.check}</p>
                <p className="text-sm text-gray-400">Expected: {action.verification.expectedOutcome}</p>
              </div>

              {/* Resources */}
              {action.steps.some(step => (step.resources?.length ?? 0) > 0) && (
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Resources</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {action.steps.flatMap(step => step.resources || []).map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                        <span className="text-sm text-white">{resource.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {action.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {action.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}