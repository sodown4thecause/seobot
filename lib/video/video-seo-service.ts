import { createClient } from '@supabase/supabase-js'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface VideoSEOData {
  id: string
  userId: string
  videoUrl: string
  videoTitle: string
  videoDescription: string
  tags: string[]
  thumbnailUrl?: string
  duration: number
  transcript?: string
  seoScore: number
  optimizationSuggestions: VideoOptimizationSuggestion[]
  targetKeywords: string[]
  competitorAnalysis: VideoCompetitorAnalysis
  metadata: VideoMetadata
  createdAt: string
  updatedAt: string
}

export interface VideoOptimizationSuggestion {
  type: 'title' | 'description' | 'tags' | 'thumbnail' | 'transcript' | 'chapters'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  currentValue?: string
  suggestedValue?: string
  impact: number
  reasoning: string
}

export interface VideoCompetitorAnalysis {
  topVideos: CompetitorVideo[]
  averageViews: number
  averageEngagement: number
  commonKeywords: string[]
  contentGaps: string[]
  thumbnailAnalysis: ThumbnailAnalysis
}

export interface CompetitorVideo {
  videoId: string
  title: string
  channel: string
  views: number
  likes: number
  engagementRate: number
  tags: string[]
  thumbnailUrl: string
  publishedAt: string
}

export interface ThumbnailAnalysis {
  colorSchemes: string[]
  textOverlays: boolean
  faceDetection: boolean
  emotionalAppeal: string
  readabilityScore: number
  recommendations: string[]
}

export interface VideoMetadata {
  platform: 'youtube' | 'vimeo' | 'tiktok' | 'instagram'
  videoId: string
  channelName?: string
  subscriberCount?: number
  category: string
  language: string
  ageRestriction: boolean
  commentsEnabled: boolean
  monetization: boolean
}

/**
 * Analyze video for SEO optimization
 */
export async function analyzeVideoSEO(params: {
  videoUrl: string
  targetKeywords: string[]
  userId: string
  transcript?: string
}): Promise<VideoSEOData> {
  try {
    // Extract video metadata from URL
    const videoMetadata = await extractVideoMetadata(params.videoUrl)
    
    // Generate AI-powered optimization suggestions
    const optimizationSuggestions = await generateVideoOptimizationSuggestions({
      videoMetadata,
      targetKeywords: params.targetKeywords,
      transcript: params.transcript
    })

    // Analyze competitors
    const competitorAnalysis = await analyzeVideoCompetitors(
      videoMetadata,
      params.targetKeywords
    )

    // Calculate SEO score
    const seoScore = calculateVideoSEOScore(
      videoMetadata,
      optimizationSuggestions,
      competitorAnalysis
    )

    // Store analysis results
    const { data, error } = await supabase
      .from('video_seo_analysis')
      .insert({
        user_id: params.userId,
        video_url: params.videoUrl,
        video_title: videoMetadata.title,
        video_description: videoMetadata.description,
        tags: videoMetadata.tags,
        thumbnail_url: videoMetadata.thumbnailUrl,
        duration: videoMetadata.duration,
        transcript: params.transcript,
        seo_score: seoScore,
        optimization_suggestions: optimizationSuggestions,
        target_keywords: params.targetKeywords,
        competitor_analysis: competitorAnalysis,
        metadata: videoMetadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      videoUrl: data.video_url,
      videoTitle: data.video_title,
      videoDescription: data.video_description,
      tags: data.tags,
      thumbnailUrl: data.thumbnail_url,
      duration: data.duration,
      transcript: data.transcript,
      seoScore: data.seo_score,
      optimizationSuggestions: data.optimization_suggestions,
      targetKeywords: data.target_keywords,
      competitorAnalysis: data.competitor_analysis,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to analyze video SEO:', error)
    throw error
  }
}

/**
 * Extract video metadata from URL
 */
async function extractVideoMetadata(videoUrl: string): Promise<VideoMetadata & {
  title: string
  description: string
  tags: string[]
  thumbnailUrl: string
  duration: number
}> {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl)
    const platform = detectVideoPlatform(videoUrl)

    if (platform === 'youtube') {
      return await extractYouTubeMetadata(videoId)
    } else if (platform === 'vimeo') {
      return await extractVimeoMetadata(videoId)
    } else {
      throw new Error(`Unsupported platform: ${platform}`)
    }
  } catch (error) {
    console.error('Failed to extract video metadata:', error)
    throw error
  }
}

