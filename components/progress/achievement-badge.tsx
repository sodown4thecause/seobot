'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Award, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Achievement, AchievementRarity } from '@/lib/progress/types'

interface AchievementBadgeProps {
  achievement: Achievement
  earned?: boolean
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

const rarityColors: Record<AchievementRarity, string> = {
  common: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  rare: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl'
}

export function AchievementBadge({
  achievement,
  earned = true,
  size = 'md',
  showTooltip = true
}: AchievementBadgeProps) {
  const content = (
    <div
      className={cn(
        'rounded-full border-2 flex items-center justify-center transition-all',
        sizeClasses[size],
        earned
          ? rarityColors[achievement.rarity]
          : 'bg-gray-800/50 text-gray-600 border-gray-700/50 opacity-50',
        earned && 'hover:scale-110 cursor-pointer'
      )}
    >
      {achievement.icon ? (
        <span>{achievement.icon}</span>
      ) : (
        <Award className={cn(size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8')} />
      )}
      {!earned && <Lock className="absolute w-3 h-3" />}
    </div>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-semibold">{achievement.name}</div>
              <div className="text-xs text-muted-foreground">{achievement.description}</div>
              {earned && achievement.earnedAt && (
                <div className="text-xs text-muted-foreground">
                  Earned {achievement.earnedAt.toLocaleDateString()}
                </div>
              )}
              <Badge variant="outline" className="mt-1">
                {achievement.rarity}
              </Badge>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

