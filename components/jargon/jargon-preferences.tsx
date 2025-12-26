'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  HelpCircle, 
  BookOpen, 
  GraduationCap,
  Briefcase,
  Building2,
  CheckCircle,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import { useJargon } from '@/components/providers/jargon-provider'
import { useUserMode } from '@/components/providers/user-mode-provider'
import { useModeAdaptations } from '@/hooks/use-mode-adaptations'

interface JargonPreferencesProps {
  className?: string
}

export function JargonPreferences({ className = '' }: JargonPreferencesProps) {
  const { 
    isEnabled, 
    showAdvancedTerms, 
    preferredComplexity,
    getLearnedTerms,
    toggleTooltips,
    setComplexity
  } = useJargon()
  
  const { state: userModeState, actions: userModeActions } = useUserMode()
  const { currentMode } = useModeAdaptations()

  const learnedTerms = getLearnedTerms()

  // Complexity options
  const complexityOptions = [
    {
      level: 'basic' as const,
      title: 'Basic',
      description: 'Short definitions with simple examples',
      icon: <GraduationCap className="w-4 h-4" />,
      color: 'text-green-400 border-green-400'
    },
    {
      level: 'detailed' as const,
      title: 'Detailed',
      description: 'Full explanations with business context',
      icon: <Briefcase className="w-4 h-4" />,
      color: 'text-blue-400 border-blue-400'
    },
    {
      level: 'comprehensive' as const,
      title: 'Comprehensive',
      description: 'Complete information with related terms and mistakes',
      icon: <Building2 className="w-4 h-4" />,
      color: 'text-purple-400 border-purple-400'
    }
  ]

  const handleToggleJargonTooltips = async () => {
    toggleTooltips()
    
    // Also update user mode preferences
    if (userModeState.currentMode) {
      await userModeActions.updatePreferences({
        jargonTooltips: !isEnabled
      })
    }
  }

  return (
    <Card className={`bg-gray-800 border-gray-600 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          Jargon Tooltips
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">Enable Tooltips</p>
            <p className="text-xs text-gray-400">
              Show helpful explanations for SEO and AEO terms
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleJargonTooltips}
          />
        </div>

        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6"
          >
            <Separator className="bg-gray-600" />

            {/* Complexity Level */}
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Detail Level</p>
                <p className="text-xs text-gray-400">
                  Choose how much information to show in tooltips
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {complexityOptions.map((option) => (
                  <motion.div
                    key={option.level}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={preferredComplexity === option.level ? "default" : "outline"}
                      className={`
                        w-full justify-start h-auto p-3 text-left
                        ${preferredComplexity === option.level 
                          ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' 
                          : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                        }
                      `}
                      onClick={() => setComplexity(option.level)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className={`${option.color} mt-0.5`}>
                          {option.icon}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{option.title}</span>
                            {preferredComplexity === option.level && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-300">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Learning Progress */}
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  Learning Progress
                </p>
                <p className="text-xs text-gray-400">
                  Track your SEO knowledge growth
                </p>
              </div>

              <div className="bg-gray-700 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Terms Learned</span>
                  <Badge variant="secondary" className="bg-green-600 text-white">
                    {learnedTerms.length}
                  </Badge>
                </div>
                
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((learnedTerms.length / 50) * 100, 100)}%` 
                    }}
                  />
                </div>
                
                <p className="text-xs text-gray-400">
                  {learnedTerms.length < 50 
                    ? `${50 - learnedTerms.length} more to reach SEO fundamentals mastery`
                    : 'Congratulations! You\'ve mastered SEO fundamentals 🎉'
                  }
                </p>
              </div>
            </div>

            {/* Mode-specific recommendations */}
            {currentMode && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Recommendations for {currentMode} Mode
                  </p>
                </div>

                <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-700/30">
                  {currentMode === 'beginner' && (
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-200">
                        Focus on learning basic terms first. We recommend keeping tooltips enabled 
                        and using "Basic" detail level to build your foundation.
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                          SEO
                        </Badge>
                        <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                          Keywords
                        </Badge>
                        <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                          SERP
                        </Badge>
                      </div>
                    </div>
                  )}

                  {currentMode === 'practitioner' && (
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-200">
                        You can handle more detailed explanations. Consider using "Detailed" level 
                        to understand business context and practical applications.
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                          Technical SEO
                        </Badge>
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                          Link Building
                        </Badge>
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                          Analytics
                        </Badge>
                      </div>
                    </div>
                  )}

                  {currentMode === 'agency' && (
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-200">
                        Use "Comprehensive" level to get complete information including common 
                        mistakes and related terms. You might want to disable tooltips for 
                        terms you already know.
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
                          Advanced SEO
                        </Badge>
                        <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
                          AEO
                        </Badge>
                        <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
                          E-E-A-T
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}