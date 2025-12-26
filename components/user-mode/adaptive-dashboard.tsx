'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  Search,
  FileText,
  Users,
  BarChart3,
  Lightbulb,
  Target,
  Zap,
  BookOpen,
  Award
} from 'lucide-react'
import { useModeAdaptations } from '@/hooks/use-mode-adaptations'

interface AdaptiveDashboardProps {
  className?: string
}

// Mock data for demonstration
const MOCK_DATA = {
  beginner: {
    metrics: [
      { label: 'Keywords Tracked', value: '12', icon: Search, color: 'text-blue-400' },
      { label: 'Content Created', value: '3', icon: FileText, color: 'text-green-400' },
      { label: 'Learning Progress', value: '45%', icon: BookOpen, color: 'text-purple-400' }
    ],
    quickActions: [
      { label: 'Start Tutorial', icon: BookOpen, description: 'Learn SEO basics' },
      { label: 'Create Content', icon: FileText, description: 'Write your first article' },
      { label: 'Research Keywords', icon: Search, description: 'Find opportunities' }
    ],
    learningPath: {
      completed: 3,
      total: 8,
      current: 'Keyword Research Basics'
    }
  },
  practitioner: {
    metrics: [
      { label: 'Active Campaigns', value: '8', icon: Target, color: 'text-blue-400' },
      { label: 'Avg. Position', value: '12.3', icon: TrendingUp, color: 'text-green-400' },
      { label: 'Monthly Traffic', value: '24.5K', icon: BarChart3, color: 'text-purple-400' },
      { label: 'Content Pieces', value: '47', icon: FileText, color: 'text-orange-400' },
      { label: 'Backlinks', value: '156', icon: Zap, color: 'text-pink-400' }
    ],
    quickActions: [
      { label: 'Competitor Analysis', icon: Users, description: 'Analyze top competitors' },
      { label: 'Content Optimization', icon: FileText, description: 'Improve existing content' },
      { label: 'Technical Audit', icon: BarChart3, description: 'Check site health' },
      { label: 'Link Building', icon: Zap, description: 'Build quality backlinks' }
    ]
  },
  agency: {
    metrics: [
      { label: 'Active Clients', value: '23', icon: Users, color: 'text-blue-400' },
      { label: 'Total Revenue', value: '$45.2K', icon: TrendingUp, color: 'text-green-400' },
      { label: 'Team Members', value: '8', icon: Users, color: 'text-purple-400' },
      { label: 'Campaigns', value: '67', icon: Target, color: 'text-orange-400' },
      { label: 'Reports Generated', value: '156', icon: BarChart3, color: 'text-pink-400' },
      { label: 'API Calls', value: '12.3K', icon: Zap, color: 'text-cyan-400' }
    ],
    quickActions: [
      { label: 'Client Dashboard', icon: Users, description: 'Manage all clients' },
      { label: 'White-label Reports', icon: FileText, description: 'Generate branded reports' },
      { label: 'Team Management', icon: Users, description: 'Manage team access' },
      { label: 'API Integration', icon: Zap, description: 'Connect external tools' },
      { label: 'Bulk Operations', icon: BarChart3, description: 'Process multiple campaigns' }
    ]
  }
}

export function AdaptiveDashboard({ className = '' }: AdaptiveDashboardProps) {
  const {
    currentMode,
    classes,
    shouldShowFeature,
    dataComplexity,
    isLoading
  } = useModeAdaptations()

  if (isLoading || !currentMode) {
    return (
      <div className={`animate-pulse space-y-6 ${className}`}>
        <div className="h-8 bg-gray-700 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const modeData = MOCK_DATA[currentMode]
  const metricsToShow = dataComplexity.metrics === 'essential' ? 3 :
    dataComplexity.metrics === 'comprehensive' ? 5 :
      modeData.metrics.length

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={classes.container}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className={classes.heading}>
              {currentMode === 'beginner' && 'Welcome to Your SEO Journey'}
              {currentMode === 'practitioner' && 'SEO Dashboard'}
              {currentMode === 'agency' && 'Agency Command Center'}
            </h1>
            <p className={`${classes.body} text-gray-400 mt-2`}>
              {currentMode === 'beginner' && 'Let\'s learn SEO step by step and track your progress'}
              {currentMode === 'practitioner' && 'Monitor your campaigns and optimize performance'}
              {currentMode === 'agency' && 'Manage clients, teams, and scale your operations'}
            </p>
          </div>

          {shouldShowFeature('progress-tracking') && currentMode === 'beginner' && 'learningPath' in modeData && (
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                <Award className="w-3 h-3 mr-1" />
                Learning Progress
              </Badge>
              <div className="w-32">
                <Progress value={(modeData.learningPath.completed / modeData.learningPath.total) * 100} />
                <p className="text-xs text-gray-400 mt-1">
                  {modeData.learningPath.completed}/{modeData.learningPath.total} completed
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`grid ${classes.grid}`}
      >
        {modeData.metrics.slice(0, metricsToShow).map((metric, index) => (
          <Card key={metric.label} className="bg-gray-800 border-gray-700">
            <CardContent className={classes.card}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${classes.body} text-gray-400`}>{metric.label}</p>
                  <p className={`${classes.subheading} ${metric.color} font-bold`}>
                    {metric.value}
                  </p>
                </div>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Learning Path (Beginner only) */}
      {shouldShowFeature('tutorials') && currentMode === 'beginner' && 'learningPath' in modeData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/50">
            <CardHeader>
              <CardTitle className={`${classes.subheading} text-white flex items-center gap-2`}>
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Current Learning: {modeData.learningPath.current}
              </CardTitle>
            </CardHeader>
            <CardContent className={classes.card}>
              <div className="flex items-center gap-4">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Continue Learning
                </Button>
                <div className="flex-1">
                  <Progress
                    value={(modeData.learningPath.completed / modeData.learningPath.total) * 100}
                    className="h-2"
                  />
                </div>
                <span className="text-sm text-gray-400">
                  {Math.round((modeData.learningPath.completed / modeData.learningPath.total) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className={`${classes.subheading} text-white mb-4`}>
          {currentMode === 'beginner' && 'Next Steps'}
          {currentMode === 'practitioner' && 'Quick Actions'}
          {currentMode === 'agency' && 'Management Tools'}
        </h2>

        <div className={`grid ${classes.grid}`}>
          {modeData.quickActions.map((action, index) => (
            <Card
              key={action.label}
              className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
            >
              <CardContent className={classes.card}>
                <div className="flex items-start gap-3">
                  <action.icon className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <h3 className={`${classes.body} font-medium text-white`}>
                      {action.label}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Mode-specific additional sections */}
      {currentMode === 'agency' && shouldShowFeature('team-management') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className={`${classes.subheading} text-white`}>
                Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent className={classes.card}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`${classes.body} text-gray-300`}>Active team members</span>
                  <Badge variant="secondary">8 online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${classes.body} text-gray-300`}>Tasks completed today</span>
                  <span className="text-green-400 font-medium">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${classes.body} text-gray-300`}>Client reports pending</span>
                  <span className="text-orange-400 font-medium">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}