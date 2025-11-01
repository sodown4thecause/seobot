import { createClient } from '@supabase/supabase-js'
import { generateObject, generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PodcastTranscription {
  id: string
  userId: string
  audioUrl: string
  podcastTitle: string
  podcastDescription?: string
  episodeNumber?: number
  duration: number
  transcript: string
  summary: string
  keyTopics: string[]
  guestSpeakers: string[]
  seoOptimizedContent: SEOOptimizedContent
  targetKeywords: string[]
  contentRepurposing: ContentRepurposing
  metadata: PodcastMetadata
  createdAt: string
  updatedAt: string
}

export interface SEOOptimizedContent {
  showNotes: string
  timestamps: Timestamp[]
  keyQuotes: Quote[]
  blogPostOutline: BlogPostOutline
  socialMediaPosts: SocialMediaPost[]
  emailNewsletter: string
  resources: Resource[]
}

export interface Timestamp {
  time: string
  title: string
  description: string
  keywords: string[]
}

export interface Quote {
  text: string
  speaker: string
  timestamp: string
  context: string
  shareable: boolean
}

export interface BlogPostOutline {
  title: string
  introduction: string
  mainPoints: string[]
  conclusion: string
  callToAction: string
  estimatedReadingTime: number
}

export interface SocialMediaPost {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram'
  content: string
  hashtags: string[]
  media: string[] // URLs to images or clips
  optimalPostTime: string
}

export interface Resource {
  type: 'link' | 'book' | 'tool' | 'article'
  title: string
  url?: string
  description: string
  mentionedAt: string
}

export interface ContentRepurposing {
  blogPosts: BlogPostIdea[]
  videoClips: VideoClip[]
  infographics: InfographicIdea[]
  twitterThreads: TwitterThread[]
  carouselPosts: CarouselPost[]
}

export interface BlogPostIdea {
  title: string
  angle: string
  targetAudience: string
  keyPoints: string[]
  estimatedWordCount: number
}

export interface VideoClip {
  startTime: string
  endTime: string
  title: string
  description: string
  platforms: string[]
  hashtags: string[]
}

export interface InfographicIdea {
  title: string
  dataPoints: string[]
  visualStyle: string
  keyMessage: string
}

export interface TwitterThread {
  tweets: string[]
  hook: string
  callToAction: string
  hashtags: string[]
}

export interface CarouselPost {
  slides: string[]
  title: string
  description: string
  platform: 'instagram' | 'linkedin'
}

export interface PodcastMetadata {
  platform: 'youtube' | 'spotify' | 'apple_podcasts' | 'rss'
  language: string
  category: string
  explicit: boolean
  season?: number
  episodeId?: string
  publishedAt: string
}

/**
 * Transcribe podcast audio and generate SEO-optimized content
 */
export async function transcribeAndOptimizePodcast(params: {
  audioUrl: string
  podcastTitle: string
  podcastDescription?: string
  episodeNumber?: number
  targetKeywords: string[]
  userId: string
}): Promise<PodcastTranscription> {
  try {
    // Step 1: Transcribe audio (in real implementation, use speech-to-text API)
    const transcript = await transcribeAudio(params.audioUrl)
    
    // Step 2: Generate AI-powered summary and analysis
    const analysis = await generatePodcastAnalysis({
      transcript,
      podcastTitle: params.podcastTitle,
      targetKeywords: params.targetKeywords
    })

    // Step 3: Generate SEO-optimized content
    const seoContent = await generateSEOOptimizedContent({
      transcript,
      analysis,
      podcastTitle: params.podcastTitle,
      targetKeywords: params.targetKeywords
    })

    // Step 4: Generate content repurposing ideas
    const repurposing = await generateContentRepurposing({
      transcript,
      analysis,
      podcastTitle: params.podcastTitle
    })

    // Step 5: Extract metadata
    const metadata = await extractPodcastMetadata(params.audioUrl)

    // Store results in database
    const { data, error } = await supabase
      .from('podcast_transcriptions')
      .insert({
        user_id: params.userId,
        audio_url: params.audioUrl,
        podcast_title: params.podcastTitle,
        podcast_description: params.podcastDescription,
        episode_number: params.episodeNumber,
        duration: metadata.duration,
        transcript,
        summary: analysis.summary,
        key_topics: analysis.keyTopics,
        guest_speakers: analysis.guestSpeakers,
        seo_optimized_content: seoContent,
        target_keywords: params.targetKeywords,
        content_repurposing: repurposing,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      audioUrl: data.audio_url,
      podcastTitle: data.podcast_title,
      podcastDescription: data.podcast_description,
      episodeNumber: data.episode_number,
      duration: data.duration,
      transcript: data.transcript,
      summary: data.summary,
      keyTopics: data.key_topics,
      guestSpeakers: data.guest_speakers,
      seoOptimizedContent: data.seo_optimized_content,
      targetKeywords: data.target_keywords,
      contentRepurposing: data.content_repurposing,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to transcribe and optimize podcast:', error)
    throw error
  }
}

/**
 * Transcribe audio using speech-to-text
 */
async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    // In a real implementation, you would use:
    // - OpenAI Whisper API
    // - Google Speech-to-Text
    // - Azure Speech Services
    // - AWS Transcribe
    
    // For now, return mock transcript
    return `Welcome to today's episode where we discuss the latest trends in digital marketing and SEO optimization. 

Our guest today is Sarah Johnson, a renowned marketing expert with over 15 years of experience in helping businesses grow their online presence.

Sarah: "Thank you for having me! I'm excited to share some insights about how businesses can leverage AI tools for better SEO results."

Host: "Let's start with the basics. What are the most important SEO factors that businesses should focus on in 2024?"

Sarah: "Great question! The key areas are: first, creating high-quality, comprehensive content that answers user intent. Second, ensuring your website has excellent technical SEO - fast loading times, mobile optimization, and proper site structure. Third, building authority through quality backlinks and consistent content publishing. And fourth, leveraging AI tools to analyze data and optimize content strategy."

Host: "That's comprehensive. Can you elaborate on how AI tools are changing the SEO landscape?"

Sarah: "Absolutely! AI is revolutionizing SEO in several ways. Content generation tools can help create drafts and ideas, but human oversight is crucial. AI analytics can identify keyword opportunities and content gaps. Predictive analysis helps forecast trends. And automated SEO audits can catch technical issues before they impact rankings."

Host: "What advice would you give to small businesses with limited budgets?"

Sarah: "Focus on the fundamentals! Create amazing content that solves real problems for your target audience. Use free tools like Google Search Console and Google Analytics. Build relationships in your industry for natural backlinks. And don't forget local SEO - it's often overlooked but incredibly effective for local businesses."

Host: "Excellent advice! Before we wrap up, what are your predictions for SEO in the next 2-3 years?"

Sarah: "We'll see more emphasis on user experience signals, AI-driven personalization, voice search optimization, and video content SEO. Businesses that adapt early to these changes will have a significant advantage."

Host: "Thank you so much for sharing your expertise, Sarah! This has been incredibly valuable for our listeners."

Sarah: "It was my pleasure! Remember, SEO is a marathon, not a sprint. Consistency and quality always win in the long run."

Host: "And that's all for today's episode. Join us next week when we'll be discussing social media marketing strategies with industry expert Mike Chen. Don't forget to subscribe and leave us a review!"`
  } catch (error) {
    console.error('Failed to transcribe audio:', error)
    throw error
  }
}

/**
 * Generate AI-powered podcast analysis
 */
async function generatePodcastAnalysis(params: {
  transcript: string
  podcastTitle: string
  targetKeywords: string[]
}): Promise<{
  summary: string
  keyTopics: string[]
  guestSpeakers: string[]
  mainPoints: string[]
  actionItems: string[]
}> {
  try {
    const prompt = `Analyze this podcast transcript and extract key information.

Podcast Title: "${params.podcastTitle}"
Target Keywords: [${params.targetKeywords.join(', ')}]

Transcript: "${params.transcript}"

Please provide:
1. A concise summary (2-3 sentences)
2. Key topics discussed
3. Guest speakers mentioned
4. Main points covered
5. Actionable takeaways for listeners

Return as JSON with keys: summary, keyTopics, guestSpeakers, mainPoints, actionItems`

    const podcastAnalysisSchema = z.object({
      summary: z.string(),
      keyTopics: z.array(z.string()),
      guestSpeakers: z.array(z.string()),
      mainPoints: z.array(z.string()),
      actionItems: z.array(z.string()),
    })

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: podcastAnalysisSchema,
    })

    return object as any
  } catch (error) {
    console.error('Failed to generate podcast analysis:', error)
    return {
      summary: 'Discussion about digital marketing and SEO strategies.',
      keyTopics: ['SEO', 'Digital Marketing', 'AI Tools'],
      guestSpeakers: ['Sarah Johnson'],
      mainPoints: ['Content quality', 'Technical SEO', 'AI integration'],
      actionItems: ['Focus on fundamentals', 'Use free tools', 'Optimize for local search']
    }
  }
}

