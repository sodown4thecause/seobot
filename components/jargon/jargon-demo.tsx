'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Sparkles, Target, TrendingUp } from 'lucide-react'
import { JargonTooltip } from './jargon-tooltip'
import { JargonSearch } from './jargon-search'
import { JargonPreferences } from './jargon-preferences'
import { AutoJargonWrapper } from '@/lib/jargon/auto-wrapper'

/**
 * Demo component showcasing the jargon tooltip system
 * This demonstrates various ways to use jargon tooltips in content
 */
export function JargonDemo() {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <BookOpen className="w-8 h-8 text-blue-400" />
          Jargon Tooltip System Demo
        </h1>
        <p className="text-gray-400">
          Hover over highlighted terms to see beginner-friendly explanations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Demo */}
        <div className="lg:col-span-2 space-y-6">
          {/* SEO Basics Card */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                SEO Fundamentals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                <JargonTooltip term="SEO">SEO</JargonTooltip> is the practice of optimizing your website to improve its visibility in{' '}
                <JargonTooltip term="organic traffic">organic search results</JargonTooltip>. The goal is to increase{' '}
                <JargonTooltip term="organic traffic">organic traffic</JargonTooltip> by ranking higher in{' '}
                <JargonTooltip term="SERP">SERPs</JargonTooltip> for relevant{' '}
                <JargonTooltip term="keyword">keywords</JargonTooltip>.
              </p>
              
              <p className="text-gray-300 leading-relaxed">
                Key elements include optimizing your{' '}
                <JargonTooltip term="title tag">title tags</JargonTooltip> and{' '}
                <JargonTooltip term="meta description">meta descriptions</JargonTooltip>, improving{' '}
                <JargonTooltip term="page speed">page speed</JargonTooltip>, and building quality{' '}
                <JargonTooltip term="backlink">backlinks</JargonTooltip> to increase your{' '}
                <JargonTooltip term="domain authority">domain authority</JargonTooltip>.
              </p>

              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30">
                <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Pro Tip
                </h4>
                <p className="text-blue-200 text-sm">
                  Focus on improving your{' '}
                  <JargonTooltip term="click-through rate">CTR</JargonTooltip> and reducing{' '}
                  <JargonTooltip term="bounce rate">bounce rate</JargonTooltip> to signal quality to search engines.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Topics Card */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Advanced SEO & AEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 leading-relaxed">
                Modern SEO includes{' '}
                <JargonTooltip term="AEO">Answer Engine Optimization (AEO)</JargonTooltip> for AI search engines. 
                Focus on{' '}
                <JargonTooltip term="E-E-A-T">E-E-A-T</JargonTooltip> signals and optimizing for{' '}
                <JargonTooltip term="featured snippet">featured snippets</JargonTooltip> to improve visibility.
              </p>

              <p className="text-gray-300 leading-relaxed">
                Technical aspects like{' '}
                <JargonTooltip term="Core Web Vitals">Core Web Vitals</JargonTooltip> and{' '}
                <JargonTooltip term="mobile-first indexing">mobile-first indexing</JargonTooltip> are crucial for rankings.
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <JargonTooltip term="local SEO">Local SEO</JargonTooltip>
                </Badge>
                <Badge variant="secondary">
                  <JargonTooltip term="Google Business Profile">Google Business Profile</JargonTooltip>
                </Badge>
                <Badge variant="secondary">
                  <JargonTooltip term="NAP consistency">NAP Consistency</JargonTooltip>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Auto-wrapped Content Demo */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Auto-Wrapped Content</CardTitle>
              <p className="text-gray-400 text-sm">
                This content uses automatic jargon detection
              </p>
            </CardHeader>
            <CardContent>
              <AutoJargonWrapper
                options={{ 
                  variant: 'underline',
                  maxReplacements: 8,
                  showIcon: false
                }}
              >
                Understanding SEO metrics is crucial for success. Monitor your organic traffic, 
                bounce rate, and click-through rate regularly. Focus on building quality backlinks 
                and optimizing your title tags and meta descriptions. Don't forget about page speed 
                and mobile optimization for better Core Web Vitals scores.
              </AutoJargonWrapper>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Tools */}
        <div className="space-y-6">
          {/* Dictionary Search */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">SEO Dictionary</CardTitle>
            </CardHeader>
            <CardContent>
              <JargonSearch />
              <p className="text-xs text-gray-400 mt-2">
                Browse 200+ SEO and AEO terms with explanations
              </p>
            </CardContent>
          </Card>

          {/* Preferences */}
          <JargonPreferences />

          {/* Quick Reference */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Quick Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Tooltip Variants</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <JargonTooltip term="SEO" variant="underline">Underline style</JargonTooltip>
                  </div>
                  <div>
                    <JargonTooltip term="SERP" variant="inline">Inline style</JargonTooltip>
                  </div>
                  <div>
                    <JargonTooltip term="keyword" variant="badge">Badge style</JargonTooltip>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Difficulty Levels</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-400">Basic - Simple definitions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-400">Intermediate - Detailed explanations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-gray-400">Advanced - Comprehensive info</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}