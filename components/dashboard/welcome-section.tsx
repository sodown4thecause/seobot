'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight, Clock } from 'lucide-react'
import { useUserMode } from '@/components/providers/user-mode-provider'
import { ActionCard } from '@/components/actions/action-card'
import type { ActionItem } from '@/types/actions'

interface WelcomeSectionProps {
  nextAction?: ActionItem
  userName?: string
}

export function WelcomeSection({ nextAction, userName }: WelcomeSectionProps) {
  const { state: userModeState } = useUserMode()
  const currentMode = userModeState.currentMode?.level || 'beginner'

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getModeMessage = () => {
    switch (currentMode) {
      case 'beginner':
        return "Let's learn SEO step by step and track your progress"
      case 'practitioner':
        return 'Monitor your campaigns and optimize performance'
      case 'agency':
        return 'Manage clients, teams, and scale your operations'
      default:
        return 'Welcome to your SEO dashboard'
    }
  }

  return (
    <Card className="glass-card border-none bg-black/40">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-zinc-100">
              {getGreeting()}{userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-zinc-400 mb-6">
              {getModeMessage()}
            </p>

            {nextAction && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-400/80" />
                  <span className="font-semibold text-zinc-200">Your Next Action</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={nextAction.priority === 'critical' ? 'destructive' : 'default'} className="bg-zinc-100 text-zinc-900 hover:bg-white">
                          {nextAction.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-white/10 text-zinc-400 ">{nextAction.category}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1 text-zinc-100">{nextAction.title}</h3>
                      <p className="text-sm text-zinc-400 mb-3">
                        {nextAction.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {nextAction.estimatedTime}
                        </div>
                        <span>•</span>
                        <span>Results in {nextAction.timeToSeeResults}</span>
                      </div>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/20">
                      Start Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

