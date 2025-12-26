'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Award } from 'lucide-react'
import type { Skill } from '@/lib/progress/types'
import { getSkillCategoryDefinition } from '@/lib/progress/skill-categories'

interface SkillLevelCardProps {
  skill: Skill
  showDetails?: boolean
}

export function SkillLevelCard({ skill, showDetails = false }: SkillLevelCardProps) {
  const definition = getSkillCategoryDefinition(skill.category)
  const progressPercentage = (skill.xp / skill.nextLevelXp) * 100
  const leveledUp = skill.level > 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{definition.name}</CardTitle>
          <Badge variant="secondary">Level {skill.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">XP Progress</span>
            <span className="font-semibold">
              {skill.xp} / {skill.nextLevelXp} XP
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {showDetails && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total XP</span>
              <span className="font-semibold">{skill.totalXp.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">XP to Next Level</span>
              <span className="font-semibold">
                {skill.nextLevelXp - skill.xp} XP
              </span>
            </div>
          </div>
        )}

        {leveledUp && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <Award className="w-3 h-3" />
            <span>Leveled up!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

