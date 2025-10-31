'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Play,
  Pause,
  FileText,
  Clock,
  Users,
  TrendingUp,
  Share2,
  Download,
  Copy,
  Edit,
  Save,
  RefreshCw,
  Headphones,
  BookOpen,
  MessageSquare,
  Calendar,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Upload,
  Zap,
  BarChart3,
  Globe,
  Twitter,
  Linkedin,
  Facebook,
  Instagram
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  transcribeAndOptimizePodcast,
  generateBlogPostFromPodcast,
  generateSocialMediaCalendar,
  PodcastTranscription,
  SEOOptimizedContent,
  ContentRepurposing
} from '@/lib/podcast/podcast-service'

interface PodcastTranscriberProps {
  userId: string
}

export function PodcastTranscriber({ userId }: PodcastTranscriberProps) {
  const [audioUrl, setAudioUrl] = useState('')
  const [podcastTitle, setPodcastTitle] = useState('')
  const [podcastDescription, setPodcastDescription] = useState('')
  const [episodeNumber, setEpisodeNumber] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState<PodcastTranscription | null>(null)
  const [activeTab, setActiveTab] = useState('upload')
  const [generatedBlogPost, setGeneratedBlogPost] = useState('')
  const [socialMediaCalendar, setSocialMediaCalendar] = useState<any>(null)

  const { toast } = useToast()

  const handleTranscribe = async () => {
    if (!audioUrl.trim() || !podcastTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both audio URL and podcast title.",
        variant: "destructive"
      })
      return
    }

    setIsTranscribing(true)
    try {
      const keywords = targetKeywords.split(',').map(k => k.trim()).filter(k => k)
      
      const result = await transcribeAndOptimizePodcast({
        audioUrl,
        podcastTitle,
        podcastDescription: podcastDescription.trim() || undefined,
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
        targetKeywords: keywords,
        userId
      })

      setTranscription(result)
      setActiveTab('transcript')

      toast({
        title: "Transcription complete",
        description: `Successfully processed "${result.podcastTitle}" with ${result.keyTopics.length} key topics identified.`,
      })
    } catch (error) {
      console.error('Failed to transcribe podcast:', error)
      toast({
        title: "Transcription failed",
        description: "Please check the audio URL and try again.",
        variant: "destructive"
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleGenerateBlogPost = async (tone: 'professional' | 'casual' | 'educational') => {
    if (!transcription) return

    try {
      const blogPost = await generateBlogPostFromPodcast({
        podcastId: transcription.id,
        targetAudience: 'Marketing professionals',
        tone,
        includeQuotes: true
      })

      setGeneratedBlogPost(blogPost)
      toast({
        title: "Blog post generated",
        description: "Your SEO-optimized blog post is ready.",
      })
    } catch (error) {
      console.error('Failed to generate blog post:', error)
      toast({
        title: "Generation failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleGenerateSocialCalendar = async () => {
    if (!transcription) return

    try {
      const calendar = await generateSocialMediaCalendar({
        podcastId: transcription.id,
        platforms: ['twitter', 'linkedin', 'facebook', 'instagram'],
        duration: 7,
        postsPerDay: 2
      })

      setSocialMediaCalendar(calendar)
      toast({
        title: "Social media calendar created",
        description: "7-day content calendar is ready for scheduling.",
      })
    } catch (error) {
      console.error('Failed to generate social media calendar:', error)
      toast({
        title: "Calendar generation failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The content has been copied to your clipboard.",
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'linkedin': return <Linkedin className="w-4 h-4" />
      case 'facebook': return <Facebook className="w-4 h-4" />
      case 'instagram': return <Instagram className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  if (!transcription) {
    return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Headphones className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Podcast Transcription & SEO</h3>
            <p className="text-sm text-gray-600">Transform your audio content into SEO-optimized text</p>
          </div>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Podcast Episode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="audioUrl">Audio URL</Label>
              <Input
                id="audioUrl"
                placeholder="https://www.youtube.com/watch?v=... or audio file URL"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports YouTube, audio files, and podcast platforms
              </p>
            </div>

            <div>
              <Label htmlFor="podcastTitle">Podcast Title</Label>
              <Input
                id="podcastTitle"
                placeholder="Episode 45: SEO Strategies for 2024"
                value={podcastTitle}
                onChange={(e) => setPodcastTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="podcastDescription">Description (Optional)</Label>
              <Textarea
                id="podcastDescription"
                placeholder="Brief description of the episode content..."
                value={podcastDescription}
                onChange={(e) => setPodcastDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="episodeNumber">Episode Number (Optional)</Label>
                <Input
                  id="episodeNumber"
                  type="number"
                  placeholder="45"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="targetKeywords">Target Keywords</Label>
                <Input
                  id="targetKeywords"
                  placeholder="SEO, marketing, AI tools"
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleTranscribe}
              disabled={isTranscribing || !audioUrl.trim() || !podcastTitle.trim()}
              className="w-full"
            >
              {isTranscribing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
            </Button>

            {isTranscribing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing audio...</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Headphones className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{transcription.podcastTitle}</h3>
            <p className="text-sm text-gray-600">
              Episode {transcription.episodeNumber} • {formatDuration(transcription.duration)} • {transcription.keyTopics.length} topics
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {transcription.metadata.platform.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="content">SEO Content</TabsTrigger>
          <TabsTrigger value="repurpose">Repurpose</TabsTrigger>
          <TabsTrigger value="blog">Blog Post</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        {/* Transcript Tab */}
        <TabsContent value="transcript" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Full Transcript</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(transcription.transcript)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={transcription.transcript}
                readOnly
                rows={20}
                className="text-sm font-mono resize-none"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Episode Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{transcription.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {transcription.keyTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Guest Speakers</h4>
                  <div className="flex flex-wrap gap-2">
                    {transcription.guestSpeakers.map((speaker, index) => (
                      <Badge key={index} variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {speaker}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Target Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {transcription.targetKeywords.map((keyword, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">
                        <Target className="w-3 h-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Tabs defaultValue="shownotes">
            <TabsList>
              <TabsTrigger value="shownotes">Show Notes</TabsTrigger>
              <TabsTrigger value="timestamps">Timestamps</TabsTrigger>
              <TabsTrigger value="quotes">Key Quotes</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="shownotes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>SEO-Optimized Show Notes</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(transcription.seoOptimizedContent.showNotes)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: transcription.seoOptimizedContent.showNotes.replace(/\n/g, '<br>') }} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timestamps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Episode Timestamps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transcription.seoOptimizedContent.timestamps.map((timestamp, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Badge variant="outline">{timestamp.time}</Badge>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{timestamp.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{timestamp.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {timestamp.keywords.map((keyword, kidx) => (
                              <Badge key={kidx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quotes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Shareable Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transcription.seoOptimizedContent.keyQuotes.map((quote, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                        <p className="text-gray-900 italic mb-2">"{quote.text}"</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>— {quote.speaker}</span>
                            <span>• {quote.timestamp}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {quote.shareable && (
                              <Badge variant="secondary" className="text-xs">
                                <Share2 className="w-3 h-3 mr-1" />
                                Shareable
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(`"${quote.text}" — ${quote.speaker}`)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resources Mentioned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transcription.seoOptimizedContent.resources.map((resource, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{resource.title}</h4>
                          <p className="text-sm text-gray-600">{resource.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {resource.type}
                            </Badge>
                            <span className="text-xs text-gray-500">{resource.mentionedAt}</span>
                          </div>
                        </div>
                        {resource.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              Visit
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Repurpose Tab */}
        <TabsContent value="repurpose" className="space-y-4">
          <Tabs defaultValue="blog">
            <TabsList>
              <TabsTrigger value="blog">Blog Ideas</TabsTrigger>
              <TabsTrigger value="clips">Video Clips</TabsTrigger>
              <TabsTrigger value="infographics">Infographics</TabsTrigger>
              <TabsTrigger value="twitter">Twitter Threads</TabsTrigger>
              <TabsTrigger value="carousel">Carousel Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="blog" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Blog Post Ideas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transcription.contentRepurposing.blogPosts.map((blog, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{blog.title}</h4>
                          <Badge variant="outline">{blog.estimatedWordCount} words</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{blog.angle}</p>
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-700">Target Audience: </span>
                          <span className="text-xs text-gray-600">{blog.targetAudience}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-700">Key Points: </span>
                          <ul className="text-xs text-gray-600 list-disc list-inside mt-1">
                            {blog.keyPoints.map((point, pidx) => (
                              <li key={pidx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clips" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Social Media Video Clips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transcription.contentRepurposing.videoClips.map((clip, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{clip.title}</h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{clip.startTime} - {clip.endTime}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{clip.description}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-700">Platforms: </span>
                          {clip.platforms.map((platform, pidx) => (
                            <Badge key={pidx} variant="secondary" className="text-xs">
                              {getPlatformIcon(platform)}
                              <span className="ml-1">{platform}</span>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {clip.hashtags.map((tag, tidx) => (
                            <Badge key={tidx} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="infographics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Infographic Ideas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transcription.contentRepurposing.infographics.map((infographic, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{infographic.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{infographic.keyMessage}</p>
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-700">Visual Style: </span>
                          <span className="text-xs text-gray-600">{infographic.visualStyle}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-700">Data Points: </span>
                          <ul className="text-xs text-gray-600 list-disc list-inside mt-1">
                            {infographic.dataPoints.map((point, pidx) => (
                              <li key={pidx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="twitter" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Twitter Threads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transcription.contentRepurposing.twitterThreads.map((thread, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">Hook:</p>
                          <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{thread.hook}</p>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">Thread:</p>
                          <div className="space-y-2">
                            {thread.tweets.map((tweet, tidx) => (
                              <div key={tidx} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                <span className="text-xs text-gray-500 mr-2">{tidx + 1}/{thread.tweets.length}</span>
                                {tweet}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-900 mb-1">Call to Action:</p>
                          <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">{thread.callToAction}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {thread.hashtags.map((tag, tidx) => (
                            <Badge key={tidx} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="carousel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Carousel Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transcription.contentRepurposing.carouselPosts.map((carousel, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{carousel.title}</h4>
                          <Badge variant="outline" className="capitalize">
                            {getPlatformIcon(carousel.platform)}
                            <span className="ml-1">{carousel.platform}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{carousel.description}</p>
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-2">Slides:</p>
                          <div className="space-y-2">
                            {carousel.slides.map((slide, sidx) => (
                              <div key={sidx} className="flex items-start space-x-2">
                                <Badge variant="secondary" className="text-xs mt-0.5">
                                  {sidx + 1}
                                </Badge>
                                <p className="text-sm text-gray-700">{slide}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Blog Post Tab */}
        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Generate Blog Post</span>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={(value) => handleGenerateBlogPost(value as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedBlogPost ? (
                <div className="space-y-4">
                  <Textarea
                    value={generatedBlogPost}
                    onChange={(e) => setGeneratedBlogPost(e.target.value)}
                    rows={20}
                    className="text-sm"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(generatedBlogPost)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Blog Post
                    </Button>
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Save as Draft
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a tone to generate an SEO-optimized blog post</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Social Media Calendar</span>
                <Button onClick={handleGenerateSocialCalendar}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Generate Calendar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {socialMediaCalendar ? (
                <div className="space-y-4">
                  {socialMediaCalendar.calendar?.map((day: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{day.date}</h4>
                        <Badge variant="outline">{day.posts.length} posts</Badge>
                      </div>
                      <div className="space-y-3">
                        {day.posts.map((post: any, pidx: number) => (
                          <div key={pidx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                            <div className="p-1 bg-white rounded">
                              {getPlatformIcon(post.platform)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 mb-1">{post.content}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">{post.optimalTime}</span>
                                <div className="flex flex-wrap gap-1">
                                  {post.hashtags.slice(0, 3).map((tag: string, tidx: number) => (
                                    <Badge key={tidx} variant="outline" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(post.content)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Generate a 7-day social media content calendar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
