'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Filter,
  SortAsc,
  SortDesc,
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3,
  RefreshCw,
  Plus
} from 'lucide-react'
import { ActionCard } from './action-card'
import { ActionItem, ActionPriority, ActionCategory, ActionStatus, ActionFilter, ActionSort } from '@/types/actions'
import { useModeAdaptations } from '@/hooks/use-mode-adaptations'

interface ActionDashboardProps {
  actions: ActionItem[]
  onActionStatusChange?: (actionId: string, status: ActionStatus) => void
  onActionComplete?: (actionId: string) => void
  onActionSkip?: (actionId: string) => void
  onGenerateActions?: () => void
  isLoading?: boolean
  className?: string
}

export function ActionDashboard({
  actions,
  onActionStatusChange,
  onActionComplete,
  onActionSkip,
  onGenerateActions,
  isLoading = false,
  className = ''
}: ActionDashboardProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [filter, setFilter] = useState<ActionFilter>({})
  const [sort, setSort] = useState<ActionSort>({ field: 'priority', direction: 'desc' })
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards')
  
  const { classes, shouldShowFeature, currentMode } = useModeAdaptations()

  // Filter and sort actions
  const filteredAndSortedActions = useMemo(() => {
    let filtered = actions

    // Apply filters
    if (filter.categories?.length) {
      filtered = filtered.filter(action => filter.categories!.includes(action.category))
    }
    if (filter.priorities?.length) {
      filtered = filtered.filter(action => filter.priorities!.includes(action.priority))
    }
    if (filter.difficulties?.length) {
      filtered = filtered.filter(action => filter.difficulties!.includes(action.difficulty))
    }
    if (filter.status?.length) {
      filtered = filtered.filter(action => filter.status!.includes(action.status))
    }
    if (filter.automatable !== undefined) {
      filtered = filtered.filter(action => action.automatable === filter.automatable)
    }

    // Apply tab filter
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'pending':
          filtered = filtered.filter(action => action.status === 'pending')
          break
        case 'in_progress':
          filtered = filtered.filter(action => action.status === 'in_progress')
          break
        case 'completed':
          filtered = filtered.filter(action => action.status === 'completed')
          break
        case 'quick_wins':
          filtered = filtered.filter(action => 
            (action.priority === 'high' || action.priority === 'critical') &&
            parseTimeToMinutes(action.estimatedTime) <= 120
          )
          break
        case 'automatable':
          filtered = filtered.filter(action => action.automatable)
          break
      }
    }

    // Sort actions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sort.field) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
          aValue = difficultyOrder[a.difficulty]
          bValue = difficultyOrder[b.difficulty]
          break
        case 'estimatedTime':
          aValue = parseTimeToMinutes(a.estimatedTime)
          bValue = parseTimeToMinutes(b.estimatedTime)
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = a[sort.field]
          bValue = b[sort.field]
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [actions, filter, sort, activeTab])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = actions.length
    const completed = actions.filter(a => a.status === 'completed').length
    const inProgress = actions.filter(a => a.status === 'in_progress').length
    const pending = actions.filter(a => a.status === 'pending').length
    const quickWins = actions.filter(a => 
      (a.priority === 'high' || a.priority === 'critical') &&
      parseTimeToMinutes(a.estimatedTime) <= 120
    ).length
    const automatable = actions.filter(a => a.automatable).length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      inProgress,
      pending,
      quickWins,
      automatable,
      completionRate
    }
  }, [actions])

  const parseTimeToMinutes = (timeString: string): number => {
    const hourMatch = timeString.match(/(\d+)(?:-(\d+))?\s*hours?/)
    if (hourMatch) {
      const min = parseInt(hourMatch[1])
      const max = hourMatch[2] ? parseInt(hourMatch[2]) : min
      return ((min + max) / 2) * 60
    }
    
    const minuteMatch = timeString.match(/(\d+)(?:-(\d+))?\s*minutes?/)
    if (minuteMatch) {
      const min = parseInt(minuteMatch[1])
      const max = minuteMatch[2] ? parseInt(minuteMatch[2]) : min
      return (min + max) / 2
    }
    
    return 120 // Default 2 hours
  }

  const getPriorityColor = (priority: ActionPriority) => {
    const colors = {
      critical: 'text-red-400',
      high: 'text-orange-400',
      medium: 'text-yellow-400',
      low: 'text-gray-400'
    }
    return colors[priority]
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Action Dashboard</h1>
          <p className="text-gray-400">
            Prioritized actions to improve your SEO performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onGenerateActions}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Generate Actions
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Actions</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
            <div className="text-sm text-gray-400">In Progress</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.quickWins}</div>
            <div className="text-sm text-gray-400">Quick Wins</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.automatable}</div>
            <div className="text-sm text-gray-400">Automatable</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.completionRate}%</div>
            <div className="text-sm text-gray-400">Completion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="bg-gray-800 border-gray-600">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Priority:</span>
              <div className="flex gap-1">
                {(['critical', 'high', 'medium', 'low'] as ActionPriority[]).map(priority => (
                  <Button
                    key={priority}
                    variant={filter.priorities?.includes(priority) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newPriorities = filter.priorities?.includes(priority)
                        ? filter.priorities.filter(p => p !== priority)
                        : [...(filter.priorities || []), priority]
                      setFilter({ ...filter, priorities: newPriorities })
                    }}
                    className={`text-xs ${getPriorityColor(priority)}`}
                  >
                    {priority}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Category:</span>
              <select
                value={filter.categories?.[0] || ''}
                onChange={(e) => {
                  const category = e.target.value as ActionCategory
                  setFilter({ 
                    ...filter, 
                    categories: category ? [category] : undefined 
                  })
                }}
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="">All Categories</option>
                <option value="content">Content</option>
                <option value="technical">Technical</option>
                <option value="links">Links</option>
                <option value="local">Local</option>
                <option value="aeo">AEO</option>
                <option value="analytics">Analytics</option>
                <option value="keywords">Keywords</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort:</span>
              <select
                value={`${sort.field}-${sort.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-')
                  setSort({ 
                    field: field as ActionSort['field'], 
                    direction: direction as 'asc' | 'desc' 
                  })
                }}
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="priority-desc">Priority (High to Low)</option>
                <option value="priority-asc">Priority (Low to High)</option>
                <option value="estimatedTime-asc">Time (Short to Long)</option>
                <option value="estimatedTime-desc">Time (Long to Short)</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-400">View:</span>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('compact')}
              >
                Compact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full bg-gray-800">
          <TabsTrigger value="all">All ({actions.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="quick_wins">Quick Wins ({stats.quickWins})</TabsTrigger>
          <TabsTrigger value="automatable">Automatable ({stats.automatable})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-400">Generating personalized actions...</p>
            </div>
          ) : filteredAndSortedActions.length === 0 ? (
            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-12 text-center">
                <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Actions Found</h3>
                <p className="text-gray-400 mb-4">
                  {actions.length === 0 
                    ? 'Generate your first set of personalized SEO actions to get started.'
                    : 'No actions match your current filters. Try adjusting your filter criteria.'
                  }
                </p>
                {actions.length === 0 && (
                  <Button onClick={onGenerateActions} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Generate Actions
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={`
              grid gap-4
              ${viewMode === 'compact' 
                ? 'grid-cols-1' 
                : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }
            `}>
              <AnimatePresence>
                {filteredAndSortedActions.map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ActionCard
                      action={action}
                      onStatusChange={onActionStatusChange}
                      onComplete={onActionComplete}
                      onSkip={onActionSkip}
                      compact={viewMode === 'compact'}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}