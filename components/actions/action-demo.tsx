'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Target,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  RefreshCw,
  Lightbulb,
  CheckCircle,
  Clock
} from 'lucide-react'
import { ActionDashboard } from './action-dashboard'
import { useActions } from '../providers/action-provider'
import { SEOAnalysisContext, ActionItem, ActionStatus } from '@/types/actions'

/**
 * Demo component showcasing the Action Generator Framework
 * This demonstrates how to generate and manage SEO actions
 */
export function ActionDemo() {
  const { actions, updateActionStatus, completeAction, setActions } = useActions()
  const [isGenerating, setIsGenerating] = useState(false)

  // Sample SEO analysis context for demo
  const sampleContext: SEOAnalysisContext = {
    keywords: {
      current: ['SEO tools', 'keyword research', 'content optimization'],
      opportunities: ['long tail keywords', 'local SEO', 'voice search optimization'],
      gaps: ['competitor analysis', 'technical SEO audit', 'link building strategy']
    },
    competitors: {
      domains: ['semrush.com', 'ahrefs.com', 'moz.com'],
      advantages: ['comprehensive keyword database', 'advanced link analysis', 'better reporting'],
      weaknesses: ['complex interface', 'high pricing', 'steep learning curve']
    },
    technical: {
      issues: [
        {
          type: 'page_speed',
          severity: 'high',
          description: 'Pages loading slower than 3 seconds',
          pages: ['/blog', '/products', '/about'],
          impact: 'Reduced user experience and search rankings',
          fixComplexity: 'medium'
        },
        {
          type: 'mobile_optimization',
          severity: 'medium',
          description: 'Mobile viewport not properly configured',
          pages: ['/contact', '/services'],
          impact: 'Poor mobile user experience',
          fixComplexity: 'easy'
        }
      ],
      scores: {
        pageSpeed: 65,
        coreWebVitals: 70,
        mobileOptimization: 80,
        technicalSEO: 75
      }
    },
    content: {
      gaps: ['how-to guides', 'case studies', 'industry reports'],
      opportunities: ['featured snippets', 'FAQ sections', 'video content'],
      performance: {
        '/blog/seo-tips': 45,
        '/guide/keyword-research': 60,
        '/resources/tools': 35
      }
    },
    links: {
      current: 150,
      opportunities: [
        {
          domain: 'searchengineland.com',
          authority: 85,
          relevance: 90,
          difficulty: 25,
          type: 'guest_post'
        },
        {
          domain: 'marketingland.com',
          authority: 80,
          relevance: 85,
          difficulty: 30,
          type: 'resource_page'
        }
      ],
      quality: 'medium'
    }
  }

  const handleGenerateActions = async () => {
    setIsGenerating(true)
    try {
      // Demo: Add sample actions
      const demoActions: ActionItem[] = [
        {
          id: 'demo-1',
          title: 'Improve Page Speed',
          description: 'Optimize page loading times to under 3 seconds',
          category: 'technical',
          priority: 'high',
          difficulty: 'intermediate',
          status: 'pending',
          estimatedTime: '4-6 hours',
          timeToSeeResults: '2-4 weeks',
          automatable: false,
          impact: {
            description: 'Faster pages lead to better rankings and user experience',
            metrics: { rankingImprovement: '10-20%' },
            confidence: 'high'
          },
          steps: [],
          verification: {
            check: 'Run PageSpeed Insights',
            expectedOutcome: 'Score above 80',
            successMetrics: ['LCP under 2.5s', 'CLS under 0.1']
          },
          tags: ['technical', 'performance'],
          source: 'analysis',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      setActions(demoActions)
    } catch (error) {
      console.error('Failed to generate actions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleActionStatusChange = (actionId: string, status: ActionStatus) => {
    updateActionStatus(actionId, status)
  }

  const handleActionComplete = (actionId: string) => {
    completeAction(actionId, {
      rating: 5,
      wasHelpful: true,
      comment: 'Action completed successfully'
    })
  }

  const handleActionSkip = (actionId: string) => {
    updateActionStatus(actionId, 'skipped', 'Not relevant for current goals')
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <Target className="w-8 h-8 text-blue-400" />
          Action Generator Framework Demo
        </h1>
        <p className="text-gray-400">
          Generate prioritized, actionable SEO recommendations based on analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sample Analysis Context */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Sample Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Keywords</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Current: {sampleContext.keywords.current.length}</div>
                  <div>Opportunities: {sampleContext.keywords.opportunities.length}</div>
                  <div>Gaps: {sampleContext.keywords.gaps.length}</div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Technical Issues</h4>
                <div className="space-y-1">
                  {sampleContext.technical.issues.map((issue, idx) => (
                    <div key={idx} className="text-xs">
                      <Badge
                        variant="outline"
                        className={`text-xs ${issue.severity === 'high' ? 'border-red-500 text-red-400' :
                            issue.severity === 'medium' ? 'border-yellow-500 text-yellow-400' :
                              'border-green-500 text-green-400'
                          }`}
                      >
                        {issue.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Performance Scores</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Page Speed: {sampleContext.technical.scores.pageSpeed}/100</div>
                  <div>Core Web Vitals: {sampleContext.technical.scores.coreWebVitals}/100</div>
                  <div>Technical SEO: {sampleContext.technical.scores.technicalSEO}/100</div>
                </div>
              </div>

              <Button
                onClick={handleGenerateActions}
                disabled={isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Generate Actions
              </Button>
            </CardContent>
          </Card>

          {/* Action Categories */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Action Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Content</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Technical</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Link Building</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Local SEO</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-pink-400" />
                  <span className="text-gray-300">Analytics</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Features */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Key Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Priority-based ranking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Time estimates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Automation detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Impact metrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300">Step-by-step guidance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Dashboard */}
        <div className="lg:col-span-3">
          <ActionDashboard
            actions={actions}
            onActionStatusChange={handleActionStatusChange}
            onActionComplete={handleActionComplete}
            onActionSkip={handleActionSkip}
            onGenerateActions={handleGenerateActions}
            isLoading={isGenerating}
          />
        </div>
      </div>

      {/* Generation Results Summary */}
      {actions.length > 0 && (
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Generation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{actions.length}</div>
                <div className="text-sm text-gray-400">Total Actions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {actions.filter(a => a.priority === 'high' || a.priority === 'critical').length}
                </div>
                <div className="text-sm text-gray-400">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {actions.filter(a => a.automatable).length}
                </div>
                <div className="text-sm text-gray-400">Automatable</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {actions.filter(a => a.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}