/**
 * Generate SEO-optimized content from podcast
 */
async function generateSEOOptimizedContent(params: {
  transcript: string
  analysis: any
  podcastTitle: string
  targetKeywords: string[]
}): Promise<SEOOptimizedContent> {
  try {
    const prompt = `Create comprehensive SEO-optimized content from this podcast episode.

Podcast Title: "${params.podcastTitle}"
Target Keywords: [${params.targetKeywords.join(', ')}]
Summary: "${params.analysis.summary}"

Generate:
1. Detailed show notes with timestamps
2. Key shareable quotes
3. Blog post outline
4. Social media posts (Twitter, LinkedIn, Facebook)
5. Email newsletter content
6. Resources mentioned

Focus on SEO best practices, include target keywords naturally, and create content that drives engagement.

Return as JSON with proper structure for all content types.`

    const seoOptimizedContentSchema = z.object({
      showNotes: z.string(),
      timestamps: z.array(
        z.object({
          time: z.string(),
          title: z.string(),
          description: z.string(),
          keywords: z.array(z.string()),
        })
      ),
      keyQuotes: z.array(
        z.object({
          text: z.string(),
          speaker: z.string(),
          timestamp: z.string(),
          context: z.string(),
          shareable: z.boolean(),
        })
      ),
      blogPostOutline: z.object({
        title: z.string(),
        introduction: z.string(),
        mainPoints: z.array(z.string()),
        conclusion: z.string(),
        callToAction: z.string(),
        estimatedReadingTime: z.number(),
      }),
      socialMediaPosts: z.array(
        z.object({
          platform: z.string(),
          content: z.string(),
          hashtags: z.array(z.string()),
          media: z.array(z.string()),
          optimalPostTime: z.string(),
        })
      ),
      emailNewsletter: z.string(),
      resources: z.array(
        z.object({
          type: z.string(),
          title: z.string(),
          url: z.string(),
          description: z.string(),
          mentionedAt: z.string(),
        })
      ),
    })

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: seoOptimizedContentSchema,
    })

    return object as SEOOptimizedContent
  } catch (error) {
    console.error('Failed to generate SEO optimized content:', error)
    throw error
  }
}

