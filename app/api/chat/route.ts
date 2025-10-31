import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { buildOnboardingSystemPrompt } from '@/lib/onboarding/prompts'
import { type OnboardingData, type OnboardingStep } from '@/lib/onboarding/state'
import { serverEnv } from '@/lib/config/env'
import { 
  findRelevantFrameworks, 
  formatFrameworksForPrompt,
  batchIncrementUsage 
} from '@/lib/ai/rag-service'
import { 
  dataForSEOFunctions, 
  handleDataForSEOFunctionCall 
} from '@/lib/ai/dataforseo-tools'

export const runtime = 'edge'

const genAI = new GoogleGenerativeAI(serverEnv.GOOGLE_API_KEY)

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface OnboardingContext {
  currentStep?: number
  data?: OnboardingData
}

interface ChatContext {
  page?: string
  onboarding?: OnboardingContext
  [key: string]: unknown
}

interface RequestBody {
  messages: ChatMessage[]
  context?: ChatContext
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody
    const { messages, context } = body
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Extract onboarding context if present
    const onboardingContext = context?.onboarding
    const isOnboarding = context?.page === 'onboarding'
    
    // RAG: Detect if query needs framework assistance
    const lastUserMessage = messages[messages.length - 1]?.content || ''
    const shouldUseRAG = detectFrameworkIntent(lastUserMessage)
    
    let retrievedFrameworks: string = ''
    let frameworkIds: string[] = []
    
    // RAG: Retrieve relevant frameworks if needed
    if (shouldUseRAG && !isOnboarding) {
      try {
        const ragStartTime = Date.now()
        const frameworks = await findRelevantFrameworks(lastUserMessage, {
          maxResults: 3,
        })
        
        if (frameworks.length > 0) {
          retrievedFrameworks = formatFrameworksForPrompt(frameworks)
          frameworkIds = frameworks.map(f => f.id)
          const ragDuration = Date.now() - ragStartTime
          console.log(`[Chat] RAG retrieved ${frameworks.length} frameworks in ${ragDuration}ms`)
        }
      } catch (error) {
        // Graceful degradation: continue without RAG if retrieval fails
        console.warn('[Chat] RAG retrieval failed, continuing without frameworks:', error)
      }
    }
    
    // Build system prompt based on context
    let systemPrompt: string
    if (isOnboarding && onboardingContext) {
      const currentStep = onboardingContext.currentStep || 1
      const onboardingData = onboardingContext.data || {}
      systemPrompt = buildOnboardingSystemPrompt(currentStep as OnboardingStep, onboardingData as OnboardingData)
    } else {
      systemPrompt = buildGeneralSystemPrompt(context, retrievedFrameworks)
    }

    // Format messages for Gemini
    const geminiMessages = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    // Add system prompt as first user message
    const allMessages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I\'m ready to help you with SEO and content optimization.' }] },
      ...geminiMessages,
    ]

    // Create Gemini model with DataForSEO function calling tools
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      tools: [{
        functionDeclarations: dataForSEOFunctions as any
      }]
    })
    
    const chat = model.startChat({
      history: allMessages.slice(0, -1),
    })

    const lastMessage = messages[messages.length - 1]
    
    // First, try to get response (may include function calls)
    const response = await chat.sendMessage(lastMessage.content)
    
    // Check if Gemini wants to call DataForSEO functions
    const functionCall = response.response.functionCalls?.()?.[0]
    
    if (functionCall) {
      console.log(`[Chat] Gemini calling function: ${functionCall.name}`, functionCall.args)
      
      // Execute the DataForSEO function
      const functionResult = await handleDataForSEOFunctionCall(
        functionCall.name,
        functionCall.args
      )
      
      console.log(`[Chat] Function result length: ${functionResult.length} chars`)
      
      // Send function result back to Gemini and get final response
      const finalResponse = await chat.sendMessageStream([{
        functionResponse: {
          name: functionCall.name,
          response: { result: functionResult }
        }
      }])
      
      // Stream the final response
      const stream = GoogleGenerativeAIStream(finalResponse)
      
      // Save messages and return
      if (user && !authError) {
        await saveChatMessages(supabase, user.id, messages, isOnboarding ? onboardingContext : undefined)
        if (isOnboarding && onboardingContext?.data && user.id) {
          await saveOnboardingProgress(supabase, user.id, onboardingContext.data)
        }
      }
      if (frameworkIds.length > 0) {
        batchIncrementUsage(frameworkIds).catch(err => 
          console.warn('[Chat] Failed to track framework usage:', err)
        )
      }
      
      return new StreamingTextResponse(stream)
    }
    
    // No function call - stream normal response
    const result = await chat.sendMessageStream(lastMessage.content)
    const stream = GoogleGenerativeAIStream(result)

    // Save messages to chat history (if user is authenticated)
    if (user && !authError) {
      await saveChatMessages(supabase, user.id, messages, isOnboarding ? onboardingContext : undefined)
      
      // If onboarding, save partial data to business_profiles
      if (isOnboarding && onboardingContext?.data && user.id) {
        await saveOnboardingProgress(supabase, user.id, onboardingContext.data)
      }
    }
    
    // RAG: Track framework usage (fire-and-forget)
    if (frameworkIds.length > 0) {
      batchIncrementUsage(frameworkIds).catch(err => 
        console.warn('[Chat] Failed to track framework usage:', err)
      )
    }

    return new StreamingTextResponse(stream)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Chat API error:', err)
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Detect if user's query should trigger RAG framework retrieval
 */