/**
 * Generate AI-powered optimization suggestions
 */
async function generateVideoOptimizationSuggestions(params: {
  videoMetadata: any
  targetKeywords: string[]
  transcript?: string
}): Promise<VideoOptimizationSuggestion[]> {
  try {
    const prompt = `Analyze this video for SEO optimization opportunities.

Video Title: "${params.videoMetadata.title}"
Video Description: "${params.videoMetadata.description?.substring(0, 500)}..."
Current Tags: [${params.videoMetadata.tags?.join(', ') || 'none'}]
Target Keywords: [${params.targetKeywords.join(', ')}]
${params.transcript ? `Transcript: "${params.transcript.substring(0, 1000)}..."` : ''}

Provide specific optimization suggestions for:
1. Title optimization (include target keywords naturally)
2. Description improvement (add value, keywords, CTAs)
3. Tag optimization (relevant, high-volume tags)
4. Thumbnail recommendations
5. Transcript optimization
6. Chapter/timestamp suggestions

For each suggestion, include:
- Type of optimization
- Priority level (high/medium/low)
- Specific recommendation
- Expected impact (1-10)
- Reasoning

Return as JSON array of suggestions.`

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            priority: { type: 'string' },
            suggestion: { type: 'string' },
            currentValue: { type: 'string' },
            suggestedValue: { type: 'string' },
            impact: { type: 'number' },
            reasoning: { type: 'string' }
          }
        }
      }
    })

    return object as VideoOptimizationSuggestion[]
  } catch (error) {
    console.error('Failed to generate optimization suggestions:', error)
    return []
  }
}

/**
 * Analyze competitor videos
 */
async function analyzeVideoCompetitors(
  videoMetadata: any,
  targetKeywords: string[]
): Promise<VideoCompetitorAnalysis> {
  try {
    // In a real implementation, you would:
    // 1. Use YouTube Data API to search for competing videos
    // 2. Analyze their metadata, engagement, thumbnails
    // 3. Extract common patterns and keywords
    // 4. Identify content gaps

    // For now, return mock data
    return {
      topVideos: [
        {
          videoId: 'competitor1',
          title: 'Complete Guide to SEO Optimization',
          channel: 'SEO Expert',
          views: 125000,
          likes: 8500,
          engagementRate: 6.8,
          tags: ['seo', 'optimization', 'marketing', 'tutorial'],
          thumbnailUrl: 'https://example.com/thumb1.jpg',
          publishedAt: '2024-01-15'
        },
        {
          videoId: 'competitor2',
          title: 'SEO Tips for Beginners',
          channel: 'Marketing Pro',
          views: 98000,
          likes: 6200,
          engagementRate: 6.3,
          tags: ['seo', 'beginners', 'tips', 'marketing'],
          thumbnailUrl: 'https://example.com/thumb2.jpg',
          publishedAt: '2024-01-20'
        }
      ],
      averageViews: 111500,
      averageEngagement: 6.55,
      commonKeywords: ['seo', 'optimization', 'marketing', 'tutorial'],
      contentGaps: ['advanced techniques', 'case studies', 'tool comparisons'],
      thumbnailAnalysis: {
        colorSchemes: ['blue-orange', 'dark-background', 'high-contrast'],
        textOverlays: true,
        faceDetection: false,
        emotionalAppeal: 'professional',
        readabilityScore: 8.5,
        recommendations: [
          'Add high-contrast text overlay',
          'Use blue-orange color scheme',
          'Include professional thumbnail'
        ]
      }
    }
  } catch (error) {
    console.error('Failed to analyze competitors:', error)
    throw error
  }
}

/**
 * Calculate video SEO score
 */
