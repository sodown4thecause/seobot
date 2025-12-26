'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { ActionCard } from '@/components/actions/action-card'
import type { ActionItem } from '@/types/actions'

interface PendingActionsProps {
  actions: ActionItem[]
  maxDisplay?: number
}

export function PendingActions({ actions, maxDisplay = 5 }: PendingActionsProps) {
  // Sort by priority and urgency
  const sortedActions = [...actions]
    .filter(action => action.status === 'pending')
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, maxDisplay)

  const getUrgencyBadge = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'critical':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Critical
          </Badge>
        )
      case 'high':
        return (
          <Badge variant="default" className="gap-1">
            <Clock className="w-3 h-3" />
            High Priority
          </Badge>
        )
      default:
        return null
    }
  }

  if (sortedActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No pending actions. Great work!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-none bg-black/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-zinc-100">Pending Actions</CardTitle>
          <Badge variant="outline" className="border-white/10 text-zinc-400">{sortedActions.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedActions.map((action) => (
          <div
            key={action.id}
            className="p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getUrgencyBadge(action.priority)}
                  <Badge variant="outline" className="text-zinc-400 border-white/10">{action.category}</Badge>
                </div>
                <h3 className="font-semibold mb-1 text-zinc-200">{action.title}</h3>
                <p className="text-sm text-zinc-500 mb-3">
                  {action.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{action.estimatedTime}</span>
                  <span>•</span>
                  <span>{action.difficulty}</span>
                  {action.automatable && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">Auto</Badge>
                    </>
                  )}
                </div>
              </div>
              <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white">Start</Button>
            </div>
          </div>
        ))}
        {actions.length > maxDisplay && (
          <Button variant="outline" className="w-full border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200">
            View All {actions.length} Actions
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