function detectFrameworkIntent(message: string): boolean {
  const messageLower = message.toLowerCase()
  
  // Action keywords indicating content creation
  const actionKeywords = [
    'write', 'create', 'generate', 'draft', 'compose',
    'build', 'make', 'develop', 'produce', 'craft'
  ]
  
  // Content type keywords
  const contentTypes = [
    'blog post', 'article', 'landing page', 'email',
    'ad', 'social post', 'tweet', 'copy', 'content',
    'headline', 'title', 'description', 'snippet'
  ]
  
  // Framework-specific keywords
  const frameworkKeywords = [
    'structure', 'framework', 'template', 'format',
    'outline', 'organize', 'layout', 'pattern'
  ]
  
  // SEO-specific keywords
  const seoKeywords = [
    'seo', 'optimize', 'rank', 'serp', 'meta',
    'keywords', 'snippet', 'schema', 'featured',
    'paa', 'people also ask', 'header', 'h1', 'h2'
  ]
  
  // Check if message contains relevant keywords
  const hasActionKeyword = actionKeywords.some(kw => messageLower.includes(kw))
  const hasContentType = contentTypes.some(kw => messageLower.includes(kw))
  const hasFrameworkKeyword = frameworkKeywords.some(kw => messageLower.includes(kw))
  const hasSeoKeyword = seoKeywords.some(kw => messageLower.includes(kw))
  
  // Trigger RAG if:
  // - Action keyword + content type ("write a blog post")
  // - Framework keyword ("what structure should I use")
  // - Action keyword + SEO keyword ("optimize my title")
  return (
    (hasActionKeyword && hasContentType) ||
    hasFrameworkKeyword ||
    (hasActionKeyword && hasSeoKeyword)
  )
}

function buildGeneralSystemPrompt(context?: ChatContext, ragFrameworks?: string): string {
  const basePrompt = `You are an expert SEO assistant helping users improve their search rankings and create optimized content. You are friendly, professional, and provide actionable advice.

Your capabilities include:
- Analyzing websites and competitors
- Finding keyword opportunities
- Creating SEO-optimized content
- Providing strategic recommendations
- Guiding users through setup processes

Be conversational and helpful. Ask clarifying questions when needed. Keep responses concise but informative.`

  let prompt = basePrompt
  
  // Inject RAG frameworks if available
  if (ragFrameworks && ragFrameworks.length > 0) {
    prompt += '\n\n' + ragFrameworks
  }
  
  if (context) {
    prompt += `\n\nCurrent Context: ${JSON.stringify(context)}`
  }

  return prompt
}

async function saveChatMessages(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  messages: ChatMessage[],
  onboardingContext?: OnboardingContext
) {
  try {
    const lastMessage = messages[messages.length - 1]
    const chatMessage = {
      user_id: userId,
      role: lastMessage.role,
      content: lastMessage.content,
      metadata: onboardingContext ? { onboarding: onboardingContext } : {},
    }

    await supabase.from('chat_messages').insert(chatMessage)
  } catch (error) {
    console.error('Error saving chat messages:', error)
  }
}

async function saveOnboardingProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: OnboardingData
) {
  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    const profileData: Record<string, unknown> = {
      user_id: userId,
      website_url: data.websiteUrl || null,
      industry: data.industry || null,
      goals: data.goals || null,
      locations: data.location ? [data.location] : null,
      content_frequency: data.contentFrequency || null,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      await supabase
        .from('business_profiles')
        .update(profileData)
        .eq('user_id', userId)
    } else {
      await supabase
        .from('business_profiles')
        .insert(profileData)
    }
  } catch (error) {
    console.error('Error saving onboarding progress:', error)
  }
}