function calculateVideoSEOScore(
  videoMetadata: any,
  suggestions: VideoOptimizationSuggestion[],
  competitorAnalysis: VideoCompetitorAnalysis
): number {
  let score = 0

  // Title optimization (30 points)
  const titleScore = calculateTitleScore(videoMetadata.title)
  score += titleScore * 0.3

  // Description optimization (25 points)
  const descriptionScore = calculateDescriptionScore(videoMetadata.description)
  score += descriptionScore * 0.25

  // Tag optimization (20 points)
  const tagScore = calculateTagScore(videoMetadata.tags)
  score += tagScore * 0.2

  // Metadata completeness (15 points)
  const metadataScore = calculateMetadataScore(videoMetadata)
  score += metadataScore * 0.15

  // Competitive positioning (10 points)
  const competitiveScore = calculateCompetitiveScore(videoMetadata, competitorAnalysis)
  score += competitiveScore * 0.1

  return Math.round(score)
}

/**
 * Generate optimized title suggestions
 */
export async function generateTitleSuggestions(params: {
  currentTitle: string
  targetKeywords: string[]
  videoTopic: string
  audience: string
}): Promise<string[]> {
  try {
    const prompt = `Generate 5 optimized YouTube titles for this video.

Current Title: "${params.currentTitle}"
Target Keywords: [${params.targetKeywords.join(', ')}]
Video Topic: ${params.videoTopic}
Target Audience: ${params.audience}

Requirements:
1. Include primary target keyword naturally
2. Be 60 characters or less
3. Create curiosity and value
4. Use numbers or emotional triggers when appropriate
5. Follow YouTube best practices

Return only the titles as a JSON array, no explanations.`

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: {
        type: 'array',
        items: { type: 'string' }
      }
    })

    return object as string[]
  } catch (error) {
    console.error('Failed to generate title suggestions:', error)
    return []
  }
}

/**
 * Generate optimized description
 */
export async function generateDescriptionOptimization(params: {
  currentDescription: string
  targetKeywords: string[]
  videoTitle: string
  callToAction?: string
}): Promise<string> {
  try {
    const prompt = `Optimize this YouTube video description for maximum SEO impact and engagement.

Current Description: "${params.currentDescription}"
Video Title: "${params.videoTitle}"
Target Keywords: [${params.targetKeywords.join(', ')}]
${params.callToAction ? `Call to Action: ${params.callToAction}` : ''}

Create an optimized description that:
1. Naturally incorporates target keywords
2. Provides value and context
3. Includes timestamps/chapters
4. Has a clear call to action
5. Uses relevant hashtags
6. Is structured for readability
7. Follows YouTube SEO best practices

Return only the optimized description, no explanations.`

    const { text } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: { type: 'string' }
    })

    return text as string
  } catch (error) {
    console.error('Failed to generate description optimization:', error)
    return params.currentDescription
  }
}

/**
 * Generate optimal tags
 */
export async function generateOptimalTags(params: {
  videoTitle: string
  videoDescription: string
  targetKeywords: string[]
  competitorTags?: string[]
}): Promise<string[]> {
  try {
    const prompt = `Generate 15-20 optimal YouTube tags for this video.

Video Title: "${params.videoTitle}"
Video Description: "${params.videoDescription.substring(0, 500)}..."
Target Keywords: [${params.targetKeywords.join(', ')}]
${params.competitorTags ? `Competitor Tags: [${params.competitorTags.join(', ')}]` : ''}

Include:
1. Primary target keywords
2. Secondary keywords and variations
3. Broad category tags
4. Specific niche tags
5. Long-tail keyword tags
6. Tags from successful competitor videos

Return only the tags as a JSON array, no explanations.`

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: {
        type: 'array',
        items: { type: 'string' }
      }
    })

    return object as string[]
  } catch (error) {
    console.error('Failed to generate optimal tags:', error)
    return params.targetKeywords
  }
}

// Helper functions
function extractVideoId(url: string): string {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const vimeoRegex = /vimeo\.com\/(\d+)/
  
  const youtubeMatch = url.match(youtubeRegex)
  if (youtubeMatch) return youtubeMatch[1]
  
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch) return vimeoMatch[1]
  
  throw new Error('Invalid video URL')
}

function detectVideoPlatform(url: string): 'youtube' | 'vimeo' | 'tiktok' | 'instagram' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('vimeo.com')) return 'vimeo'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com')) return 'instagram'
  throw new Error('Unsupported video platform')
}

