'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { SkillLevelCard } from './skill-level-card'
import { AchievementBadge } from './achievement-badge'
import type { SEOProgress, SkillCategory, Skill } from '@/lib/progress/types'
import { Trophy, TrendingUp, Target, Award } from 'lucide-react'

export function ProgressOverview() {
  const [progress, setProgress] = useState<SEOProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const response = await fetch('/api/progress')
      if (!response.ok) {
        throw new Error('Failed to fetch progress')
      }
      
      const data = await response.json()
      
      // Deserialize dates from ISO strings
      const userProgress: SEOProgress = {
        ...data.progress,
        achievements: data.progress.achievements.map((a: Record<string, unknown>) => ({
          ...a,
          earnedAt: a.earnedAt ? new Date(a.earnedAt as string) : undefined
        })),
        skills: Object.fromEntries(
          Object.entries(data.progress.skills).map(([key, skill]) => [
            key,
            {
              ...(skill as Skill),
              lastUpdatedAt: (skill as Record<string, unknown>).lastUpdatedAt 
                ? new Date((skill as Record<string, unknown>).lastUpdatedAt as string) 
                : new Date()
            }
          ])
        ) as Record<SkillCategory, Skill>
      }
      
      setProgress(userProgress)
    } catch (error) {
      console.error('Failed to load progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading progress...</div>
        </CardContent>
      </Card>
    )
  }

  if (!progress) {
    return null
  }

  const skillCategories: SkillCategory[] = [
    'keywordResearch',
    'contentCreation',
    'technicalSEO',
    'linkBuilding',
    'localSEO'
  ]

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Achievements</p>
                <p className="text-2xl font-bold">{progress.achievements.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content Created</p>
                <p className="text-2xl font-bold">{progress.metrics.contentCreated}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Keywords Ranking</p>
                <p className="text-2xl font-bold">{progress.metrics.keywordsRanking}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Links Built</p>
                <p className="text-2xl font-bold">{progress.metrics.linksBuilt}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillCategories.map((category) => (
              <SkillLevelCard
                key={category}
                skill={progress.skills[category]}
                showDetails={true}
              />
            ))}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {progress.achievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No achievements earned yet. Start completing actions to earn achievements!</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {progress.achievements.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      earned={true}
                      size="md"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(progress.onboarding.percentage)}%</span>
                </div>
                <Progress value={progress.onboarding.percentage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-2">Completed</p>
                  <div className="flex flex-wrap gap-2">
                    {progress.onboarding.completed.map((item) => (
                      <Badge key={item} variant="default">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                {progress.onboarding.pending.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Pending</p>
                    <div className="flex flex-wrap gap-2">
                      {progress.onboarding.pending.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