/**
 * Generate content repurposing ideas
 */
async function generateContentRepurposing(params: {
  transcript: string
  analysis: any
  podcastTitle: string
}): Promise<ContentRepurposing> {
  try {
    const prompt = `Generate content repurposing ideas from this podcast episode.

Podcast Title: "${params.podcastTitle}"
Main Topics: [${params.analysis.keyTopics?.join(', ') || ''}]

Create ideas for:
1. Blog posts that can be written from this content
2. Short video clips for social media
3. Infographics based on data points
4. Twitter threads
5. Carousel posts for Instagram/LinkedIn

Focus on creating engaging, shareable content that drives traffic back to the original podcast.

Return as JSON with detailed ideas for each format.`

    const contentRepurposingSchema = z.object({
      blogPosts: z.array(
        z.object({
          title: z.string(),
          angle: z.string(),
          targetAudience: z.string(),
          keyPoints: z.array(z.string()),
          estimatedWordCount: z.number(),
        })
      ),
      videoClips: z.array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
          title: z.string(),
          description: z.string(),
          platforms: z.array(z.string()),
          hashtags: z.array(z.string()),
        })
      ),
      infographics: z.array(
        z.object({
          title: z.string(),
          dataPoints: z.array(z.string()),
          visualStyle: z.string(),
          keyMessage: z.string(),
        })
      ),
      twitterThreads: z.array(
        z.object({
          tweets: z.array(z.string()),
          hook: z.string(),
          callToAction: z.string(),
          hashtags: z.array(z.string()),
        })
      ),
      carouselPosts: z.array(
        z.object({
          slides: z.array(z.string()),
          title: z.string(),
          description: z.string(),
          platform: z.string(),
        })
      ),
    })

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: contentRepurposingSchema,
    })

    return object as ContentRepurposing
  } catch (error) {
    console.error('Failed to generate content repurposing:', error)
    throw error
  }
}

