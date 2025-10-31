'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  Play,
  BarChart3,
  Target,
  TrendingUp,
  Users,
  Eye,
  ThumbsUp,
  Clock,
  Tag,
  FileText,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  Copy,
  RefreshCw,
  Zap,
  Award,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  analyzeVideoSEO,
  generateTitleSuggestions,
  generateDescriptionOptimization,
  generateOptimalTags,
  VideoSEOData,
  VideoOptimizationSuggestion
} from '@/lib/video/video-seo-service'

interface VideoSEOAnalyzerProps {
  userId: string
}

export function VideoSEOAnalyzer({ userId }: VideoSEOAnalyzerProps) {
  const [videoUrl, setVideoUrl] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [transcript, setTranscript] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<VideoSEOData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [optimizedDescription, setOptimizedDescription] = useState('')
  const [optimalTags, setOptimalTags] = useState<string[]>([])

  const { toast } = useToast()

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Video URL required",
        description: "Please enter a valid video URL to analyze.",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const keywords = targetKeywords.split(',').map(k => k.trim()).filter(k => k)
      
      const result = await analyzeVideoSEO({
        videoUrl,
        targetKeywords: keywords,
        userId,
        transcript: transcript.trim() || undefined
      })

      setAnalysis(result)
      setActiveTab('overview')

      // Generate additional optimizations
      await generateOptimizations(result)

      toast({
        title: "Analysis complete",
        description: `Your video scored ${result.seoScore}/100 for SEO optimization.`,
      })
    } catch (error) {
      console.error('Failed to analyze video:', error)
      toast({
        title: "Analysis failed",
        description: "Please check the video URL and try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateOptimizations = async (videoData: VideoSEOData) => {
    try {
      const [titles, description, tags] = await Promise.all([
        generateTitleSuggestions({
          currentTitle: videoData.videoTitle,
          targetKeywords: videoData.targetKeywords,
          videoTopic: videoData.videoTitle,
          audience: 'General'
        }),
        generateDescriptionOptimization({
          currentDescription: videoData.videoDescription,
          targetKeywords: videoData.targetKeywords,
          videoTitle: videoData.videoTitle
        }),
        generateOptimalTags({
          videoTitle: videoData.videoTitle,
          videoDescription: videoData.videoDescription,
          targetKeywords: videoData.targetKeywords,
          competitorTags: videoData.competitorAnalysis.topVideos.flatMap(v => v.tags)
        })
      ])

      setTitleSuggestions(titles)
      setOptimizedDescription(description)
      setOptimalTags(tags)
    } catch (error) {
      console.error('Failed to generate optimizations:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
    })
  }

  if (!analysis) {
    return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Video className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Video SEO Analyzer</h3>
            <p className="text-sm text-gray-600">Optimize your videos for maximum visibility</p>
          </div>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analyze Your Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports YouTube, Vimeo, TikTok, and Instagram
              </p>
            </div>

            <div>
              <Label htmlFor="targetKeywords">Target Keywords</Label>
              <Input
                id="targetKeywords"
                placeholder="SEO optimization, video marketing, tutorial"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate keywords with commas
              </p>
            </div>

            <div>
              <Label htmlFor="transcript">Video Transcript (Optional)</Label>
              <Textarea
                id="transcript"
                placeholder="Paste your video transcript here for better analysis..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !videoUrl.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Analyze Video
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Video className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Video SEO Analysis</h3>
            <p className="text-sm text-gray-600">{analysis.videoTitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getSEOScoreColor(analysis.seoScore)}`}>
            {analysis.seoScore}/100
          </div>
          <p className="text-sm text-gray-600">SEO Score</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">85K</p>
                    <p className="text-sm text-gray-600">Est. Monthly Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">6.2%</p>
                    <p className="text-sm text-gray-600">Engagement Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{analysis.targetKeywords.length}</p>
                    <p className="text-sm text-gray-600">Target Keywords</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{formatDuration(analysis.duration)}</p>
                    <p className="text-sm text-gray-600">Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Video Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={analysis.thumbnailUrl || '/placeholder-video.jpg'}
                    alt={analysis.videoTitle}
                    className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{analysis.videoTitle}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{analysis.videoDescription}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{analysis.metadata.platform.toUpperCase()}</span>
                    <span>{analysis.metadata.channelName}</span>
                    <span>{analysis.metadata.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {analysis.tags.slice(0, 5).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {analysis.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{analysis.tags.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                Top Optimization Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.optimizationSuggestions
                  .filter(s => s.priority === 'high')
                  .slice(0, 3)
                  .map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium capitalize">{suggestion.type}</span>
                          <Badge className="bg-red-100 text-red-800">
                            {suggestion.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            Impact: {suggestion.impact}/10
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Title Optimizations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Title Optimizations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Current Title</Label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {analysis.videoTitle}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">AI-Generated Titles</Label>
                  <div className="space-y-2">
                    {titleSuggestions.map((title, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <p className="text-sm text-gray-700 flex-1 bg-blue-50 p-2 rounded">
                          {title}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(title)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description Optimizations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description Optimizations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Optimized Description</Label>
                  <Textarea
                    value={optimizedDescription}
                    onChange={(e) => setOptimizedDescription(e.target.value)}
                    rows={8}
                    className="text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(optimizedDescription)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags Optimizations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tag Optimizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Optimal Tags (15-20 recommended)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {optimalTags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(optimalTags.join(', '))}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy All Tags
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Optimization Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.optimizationSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium capitalize">{suggestion.type}</span>
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                        <Badge variant="outline">
                          Impact: {suggestion.impact}/10
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{suggestion.suggestion}</p>
                    <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
                    {suggestion.suggestedValue && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        <strong>Suggested:</strong> {suggestion.suggestedValue}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Competitor Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-semibold">{analysis.competitorAnalysis.averageViews.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Average Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold">{analysis.competitorAnalysis.averageEngagement}%</p>
                  <p className="text-sm text-gray-600">Average Engagement</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold">{analysis.competitorAnalysis.topVideos.length}</p>
                  <p className="text-sm text-gray-600">Competitors Analyzed</p>
                </div>
              </div>

              <div className="space-y-4">
                {analysis.competitorAnalysis.topVideos.map((video, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-20 h-15 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{video.title}</h4>
                      <p className="text-sm text-gray-600">{video.channel}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{video.views.toLocaleString()} views</span>
                        <span>{video.likes.toLocaleString()} likes</span>
                        <span>{video.engagementRate}% engagement</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Common Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.competitorAnalysis.commonKeywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Content Gaps to Exploit</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.competitorAnalysis.contentGaps.map((gap, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-green-50">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {/* Transcript */}
          {analysis.transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Video Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={analysis.transcript}
                  readOnly
                  rows={12}
                  className="text-sm font-mono"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(analysis.transcript || '')}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Transcript
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Video Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Platform:</span>
                    <span className="text-sm font-medium capitalize">{analysis.metadata.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm font-medium">{analysis.metadata.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Language:</span>
                    <span className="text-sm font-medium">{analysis.metadata.language.toUpperCase()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Comments:</span>
                    <span className="text-sm font-medium">
                      {analysis.metadata.commentsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monetization:</span>
                    <span className="text-sm font-medium">
                      {analysis.metadata.monetization ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Age Restriction:</span>
                    <span className="text-sm font-medium">
                      {analysis.metadata.ageRestriction ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export SEO Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Export to CSV
                </Button>
                <Button variant="outline" className="justify-start">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Optimized Metadata
                </Button>
                <Button variant="outline" className="justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Share Analysis Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
