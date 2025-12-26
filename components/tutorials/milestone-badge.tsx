'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge as BadgeComponent } from '@/components/ui/badge'
import { Trophy, Sparkles, Award, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Badge } from '@/lib/tutorials/milestone-service'

export interface MilestoneBadgeProps {
  badge: Badge
  size?: 'sm' | 'md' | 'lg'
  showDescription?: boolean
  className?: string
}

export function MilestoneBadge({ 
  badge, 
  size = 'md', 
  showDescription = false,
  className 
}: MilestoneBadgeProps) {
  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 border-yellow-300'
      case 'epic':
        return 'bg-gradient-to-br from-purple-500 to-pink-600 border-purple-300'
      case 'rare':
        return 'bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const getRarityIcon = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return <Trophy className="w-4 h-4" />
      case 'epic':
        return <Sparkles className="w-4 h-4" />
      case 'rare':
        return <Award className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-5xl',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <Card 
        className={cn(
          'relative overflow-hidden border-2 transition-all hover:scale-105',
          getRarityColor(badge.rarity),
          sizeClasses[size]
        )}
      >
        <CardContent className="flex items-center justify-center h-full p-0">
          <div className="text-center">
            <div className="mb-1">{badge.icon}</div>
            {badge.rarity !== 'common' && (
              <div className="absolute top-1 right-1 text-white">
                {getRarityIcon(badge.rarity)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className={cn('mt-2 text-center', textSizeClasses[size])}>
        <div className="font-semibold text-gray-900">{badge.name}</div>
        {showDescription && (
          <div className="text-gray-600 mt-1 max-w-[200px]">{badge.description}</div>
        )}
        {badge.earnedAt && (
          <div className="text-xs text-gray-500 mt-1">
            Earned {new Date(badge.earnedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {badge.rarity !== 'common' && (
        <BadgeComponent 
          variant="secondary" 
          className={cn('mt-1', textSizeClasses[size])}
        >
          {badge.rarity}
        </BadgeComponent>
      )}
    </div>
  )
}

export interface BadgeCollectionProps {
  badges: Badge[]
  title?: string
  className?: string
}

export function BadgeCollection({ badges, title, className }: BadgeCollectionProps) {
  if (badges.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No badges earned yet. Complete tutorials to earn badges!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {badges.map(badge => (
          <MilestoneBadge 
            key={badge.id} 
            badge={badge} 
            size="md"
            showDescription={true}
          />
        ))}
      </div>
    </div>
  )
}
