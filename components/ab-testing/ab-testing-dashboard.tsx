'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Play,
  Pause,
  Square,
  TrendingUp,
  Users,
  MousePointer,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Settings,
  Download,
  Eye,
  Copy,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  createABTest,
  startABTest,
  getUserABTests,
  calculateABTestInsights,
  ABTest,
  ABTestInsights
} from '@/lib/ab-testing/ab-testing-service'

interface ABTestingDashboardProps {
  userId: string
  contentId?: string
  initialContent?: {
    title: string
    metaDescription: string
  }
}

export function ABTestingDashboard({ 
  userId, 
  contentId, 
  initialContent 
}: ABTestingDashboardProps) {
  const [tests, setTests] = useState<ABTest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [testInsights, setTestInsights] = useState<Record<string, ABTestInsights>>({})
  const [isCreatingTest, setIsCreatingTest] = useState(false)
  const [newTestForm, setNewTestForm] = useState({
    name: '',
    description: '',
    type: 'headline' as 'headline' | 'meta_description',
    originalContent: ''
  })

  const { toast } = useToast()

  useEffect(() => {
    loadTests()
  }, [userId, activeTab])

  const loadTests = async () => {
    try {
      setIsLoading(true)
      const status = activeTab === 'all' ? undefined : activeTab as any
      const userTests = await getUserABTests(userId, status)
      setTests(userTests)

      // Load insights for active tests
      const insightsPromises = userTests
        .filter(test => test.status === 'active')
        .map(async test => {
          try {
            const insights = await calculateABTestInsights(test.id)
            return { [test.id]: insights }
          } catch (error) {
            console.error(`Failed to load insights for test ${test.id}:`, error)
            return { [test.id]: null }
          }
        })

      const insightsResults = await Promise.all(insightsPromises)
      const allInsights = insightsResults.reduce((acc, insight) => ({ ...acc, ...insight }), {})
      setTestInsights(allInsights)
    } catch (error) {
      console.error('Failed to load A/B tests:', error)
      toast({
        title: "Failed to load tests",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTest = async () => {
    if (!contentId || !newTestForm.originalContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide original content to test.",
        variant: "destructive"
      })
      return
    }

    setIsCreatingTest(true)
    try {
      await createABTest({
        name: newTestForm.name,
        description: newTestForm.description,
        contentId,
        type: newTestForm.type,
        originalContent: newTestForm.originalContent,
        userId
      })

      toast({
        title: "A/B test created",
        description: "Your test has been created and is ready to start.",
      })

      // Reset form and reload tests
      setNewTestForm({
        name: '',
        description: '',
        type: 'headline',
        originalContent: ''
      })
      loadTests()
    } catch (error) {
      console.error('Failed to create A/B test:', error)
      toast({
        title: "Failed to create test",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingTest(false)
    }
  }

  const handleStartTest = async (testId: string) => {
    try {
      await startABTest(testId, userId)
      toast({
        title: "Test started",
        description: "Your A/B test is now active and collecting data.",
      })
      loadTests()
    } catch (error) {
      console.error('Failed to start test:', error)
      toast({
        title: "Failed to start test",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-3 h-3" />
      case 'paused': return <Pause className="w-3 h-3" />
      case 'completed': return <CheckCircle className="w-3 h-3" />
      case 'draft': return <Square className="w-3 h-3" />
      default: return <Square className="w-3 h-3" />
    }
  }

  const formatDuration = (startDate?: string, endDate?: string) => {
    if (!startDate) return 'Not started'
    
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  const TestCard = ({ test }: { test: ABTest }) => {
    const insights = testInsights[test.id]
    const bestVariant = test.variants.reduce((best, variant) => {
      const variantResult = test.results.variantResults[variant.id] || { ctr: 0 }
      const bestResult = test.results.variantResults[best.id] || { ctr: 0 }
      return variantResult.ctr > bestResult.ctr ? variant : best
    }, test.variants[0])

    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{test.name}</CardTitle>
              <p className="text-sm text-gray-600">{test.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(test.status)}>
                {getStatusIcon(test.status)}
                <span className="ml-1 capitalize">{test.status}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mb-1">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-semibold">{test.results.totalImpressions.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Impressions</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mb-1">
                <MousePointer className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-lg font-semibold">{test.results.totalClicks.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Clicks</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-semibold">{bestVariant ? test.results.variantResults[bestVariant.id]?.ctr.toFixed(1) : '0'}%</p>
              <p className="text-xs text-gray-600">Best CTR</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg mb-1">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-lg font-semibold">{formatDuration(test.startDate, test.endDate)}</p>
              <p className="text-xs text-gray-600">Duration</p>
            </div>
          </div>

          {/* Variants Performance */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Variant Performance</h4>
            <div className="space-y-2">
              {test.variants.map((variant) => {
                const result = test.results.variantResults[variant.id] || { ctr: 0, impressions: 0 }
                const isWinner = variant.id === bestVariant?.id
                const percentage = test.results.totalImpressions > 0 
                  ? (result.impressions / test.results.totalImpressions) * 100 
                  : 0

                return (
                  <div key={variant.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{variant.name}</span>
                          {isWinner && test.status === 'completed' && (
                            <Badge variant="outline" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{result.ctr.toFixed(1)}% CTR</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={percentage} className="flex-1 h-2" />
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Statistical Insights */}
          {insights && test.status === 'active' && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Statistical Insights</h4>
                <Badge variant={insights.statisticalSignificance ? 'default' : 'secondary'}>
                  {insights.confidenceLevel.toFixed(1)}% confidence
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-600">Significance: </span>
                  <span className={insights.statisticalSignificance ? 'text-green-600 font-medium' : 'text-orange-600'}>
                    {insights.statisticalSignificance ? 'Significant' : 'Not significant'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Recommended duration: </span>
                  <span className="font-medium">{insights.recommendedDuration} days</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2 border-t">
            {test.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => handleStartTest(test.id)}
              >
                <Play className="w-3 h-3 mr-1" />
                Start Test
              </Button>
            )}
            {test.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {/* TODO: Pause test */}}
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedTest(test)}
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              View Details
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Test Variants Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {test.variants.map((variant) => (
                    <div key={variant.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{variant.name}</h4>
                        <Badge variant="outline">{variant.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                        {variant.content}
                      </p>
                      <div className="mt-2 text-xs text-gray-600">
                        {variant.content.length} characters
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">A/B Testing</h3>
            <p className="text-sm text-gray-600">Test and optimize your headlines and meta descriptions</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Test Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Homepage Headline Test"
                  value={newTestForm.name}
                  onChange={(e) => setNewTestForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="What are you testing and why?"
                  value={newTestForm.description}
                  onChange={(e) => setNewTestForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Test Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTestForm.type}
                  onChange={(e) => setNewTestForm(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="headline">Headline</option>
                  <option value="meta_description">Meta Description</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Original {newTestForm.type === 'headline' ? 'Headline' : 'Meta Description'}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder={newTestForm.type === 'headline' 
                    ? 'Enter your current headline...' 
                    : 'Enter your current meta description...'
                  }
                  value={newTestForm.originalContent}
                  onChange={(e) => setNewTestForm(prev => ({ ...prev, originalContent: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button
                  onClick={handleCreateTest}
                  disabled={isCreatingTest || !newTestForm.name || !newTestForm.originalContent}
                >
                  {isCreatingTest ? 'Creating...' : 'Create Test'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="all">All Tests</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} tests</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Create your first A/B test to start optimizing your content
                </p>
                <Button onClick={() => document.querySelector('button[data-state="open"]')?.click()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Test
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