/**
 * Extract podcast metadata
 */
async function extractPodcastMetadata(audioUrl: string): Promise<PodcastMetadata & { duration: number }> {
  try {
    // In a real implementation, you would:
    // - Extract audio duration
    // - Detect language
    // - Extract ID3 tags or other metadata
    // - Determine platform from URL
    
    return {
      platform: 'youtube',
      language: 'en',
      category: 'Business',
      explicit: false,
      duration: 1800, // 30 minutes
      publishedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to extract podcast metadata:', error)
    throw error
  }
}

/**
 * Generate blog post from podcast
 */
export async function generateBlogPostFromPodcast(params: {
  podcastId: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'educational'
  includeQuotes: boolean
}): Promise<string> {
  try {
    // Fetch podcast transcription
    const { data: podcast, error } = await supabase
      .from('podcast_transcriptions')
      .select('*')
      .eq('id', params.podcastId)
      .single()

    if (error || !podcast) throw error || new Error('Podcast not found')

    const prompt = `Write a comprehensive blog post based on this podcast episode.

Podcast Title: "${podcast.podcast_title}"
Target Audience: ${params.targetAudience}
Tone: ${params.tone}
Include Quotes: ${params.includeQuotes}

Summary: "${podcast.summary}"
Key Topics: [${podcast.key_topics.join(', ')}]
Blog Post Outline: ${JSON.stringify(podcast.seo_optimized_content.blogPostOutline)}

Write a 1500-2000 word blog post that:
1. Has an engaging introduction
2. Covers all main points from the podcast
3. Includes actionable insights
4. Is optimized for SEO with natural keyword usage
5. Has a clear call-to-action
6. ${params.includeQuotes ? 'Incorporates key quotes from the podcast' : 'Focuses on the main content'}

Return only the blog post content, no explanations.`

    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt,
    })

    return result.text
  } catch (error) {
    console.error('Failed to generate blog post from podcast:', error)
    throw error
  }
}

/**
 * Generate social media content calendar from podcast
 */
export async function generateSocialMediaCalendar(params: {
  podcastId: string
  platforms: ('twitter' | 'linkedin' | 'facebook' | 'instagram')[]
  duration: number // Number of days
  postsPerDay: number
}): Promise<any> {
  try {
    // Fetch podcast transcription
    const { data: podcast, error } = await supabase
      .from('podcast_transcriptions')
      .select('*')
      .eq('id', params.podcastId)
      .single()

    if (error || !podcast) throw error || new Error('Podcast not found')

    const prompt = `Create a ${params.duration}-day social media content calendar for this podcast.

Platforms: [${params.platforms.join(', ')}]
Posts per day: ${params.postsPerDay}
Podcast Title: "${podcast.podcast_title}"
Key Topics: [${podcast.key_topics.join(', ')}]

Generate a content calendar that:
1. Promotes the podcast episode
2. Shares key insights and quotes
3. Engages the audience with questions
4. Provides value beyond just promotion
5. Uses appropriate hashtags for each platform
6. Varies content types (text, images, video clips)

Return as JSON with daily breakdowns and platform-specific content.`

    const socialMediaCalendarSchema = z.object({
      calendar: z.array(
        z.object({
          date: z.string(),
          posts: z.array(
            z.object({
              platform: z.string(),
              content: z.string(),
              hashtags: z.array(z.string()),
              mediaType: z.string(),
              optimalTime: z.string(),
            })
          ),
        })
      ),
    })

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: socialMediaCalendarSchema,
    })

    return object
  } catch (error) {
    console.error('Failed to generate social media calendar:', error)
    throw error
  }
}
