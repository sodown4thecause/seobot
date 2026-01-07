'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState, forwardRef, useMemo, useCallback, useRef } from 'react'

import { Terminal, Check, Copy, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ChatInput } from '@/components/chat/chat-input'
import { renderMessageComponent } from './message-types'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Logo } from '@/components/ui/logo'
import { ProactiveSuggestions } from '@/components/chat/proactive-suggestions'
import type { ProactiveSuggestion } from '@/lib/proactive/types'

// AI Elements Imports
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageAvatar, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import { Loader } from '@/components/ai-elements/loader'
import { Shimmer } from '@/components/ai-elements/shimmer'

interface AIChatInterfaceProps {
  context?: Record<string, unknown>
  className?: string
  placeholder?: string
  onComponentSubmit?: (component: string, data: any) => void
  initialMessage?: string
  conversationId?: string
  agentId?: string
  autoSendMessage?: string // For workflow prompts that should be sent automatically
}

const formatToolName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ... ToolInvocation Component (Keeping it as is for functionality) ...
const ToolInvocation = ({ toolCall, onComponentSubmit }: { toolCall: any, onComponentSubmit: (data: any) => void }) => {
  const { toolName, args, state, result } = toolCall
  const isLoading = state !== 'result'
  const isSuccess = state === 'result'
  const [isOpen, setIsOpen] = useState(false)

  if (toolName === 'client_ui') {
    const componentData = {
      component: args.component,
      props: args.props || {}
    }
    return (
      <div className="mt-4 w-full">
        {renderMessageComponent(componentData, onComponentSubmit)}
      </div>
    )
  }

  // Special handling for image generation tool
  // Note: Images from gateway_image are now primarily displayed in renderMessageContent
  // This component is kept for fallback or when tool invocation is shown separately
  if (toolName === 'gateway_image' && isSuccess && result) {
    const imageUrls: string[] = []

    // Extract from files array (primary source)
    if (Array.isArray(result.files)) {
      result.files.forEach((f: any) => {
        if (f.url) imageUrls.push(f.url)
        if (f.dataUrl && !imageUrls.includes(f.dataUrl)) imageUrls.push(f.dataUrl)
      })
    }

    // Extract from parts array
    if (Array.isArray(result.parts)) {
      result.parts.forEach((p: any) => {
        if (p.type === 'file' && p.url && !imageUrls.includes(p.url)) {
          imageUrls.push(p.url)
        }
      })
    }

    // Legacy fields and direct properties
    if (result.url) imageUrls.push(result.url)
    if (result.imageUrl && result.imageUrl !== result.url) imageUrls.push(result.imageUrl)
    if (result.dataUrl && !imageUrls.includes(result.dataUrl)) imageUrls.push(result.dataUrl)
    // Add base64 support if no URL is available
    if (imageUrls.length === 0 && result.base64) {
      const mime = result.mediaType || result.mimeType || 'image/png';
      imageUrls.push(`data:${mime};base64,${result.base64}`);
    }

    const uniqueUrls = [...new Set(imageUrls)]

    if (uniqueUrls.length > 0) {
      return (
        <div className="my-3">
          <div className="grid grid-cols-1 gap-3">
            {uniqueUrls.map((url, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={args.prompt || 'Generated image'} className="w-full h-auto object-contain max-h-[500px]" loading="lazy" />
                {args.prompt && (
                  <div className="p-3 border-t border-white/5 bg-black/20">
                    <p className="text-xs text-zinc-400 truncate">{args.prompt}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (result.status === 'error' || result.errorMessage) {
      return (
        <div className="my-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-300">Failed to generate image: {result.errorMessage || 'Unknown error'}</p>
        </div>
      )
    }
  }

  return (
    <div className={cn(
      "glass-card rounded-xl my-2 overflow-hidden transition-all",
      isSuccess ? "border-white/10" : "border-white/5",
      isLoading && "animate-pulse border-indigo-500/30"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center",
              isLoading ? "bg-indigo-500/10 text-indigo-400" : "bg-zinc-800/50 text-zinc-400"
            )}>
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Terminal className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-sm font-medium text-zinc-200">
              {formatToolName(toolName)}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                isLoading ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/15 text-emerald-200"
              )}
            >
              {isLoading ? 'Running' : 'Completed'}
            </span>
          </div>
          <CollapsibleTrigger asChild>
            <button className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="border-t border-white/5 p-3 space-y-3 bg-black/20">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Input</div>
              <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono overflow-x-auto">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
            </div>
            {result && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Output</div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/5 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

const ToolPartInvocation = ({
  toolName,
  toolCallId,
  state,
  input,
  output,
}: {
  toolName: string
  toolCallId?: string
  state?: string
  input?: any
  output?: any
}) => {
  const isLoading = state !== 'output-available' && state !== 'result'
  const isSuccess = !isLoading
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={cn(
        'glass-card rounded-xl my-2 overflow-hidden transition-all',
        isSuccess ? 'border-white/10' : 'border-white/5',
        isLoading && 'animate-pulse border-indigo-500/30'
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center',
                isLoading ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800/50 text-zinc-400'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Terminal className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-sm font-medium text-zinc-200">{formatToolName(toolName)}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                isLoading ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'
              )}
            >
              {isLoading ? 'Running' : 'Completed'}
            </span>
          </div>
          <CollapsibleTrigger asChild>
            <button className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="border-t border-white/5 p-3 space-y-3 bg-black/20">
            {input !== undefined && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Input</div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                  <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono overflow-x-auto">
                    {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {output !== undefined && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Output</div>
                <div className="bg-black/40 rounded-lg p-2 border border-white/5 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                    {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {!isLoading && output === undefined && (
              <div className="text-xs text-zinc-500">No output returned for this tool call.</div>
            )}
            {toolCallId && (
              <div className="text-[10px] text-zinc-600 font-mono">{toolCallId}</div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

type SourceItem = {
  title?: string
  url?: string
  description?: string
}

type PlanStep = {
  title?: string
  description?: string
  status?: string
}

const SourcesList = ({ sources }: { sources: SourceItem[] }) => (
  <div className="mt-3 rounded-2xl border border-white/5 bg-black/30 p-3 text-xs text-zinc-400">
    <p className="mb-2 text-sm font-semibold text-zinc-100">Sources</p>
    <ul className="space-y-2">
      {sources.map((source, index) => (
        <li key={`${source.url ?? source.title ?? index}-${index}`} className="flex flex-col gap-1">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-300 hover:text-blue-200 font-medium"
            >
              {source.title || source.url}
            </a>
          ) : (
            <span className="text-zinc-100 font-medium">
              {source.title || `Source ${index + 1}`}
            </span>
          )}
          {source.description && (
            <span className="text-zinc-500">{source.description}</span>
          )}
        </li>
      ))}
    </ul>
  </div>
)

const PlanList = ({ steps }: { steps: PlanStep[] }) => (
  <div className="mt-3 rounded-2xl border border-white/5 bg-black/30 p-3 text-xs text-zinc-400">
    <p className="mb-2 text-sm font-semibold text-zinc-100">Suggested plan</p>
    <ol className="space-y-2">
      {steps.map((step, index) => (
        <li key={`${step.title ?? step.description ?? index}-${index}`} className="flex items-start gap-2">
          <span className="mt-0.5 text-[11px] text-zinc-600">{index + 1}.</span>
          <div className="space-y-1">
            <p className="text-zinc-100 font-medium">
              {step.title || step.description || `Step ${index + 1}`}
            </p>
            {step.description && step.title && (
              <span className="text-zinc-500">{step.description}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  </div>
)

const getMessageText = (message: any): string => {
  if (typeof message.content === 'string' && message.content.trim().length > 0) {
    return message.content
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
      .map((part: any) => part.text)
      .join('')
  }

  return ''
}

const extractSources = (message: any): SourceItem[] => {
  const sources =
    message.sources ||
    message.metadata?.sources ||
    message.metadata?.citations ||
    []

  if (!Array.isArray(sources)) return []

  return sources
    .map((source: any): SourceItem | null => {
      if (typeof source === 'string') {
        return { url: source }
      }
      if (source && typeof source === 'object') {
        return {
          title: source.title ?? source.name,
          url: source.url ?? source.link,
          description: source.description ?? source.summary,
        }
      }
      return null
    })
    .filter((source): source is SourceItem => source !== null)
}

const extractPlanSteps = (message: any): PlanStep[] => {
  const plan = message.plan || message.metadata?.plan || message.metadata?.steps || []
  if (!Array.isArray(plan)) return []

  return plan.map((step: any) => {
    if (typeof step === 'string') {
      return { description: step }
    }
    if (step && typeof step === 'object') {
      return {
        title: step.title ?? step.name,
        description: step.description ?? step.detail,
        status: step.status,
      }
    }
    return { description: String(step) }
  })
}

const getMessageTimestamp = (message: any): string | null => {
  const timestamp = message.createdAt || message.created_at || message.timestamp
  if (!timestamp) return null
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  try {
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.warn('[AIChatInterface] Failed to format timestamp', error)
    return date.toLocaleString()
  }
}

const getMessageStatus = (message: any): { label: string; tone: 'neutral' | 'warning' | 'success' | 'error' } | null => {
  if (message.error) {
    return { label: 'Error', tone: 'error' }
  }
  const status = message.status || message.metadata?.status
  if (typeof status === 'string') {
    const normalized = status.toLowerCase()
    if (normalized.includes('error')) return { label: status, tone: 'error' }
    if (normalized.includes('progress') || normalized.includes('running')) {
      return { label: status, tone: 'warning' }
    }
    if (normalized.includes('done') || normalized.includes('complete')) {
      return { label: status, tone: 'success' }
    }
    return { label: status, tone: 'neutral' }
  }

  if (message.role === 'assistant' && Array.isArray(message.toolInvocations)) {
    const hasPending = message.toolInvocations.some((tool: any) => tool.state !== 'result')
    return hasPending
      ? { label: 'In progress', tone: 'warning' }
      : { label: 'Completed', tone: 'success' }
  }

  return null
}

export const AIChatInterface = forwardRef<HTMLDivElement, AIChatInterfaceProps>(({
  context: chatContext,
  className,
  placeholder = "Message AI Chat...",
  onComponentSubmit,
  initialMessage,
  conversationId: conversationIdProp,
  agentId: agentIdProp,
  autoSendMessage,
}, ref) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(conversationIdProp ?? null)
  // Start with false - the bootstrap effect will set to true when it starts
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([])
  const hasInitializedRef = useRef(false)
  const mountedRef = useRef(true)
  const lastLoadedConversationId = useRef<string | null>(null)
  const agentPreference = agentIdProp ?? (chatContext as any)?.agentId ?? 'general'
  const bootstrapTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bootstrapAbortControllerRef = useRef<AbortController | null>(null)
  const lastAutoSentMessage = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (bootstrapTimeoutRef.current) {
        clearTimeout(bootstrapTimeoutRef.current)
      }
      if (bootstrapAbortControllerRef.current) {
        bootstrapAbortControllerRef.current.abort()
      }
    }
  }, [])


  // Stabilize mergedContext by memoizing based on primitive dependencies
  // Extract primitive values from chatContext to avoid object reference instability
  const contextKey = useMemo(() => {
    if (!chatContext) return ''
    // Create a stable key from primitive values in chatContext
    const keys = Object.keys(chatContext).sort()
    return JSON.stringify(
      keys.reduce((acc, key) => {
        const value = (chatContext as any)[key]
        // Only include primitive values or serializable objects
        if (value === null || value === undefined) {
          acc[key] = value
        } else if (typeof value === 'object') {
          // For objects, include a stable representation
          acc[key] = JSON.stringify(value)
        } else {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>)
    )
  }, [chatContext])

  // mergedContext depends only on stable primitive values, not the chatContext object reference
  // This ensures it only recreates when actual values change, not when the object reference changes
  // When contextKey changes, we know the values changed, so we can safely use current chatContext
  const mergedContext = useMemo(
    () => ({
      ...(chatContext || {}),
      agentId: agentPreference,
      conversationId,
    }),
    // Use contextKey (stable string) instead of chatContext (unstable object reference)
    // contextKey changes only when actual values change, making this dependency stable
    [contextKey, agentPreference, conversationId]
  )

  const statusToneClassMap: Record<'neutral' | 'warning' | 'success' | 'error', string> = {
    neutral: 'bg-white/10 text-zinc-200',
    warning: 'bg-amber-500/20 text-amber-200',
    success: 'bg-emerald-500/20 text-emerald-200',
    error: 'bg-rose-500/20 text-rose-200',
  }

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        chatId: conversationId,
        context: mergedContext,
      }),
    })
  }, [conversationId, mergedContext])

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
    stop,
    regenerate,
  } = useChat({
    id: conversationId ?? 'dashboard-chat',
    experimental_throttle: 32,
    transport,
    onError: (err) => {
      console.error('[useChat] Stream error:', err);
      console.error('[useChat] Error details:', {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
      });
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Fetch proactive suggestions after messages change (when not loading)
  const lastMessageRole = messages[messages.length - 1]?.role
  useEffect(() => {
    if (!conversationId || status !== 'ready' || lastMessageRole !== 'assistant') {
      return
    }

    // Fetch suggestions after assistant response
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/suggestions?conversationId=${conversationId}`)
        if (res.ok) {
          const data = await res.json()
          setProactiveSuggestions(data.suggestions || [])
        }
      } catch (err) {
        console.warn('[Chat] Failed to fetch suggestions:', err)
      }
    }

    fetchSuggestions()
  }, [conversationId, status, lastMessageRole])

  // Handler for sending a suggestion as a message
  const handleSubmit = useCallback((prompt: string) => {
    if (prompt.trim() && conversationId) {
      sendMessage({ text: prompt })
      setInput('')
    }
  }, [conversationId, sendMessage])

  const bootstrapConversation = useCallback(async (overrideConversationId?: string) => {
    setIsBootstrapping(true)
    setBootError(null)

    // Clear any existing timeout and abort controller
    if (bootstrapTimeoutRef.current) {
      clearTimeout(bootstrapTimeoutRef.current)
    }
    if (bootstrapAbortControllerRef.current) {
      bootstrapAbortControllerRef.current.abort()
    }

    // Create new abort controller for this bootstrap attempt
    bootstrapAbortControllerRef.current = new AbortController()
    const signal = bootstrapAbortControllerRef.current.signal

    // Set a safety timeout to prevent infinite loading
    const timeoutPromise = new Promise<'timeout'>((resolve) => {
      bootstrapTimeoutRef.current = setTimeout(() => {
        // Abort in-flight requests when timeout fires
        bootstrapAbortControllerRef.current?.abort()
        resolve('timeout')
      }, 8000)
    })

    const bootstrapPromise = (async () => {
      try {
        // Check if already aborted before starting
        if (signal.aborted) return 'aborted' as const
        if (overrideConversationId && mountedRef.current) {
          setMessages([])
        }

        let workingConversation = overrideConversationId
          ? { id: overrideConversationId }
          : null

        if (!workingConversation) {
          try {
            const latestResponse = await fetch('/api/conversations?limit=1', { signal })
            if (latestResponse.ok) {
              const latestPayload = await latestResponse.json()
              workingConversation = latestPayload?.conversations?.[0] ?? null
            }
          } catch (error) {
            if ((error as Error).name === 'AbortError') {
              return 'aborted' as const
            }
            console.warn('[AIChatInterface] Error loading conversations', error)
          }

          if (!workingConversation && !signal.aborted) {
            try {
              const createResponse = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: agentPreference }),
                signal,
              })
              if (createResponse.ok) {
                const createdPayload = await createResponse.json()
                workingConversation = createdPayload?.conversation ?? null
              }
            } catch (error) {
              if ((error as Error).name === 'AbortError') {
                return 'aborted' as const
              }
              console.warn('[AIChatInterface] Error creating conversation', error)
            }
          }
        }

        // If we have a conversation, load its history
        if (workingConversation?.id) {
          try {
            console.log('[AIChatInterface] Loading messages for conversation:', workingConversation.id)
            const historyResponse = await fetch(
              `/api/conversations/${workingConversation.id}/messages`,
              { signal }
            )
            if (historyResponse.ok) {
              const historyPayload = await historyResponse.json()
              let historyMessages = historyPayload?.messages ?? []
              console.log('[AIChatInterface] Loaded messages:', historyMessages.length)

              if (historyMessages.length === 0 && initialMessage && !overrideConversationId) {
                historyMessages = [
                  {
                    id: 'initial',
                    role: 'assistant',
                    content: initialMessage,
                    parts: [{ type: 'text', text: initialMessage }],
                  },
                ]
              }

              if (mountedRef.current && !signal.aborted) {
                setConversationId(workingConversation.id)
                setMessages(historyMessages)
                console.log('[AIChatInterface] Messages set successfully')
              }
            } else {
              console.warn('[AIChatInterface] Failed to load history, status:', historyResponse.status)
              if (mountedRef.current && !signal.aborted) {
                setConversationId(workingConversation.id)
                setMessages([])
              }
            }
          } catch (error) {
            if ((error as Error).name === 'AbortError') {
              return 'aborted' as const
            }
            console.warn('[AIChatInterface] Error loading history', error)
            if (mountedRef.current && !signal.aborted) {
              setConversationId(workingConversation.id)
              setMessages([])
            }
          }
        } else {
          console.log('[AIChatInterface] No conversation to load')
          if (mountedRef.current && !signal.aborted) {
            setConversationId(null)
            setMessages([])
          }
        }
        return 'success' as const
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return 'aborted' as const
        }
        console.error('[AIChatInterface] Failed to bootstrap chat', error)
        if (mountedRef.current && !signal.aborted) {
          setConversationId(null)
          setMessages([])
        }
        return 'error' as const
      }
    })()

    // Race between bootstrap and timeout
    const result = await Promise.race([bootstrapPromise, timeoutPromise])

    if (result === 'timeout') {
      console.warn('[AIChatInterface] Bootstrap timed out, allowing user to proceed')
      // Note: abort was already called in timeoutPromise
      if (mountedRef.current) {
        setConversationId(null)
        setMessages([])
      }
    }

    // Cleanup timeout and abort controller
    if (bootstrapTimeoutRef.current) {
      clearTimeout(bootstrapTimeoutRef.current)
      bootstrapTimeoutRef.current = null
    }
    bootstrapAbortControllerRef.current = null

    if (mountedRef.current && result !== 'aborted') {
      setIsBootstrapping(false)
    }
  }, [agentPreference, initialMessage, setMessages])

  // Sync conversationId from prop - this triggers useChat to switch conversations
  useEffect(() => {
    if (conversationIdProp !== undefined && conversationIdProp !== conversationId) {
      console.log('[AIChatInterface] Syncing conversationId from prop:', conversationIdProp)
      setConversationId(conversationIdProp)
    }
  }, [conversationIdProp, conversationId])

  // Load messages when conversationId state changes (after useChat has reinitialized)
  useEffect(() => {
    const loadMessagesForConversation = async (convId: string) => {
      setIsBootstrapping(true)
      try {
        console.log('[AIChatInterface] Loading messages for:', convId)
        const response = await fetch(`/api/conversations/${convId}/messages`)
        if (response.ok) {
          const data = await response.json()
          const historyMessages = data?.messages ?? []
          console.log('[AIChatInterface] Loaded', historyMessages.length, 'messages')
          if (mountedRef.current) {
            setMessages(historyMessages)
          }
        } else {
          console.error('[AIChatInterface] Failed to load messages, status:', response.status)
          // Clear messages on error but don't leave in stuck loading state
          if (mountedRef.current) {
            setMessages([])
          }
        }
      } catch (error) {
        console.error('[AIChatInterface] Error loading messages:', error)
        if (mountedRef.current) {
          setMessages([])
        }
      } finally {
        if (mountedRef.current) {
          setIsBootstrapping(false)
        }
      }
    }

    // Skip if we already loaded this specific conversation (but not if both are null)
    if (conversationId && lastLoadedConversationId.current === conversationId) {
      console.log('[AIChatInterface] Already loaded conversation:', conversationId)
      return
    }

    if (conversationId) {
      lastLoadedConversationId.current = conversationId
      loadMessagesForConversation(conversationId)
    } else if (!hasInitializedRef.current) {
      // First mount with no conversation - bootstrap to get/create one
      hasInitializedRef.current = true
      bootstrapConversation()
    } else {
      // Edge case: no conversationId but hasInitializedRef is true
      // This can happen after failed bootstrap attempts - clear state and let effect re-run
      console.log('[AIChatInterface] No conversation and already initialized, clearing stuck state')
      hasInitializedRef.current = false
      setIsBootstrapping(false)
    }
  }, [conversationId, setMessages, bootstrapConversation])

  const handleSendMessage = (data: { text: string }) => {
    if (!data.text.trim()) return

    // Allow sending even if conversationId is not yet set (will be created in background)
    // Only block if we're actively bootstrapping and have no conversationId
    if (isBootstrapping && !conversationId) {
      console.warn('[AIChatInterface] Still bootstrapping, message will be sent after conversation is ready')
      // Try to send anyway - the API will handle conversation creation
    }

    sendMessage({ text: data.text })
  }

  // Auto-send workflow messages when provided
  useEffect(() => {
    if (autoSendMessage && autoSendMessage !== lastAutoSentMessage.current && !isBootstrapping && status === 'ready') {
      lastAutoSentMessage.current = autoSendMessage
      // Small delay to ensure chat is ready
      setTimeout(() => {
        sendMessage({ text: autoSendMessage })
      }, 300)
    }
  }, [autoSendMessage, isBootstrapping, status, sendMessage])

  // ... Workflow and Component handling (Keeping as is) ...
  const handleComponentSubmit = (componentType: string, data: any) => {
    if (onComponentSubmit) {
      onComponentSubmit(componentType, data)
    }
    const message = formatComponentData(componentType, data)
    handleSendMessage({ text: message })
  }

  const formatComponentData = (componentType: string, data: any): string => {
    // Simplified for brevity, keeping logic
    return JSON.stringify(data)
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const lastAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const candidate = messages[index] as any
      if (candidate?.role === 'assistant') {
        return candidate.id
      }
    }
    return null
  }, [messages])

  const activeToolName = useMemo(() => {
    if (!isLoading) return null
    const lastMessage = messages[messages.length - 1] as any
    if (lastMessage?.role === 'assistant' && lastMessage.toolInvocations) {
      const active = lastMessage.toolInvocations.find((t: any) => t.state !== 'result')
      return active ? active.toolName : null
    }
    return null
  }, [messages, isLoading])

  const renderMessageContent = (message: any, textContent: string, isLastMessage: boolean = false) => {
    // AI SDK 6: Render by iterating over message.parts
    // Parts can be: text, file, tool-{toolName}, source-url, source-document, etc.
    const parts = message.parts || [];

    // Also check legacy toolInvocations for backward compatibility
    const toolInvocations = message.toolInvocations || [];

    // Collect images from various sources
    const imageSources: { src: string; alt?: string }[] = [];

    // 1. Extract images from file parts (AI SDK 6 native image generation)
    parts
      .filter((p: any) => p?.type === 'file' && p?.mediaType?.startsWith('image/') && p?.url)
      .forEach((p: any) => {
        imageSources.push({ src: p.url, alt: p.name || 'Generated image' });
      });

    // 2. Extract images from tool-gateway_image parts (our custom tool)
    parts
      .filter((p: any) => p?.type === 'tool-gateway_image' && p?.state === 'output-available')
      .forEach((p: any) => {
        const output = p.output;
        if (output?.url) imageSources.push({ src: output.url, alt: output.prompt || 'Generated image' });
        if (output?.imageUrl && output.imageUrl !== output.url) {
          imageSources.push({ src: output.imageUrl, alt: output.prompt || 'Generated image' });
        }
        if (Array.isArray(output?.files)) {
          output.files.forEach((f: any) => {
            if (f.url) imageSources.push({ src: f.url, alt: f.name || output.prompt || 'Generated image' });
          });
        }
      });

    // 3. Extract from legacy toolInvocations (for backward compatibility)
    toolInvocations
      .filter((t: any) => t.toolName === 'gateway_image' && t.state === 'result' && t.result)
      .forEach((t: any) => {
        const result = t.result;
        if (result.url) imageSources.push({ src: result.url, alt: result.prompt || 'Generated image' });
        if (result.imageUrl && result.imageUrl !== result.url) {
          imageSources.push({ src: result.imageUrl, alt: result.prompt || 'Generated image' });
        }
        if (Array.isArray(result.files)) {
          result.files.forEach((f: any) => {
            if (f.url) imageSources.push({ src: f.url, alt: f.name || result.prompt || 'Generated image' });
          });
        }
      });

    // 4. Extract from message.files (legacy)
    if (Array.isArray(message.files)) {
      message.files
        .filter((f: any) => f?.mediaType?.startsWith('image/') && (f.base64 || f.url || f.dataUrl))
        .forEach((f: any) => {
          const src = f.dataUrl || f.url || (f.base64 ? `data:${f.mediaType};base64,${f.base64}` : '');
          if (src) imageSources.push({ src, alt: f.name || 'Generated image' });
        });
    }

    // Deduplicate images by URL
    const uniqueImages = Array.from(new Set(imageSources.map(i => i.src)))
      .map(src => imageSources.find(i => i.src === src)!)
      .filter(img => img.src && !img.src.includes('undefined'));

    // Render function for parts
    const renderPart = (part: any, index: number) => {
      // Text parts
      if (part.type === 'text') {
        return null; // Text is handled separately via textContent
      }

      // File parts (native AI SDK 6 images)
      if (part.type === 'file' && part.mediaType?.startsWith('image/') && part.url) {
        // Already handled in imageSources above, skip to avoid duplicate
        return null;
      }

      // Tool parts - gateway_image
      if (part.type === 'tool-gateway_image') {
        // Already extracted images above, but show loading state if needed
        if (part.state === 'input-streaming' || part.state === 'input-available') {
          return (
            <div key={`tool-${part.toolCallId}-${index}`} className="my-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 text-indigo-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating image...</span>
              </div>
            </div>
          );
        }
        // output-available: image is already in imageSources
        return null;
      }

      // Generic tool parts (other tools)
      if (part.type?.startsWith('tool-')) {
        const toolName = part.type.replace('tool-', '');
        // Skip gateway_image as it's handled above
        if (toolName === 'gateway_image') return null;

        // For other tools, show a collapsed view
        if (part.state === 'output-available' || part.state === 'result') {
          return (
            <ToolPartInvocation
              key={`tool-${part.toolCallId || toolName}-${index}`}
              toolName={toolName}
              toolCallId={part.toolCallId}
              state={part.state}
              input={part.input ?? part.args}
              output={part.output ?? part.result}
            />
          );
        }
        if (part.state === 'input-streaming' || part.state === 'input-available') {
          return (
            <div key={`tool-${part.toolCallId}-${index}`} className="my-2 flex items-center gap-2 text-zinc-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">{formatToolName(toolName)}...</span>
            </div>
          );
        }
      }

      return null;
    };

    return (
      <>
        {/* Render images prominently at the top */}
        {uniqueImages.length > 0 && (
          <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {uniqueImages.map((img, idx) => (
              <div key={`img-${idx}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt || 'Generated image'}
                  className="w-full h-auto object-contain max-h-[500px]"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Render text content */}
        {textContent && (
          message.role === 'assistant' ? (
            <Response
              isStreaming={isLastMessage && isLoading}
              className="prose prose-invert prose-sm max-w-none text-zinc-100"
            >
              {textContent}
            </Response>
          ) : (
            <div className="whitespace-pre-wrap break-words text-zinc-200 text-[15px] leading-relaxed">
              {textContent}
            </div>
          )
        )}

        {/* Render non-text, non-image parts (tool states, etc) */}
        {parts.map((part: any, index: number) => renderPart(part, index))}

        {/* Legacy: Render tool invocations that aren't handled by parts */}
        {toolInvocations
          .filter((t: any) => t.toolName !== 'gateway_image') // gateway_image is handled above
          .map((toolCall: any) => (
            <ToolInvocation
              key={toolCall.toolCallId}
              toolCall={toolCall}
              onComponentSubmit={(data) => handleComponentSubmit(toolCall.args?.component, data)}
            />
          ))}
      </>
    );
  }


  if (isBootstrapping) {
    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading your chat workspace…</p>
        </div>
      </div>
    )
  }

  if (bootError) {
    return (
      <div className={cn('flex h-full items-center justify-center p-6', className)}>
        <div className="max-w-sm rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-200">{bootError}</p>
          <button
            onClick={() => bootstrapConversation(conversationIdProp)}
            className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // HERO VIEW (Empty State) - Clean, minimal style
  if (messages.length === 0) {
    const suggestions = [
      { title: 'Write an SEO-optimized blog post', prompt: 'Write a high-quality, SEO-optimized blog post about [topic]' },
      { title: 'Analyze my competitors', prompt: 'Analyze my top competitors and find content gaps' },
      { title: 'Generate content ideas', prompt: 'Generate 10 content ideas that will rank well for [keyword]' },
      { title: 'Improve my EEAT score', prompt: 'How can I improve my content for better EEAT (Experience, Expertise, Authoritativeness, Trustworthiness)?' },
    ]

    return (
      <div className={cn("flex flex-col h-full items-center justify-center p-8 relative bg-[#1a1a1a] font-chat", className)}>
        <div className="w-full max-w-4xl space-y-8">
          {/* Greeting - Clean and minimal */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-semibold text-zinc-100 tracking-tight">
              Flow Intent
            </h1>
            <p className="text-lg md:text-xl text-zinc-500">
              Your AI-powered SEO and content assistant
            </p>
          </div>

          {/* Input Area - Centered and prominent */}
          <div className="w-full max-w-3xl mx-auto">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => {
                if (input.trim() && !isLoading) {
                  handleSendMessage({ text: input })
                  setInput('')
                }
              }}
              disabled={isLoading}
              placeholder={placeholder}
              className="bg-transparent"
              onImageGenerate={() => {
                const prompt = input.trim() || 'a beautiful landscape'
                // Explicit instruction to use the gateway_image tool
                handleSendMessage({
                  text: `Please use the gateway_image tool to generate an image of: ${prompt}. Do not just describe the image - actually generate it using the tool.`
                })
                setInput('')
              }}
              onWebSearch={() => {
                const query = input.trim() || 'latest news'
                // Explicit instruction to use web search tools
                handleSendMessage({
                  text: `Please search the web for: ${query}. Use the perplexity_search or research_agent tool to find current information.`
                })
                setInput('')
              }}
            />
            {error && (
              <div className="mt-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                <p className="text-sm text-red-300/80">
                  {error.message || 'Something went wrong. Please try again.'}
                </p>
              </div>
            )}
            {bootError && (
              <div className="mt-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <p className="text-sm text-amber-300/80">{bootError}</p>
              </div>
            )}
          </div>

          {/* Suggestion Cards - Clean, minimal style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.title}
                onClick={() => {
                  if (isLoading) return
                  handleSendMessage({ text: suggestion.prompt })
                }}
                className="text-left p-4 rounded-xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/60 hover:border-white/10 transition-all group"
              >
                <p className="text-sm font-medium text-zinc-200 group-hover:text-white">
                  {suggestion.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ACTIVE CHAT VIEW - Clean, minimal style matching screenshot
  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-[#1a1a1a] font-chat", className)}>
      <Conversation>
        <ConversationContent>
          {messages.map((message: any) => {

            const messageText = getMessageText(message)
            const sources = extractSources(message)
            const planSteps = extractPlanSteps(message)
            const timestampLabel = getMessageTimestamp(message)
            const statusBadge = getMessageStatus(message)
            const isLastMessage = message.id === (messages[messages.length - 1] as any)?.id
            const canRegenerate =
              message.role === 'assistant' &&
              message.id === lastAssistantMessageId &&
              Boolean(regenerate) &&
              !isLoading

            return (
              <Message
                key={`${message.id}-${message.toolInvocations?.length || 0}-${message.toolInvocations?.filter((t: any) => t.state === 'result').length || 0}`}
                from={message.role}
                className="group"
              >
                <MessageAvatar
                  isUser={message.role === 'user'}
                  name={message.role === 'user' ? "You" : "AI"}
                />
                <MessageContent variant="flat">
                  {renderMessageContent(message, messageText, isLastMessage)}

                  {message.role === 'assistant' && sources.length > 0 && <SourcesList sources={sources} />}

                  {/* Minimal footer with actions - show on hover or for last message */}
                  <div className={cn(
                    "mt-2 flex items-center gap-3 text-xs text-zinc-500 transition-opacity",
                    isLastMessage ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    {timestampLabel && <span>{timestampLabel}</span>}
                    {messageText && message.role === 'assistant' && (
                      <button
                        type="button"
                        className="hover:text-zinc-300 transition-colors"
                        onClick={() => copyToClipboard(messageText, message.id)}
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    {canRegenerate && (
                      <button
                        type="button"
                        className="hover:text-zinc-300 transition-colors"
                        onClick={() => regenerate?.()}
                      >
                        Regenerate
                      </button>
                    )}
                  </div>
                </MessageContent>
              </Message>
            )
          })}

          {/* Proactive Suggestions - Show after last message when not loading */}
          {!isLoading && proactiveSuggestions.length > 0 && messages.length > 0 && (
            <div className="px-4 py-2">
              <ProactiveSuggestions
                suggestions={proactiveSuggestions}
                onSuggestionClick={(prompt) => {
                  handleSubmit(prompt)
                  setProactiveSuggestions([])
                }}
                isLoading={isLoading}
              />
            </div>
          )}

          {isLoading && (
            <Message from="assistant">
              <MessageAvatar isUser={false} name="AI" />
              <MessageContent variant="flat">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader size={16} className="text-indigo-400" />
                  <Shimmer className="text-sm text-zinc-300">
                    {activeToolName ? `Using ${formatToolName(activeToolName)}...` : 'Thinking...'}
                  </Shimmer>
                </div>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton className="bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur border border-white/10" />
      </Conversation>

      <div className="p-4 md:p-6 bg-[#1a1a1a] border-t border-zinc-800">
        {(status === 'streaming' || status === 'submitted') && (
          <div className="flex justify-end gap-3 text-xs text-zinc-400 mb-2">
            <span>{status === 'submitted' ? 'Connecting…' : 'Streaming response…'}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full border border-white/20 bg-white/5 px-4 py-1 text-white hover:bg-white/15"
              onClick={() => stop?.()}
            >
              Stop
            </Button>
          </div>
        )}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => {
            if (input.trim() && !isLoading) {
              handleSendMessage({ text: input })
              setInput('')
            }
          }}
          disabled={isLoading}
          placeholder={placeholder}
          className="bg-transparent"
          onImageGenerate={() => {
            const prompt = input.trim() || 'a beautiful landscape'
            handleSendMessage({ text: `Generate an image: ${prompt}` })
            setInput('')
          }}
          onWebSearch={() => {
            const query = input.trim() || 'latest news'
            handleSendMessage({ text: `Search the web for: ${query}` })
            setInput('')
          }}
        />
      </div>
    </div>
  )
})

AIChatInterface.displayName = 'AIChatInterface'