async function extractYouTubeMetadata(videoId: string): Promise<any> {
  // In a real implementation, you would use YouTube Data API
  // For now, return mock data
  return {
    platform: 'youtube',
    videoId,
    title: 'How to Optimize Your Videos for SEO',
    description: 'Learn the best practices for optimizing your YouTube videos to increase visibility and engagement.',
    tags: ['seo', 'youtube', 'video optimization', 'marketing'],
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    duration: 480, // 8 minutes
    channelName: 'SEO Channel',
    subscriberCount: 50000,
    category: 'Education',
    language: 'en',
    ageRestriction: false,
    commentsEnabled: true,
    monetization: true
  }
}

async function extractVimeoMetadata(videoId: string): Promise<any> {
  // Similar implementation for Vimeo
  throw new Error('Vimeo extraction not implemented yet')
}

function calculateTitleScore(title: string): number {
  let score = 0
  
  // Length check (ideal: 50-60 characters)
  if (title.length >= 50 && title.length <= 60) score += 20
  else if (title.length >= 40 && title.length <= 70) score += 15
  else if (title.length >= 30 && title.length <= 80) score += 10
  else score += 5
  
  // Keyword presence (mock check)
  if (title.toLowerCase().includes('seo')) score += 30
  if (title.toLowerCase().includes('optimization')) score += 20
  if (/\d+/.test(title)) score += 10 // Numbers in title
  
  // Engagement elements
  if (title.includes('?') || title.includes('!')) score += 10
  if (title.toLowerCase().includes('how to') || title.toLowerCase().includes('guide')) score += 10
  
  return Math.min(100, score)
}

function calculateDescriptionScore(description: string): number {
  let score = 0
  
  // Length check (ideal: 200-300 words)
  const wordCount = description.split(' ').length
  if (wordCount >= 200 && wordCount <= 300) score += 30
  else if (wordCount >= 150 && wordCount <= 400) score += 20
  else if (wordCount >= 100) score += 10
  
  // Keyword presence
  if (description.toLowerCase().includes('seo')) score += 20
  if (description.toLowerCase().includes('optimization')) score += 15
  
  // Structure elements
  if (description.includes('\n')) score += 10 // Paragraphs
  if (description.includes('http')) score += 10 // Links
  if (description.includes('#')) score += 10 // Hashtags
  
  return Math.min(100, score)
}

function calculateTagScore(tags: string[]): number {
  if (!tags || tags.length === 0) return 0
  
  let score = 0
  
  // Tag count (ideal: 10-15 tags)
  if (tags.length >= 10 && tags.length <= 15) score += 40
  else if (tags.length >= 5 && tags.length <= 20) score += 30
  else if (tags.length >= 3) score += 20
  
  // Keyword relevance
  const relevantTags = tags.filter(tag => 
    tag.toLowerCase().includes('seo') || 
    tag.toLowerCase().includes('optimization') ||
    tag.toLowerCase().includes('youtube')
  )
  score += relevantTags.length * 10
  
  return Math.min(100, score)
}

function calculateMetadataScore(metadata: any): number {
  let score = 0
  
  if (metadata.thumbnailUrl) score += 30
  if (metadata.category) score += 20
  if (metadata.language) score += 15
  if (metadata.commentsEnabled) score += 15
  if (metadata.monetization) score += 20
  
  return Math.min(100, score)
}

function calculateCompetitiveScore(videoMetadata: any, competitorAnalysis: VideoCompetitorAnalysis): number {
  // Mock competitive scoring based on competitor analysis
  let score = 50 // Base score
  
  // Title uniqueness
  const uniqueTitle = !competitorAnalysis.topVideos.some(video => 
    video.title.toLowerCase().includes(videoMetadata.title.toLowerCase().split(' ')[0])
  )
  if (uniqueTitle) score += 20
  
  // Tag differentiation
  const uniqueTags = videoMetadata.tags?.filter((tag: string) => 
    !competitorAnalysis.commonKeywords.includes(tag.toLowerCase())
  ).length || 0
  score += Math.min(30, uniqueTags * 5)
  
  return Math.min(100, score)
}
