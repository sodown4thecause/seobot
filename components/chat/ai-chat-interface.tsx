'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState, forwardRef, useMemo, useCallback, useRef } from 'react'
import { useAIState } from '@/lib/context/ai-state-context'

import { Terminal, Check, Copy, ChevronDown, ChevronRight, Loader2, Sparkles, Send, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ChatInput } from '@/components/chat/chat-input'
import { renderMessageComponent } from './message-types'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Logo } from '@/components/ui/logo'
import { ProactiveSuggestions } from '@/components/chat/proactive-suggestions'
import { KeywordSuggestionsTable } from './tool-ui/keyword-suggestions-table'
import { BacklinksTable } from './tool-ui/backlinks-table'
import { SERPTable } from './tool-ui/serp-table'
import { FirecrawlResults } from './tool-ui/firecrawl-results'
import { CompetitorAnalysisTable } from './tool-ui/competitor-analysis-table'
import type { ProactiveSuggestion } from '@/lib/proactive/types'
import { useArtifactStore } from '@/lib/artifacts/artifact-store'
import { KeywordArtifact } from './artifacts/keyword-artifact'
import { BacklinkArtifact } from './artifacts/backlink-artifact'
import { ToastArtifact, ToastMessage } from './artifacts/toast-artifact'
import { motion, AnimatePresence } from 'framer-motion'

// AI Elements Imports
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message as AIMessage, MessageAvatar, MessageContent } from '@/components/ai-elements/message'
import { AgentHandoffCard } from './agent-handoff-card'
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

// Tool Invocation Registry
const TOOL_COMPONENTS: Record<string, any> = {
  // Keyword tools
  keywords_data_google_ads_search_volume: KeywordSuggestionsTable,
  dataforseo_labs_google_keyword_suggestions: KeywordSuggestionsTable,
  dataforseo_labs_google_keyword_ideas: KeywordSuggestionsTable,
  dataforseo_labs_google_keyword_overview: KeywordSuggestionsTable,
  dataforseo_labs_google_keywords_for_site: KeywordSuggestionsTable,
  dataforseo_labs_google_ranked_keywords: KeywordSuggestionsTable,
  suggest_keywords: KeywordSuggestionsTable,

  // Backlink tools
  n8n_backlinks: BacklinksTable,

  // Competitor tools
  dataforseo_labs_google_competitors_domain: CompetitorAnalysisTable,
  dataforseo_labs_google_domain_intersection: CompetitorAnalysisTable,
  dataforseo_labs_google_page_intersection: CompetitorAnalysisTable,
  web_search_competitors: CompetitorAnalysisTable,

  // SERP tools
  serp_organic_live_advanced: SERPTable,
  dataforseo_labs_google_serp_competitors: SERPTable,

  // Scraping tools
  firecrawl_scrape: FirecrawlResults,
  firecrawl_search: FirecrawlResults,
}

// ... ToolInvocation Component (Keeping it as is for functionality) ...
const ToolInvocation = ({ toolCall, onComponentSubmit }: { toolCall: any, onComponentSubmit: (data: any) => void }) => {
  const { toolName, args, state, result } = toolCall
  const isLoading = state !== 'result'
  const isSuccess = state === 'result'
  const [isOpen, setIsOpen] = useState(false)

  // 1. Handle specialized client UI
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

  // 2. Handle Image Generation
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

    const uniqueUrls = [...new Set(imageUrls)]

    if (uniqueUrls.length > 0) {
      return (
        <div className="my-4">
          <div className="grid grid-cols-1 gap-4">
            {uniqueUrls.map((url, idx) => (
              <div key={idx} className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl overflow-hidden group">
                <div className="relative aspect-video w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={args.prompt || 'Generated image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                {args.prompt && (
                  <div className="p-4 border-t border-white/5 bg-zinc-900/50">
                    <p className="text-xs text-zinc-400 leading-relaxed italic">"{args.prompt}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  // 3. Handle Specialized Tool Components (Keywords, Backlinks, etc.)
  const SpecializedComponent = TOOL_COMPONENTS[toolName]
  if (SpecializedComponent) {
    return <SpecializedComponent toolInvocation={toolCall} />
  }

  // 4. Default Tool UI (Enhanced aesthetic)
  return (
    <div className={cn(
      "rounded-2xl my-4 overflow-hidden border transition-all duration-300",
      isSuccess ? "border-zinc-800 bg-zinc-900/20" : "border-indigo-500/20 bg-indigo-500/5 shadow-lg shadow-indigo-500/10",
      isLoading && "animate-pulse"
    )}>
      <Collapsible open={isOpen || isLoading} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs",
              isLoading ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"
            )}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Terminal className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">
                  {formatToolName(toolName)}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-widest font-bold",
                    isLoading ? "text-amber-400" : "text-emerald-400"
                  )}
                >
                  {isLoading ? 'Running' : 'Completed'}
                </span>
              </div>
              {isLoading && (
                <p className="text-xs text-zinc-500 mt-0.5">Processing request...</p>
              )}
            </div>
          </div>
          {!isLoading && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg">
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent>
          <div className="border-t border-zinc-800/50 p-4 space-y-4 bg-black/40">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-zinc-700" /> Parameters
              </div>
              <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/50 shadow-inner">
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
            </div>
            {result && !SpecializedComponent && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-700" /> Output
                </div>
                <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/50 max-h-80 overflow-y-auto shadow-inner">
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
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

  // Use the same specialized component logic as ToolInvocation
  const SpecializedComponent = TOOL_COMPONENTS[toolName]
  if (SpecializedComponent) {
    // Create a mock toolInvocation object for compatibility
    return <SpecializedComponent toolInvocation={{ toolName, args: input, state: state === 'output-available' ? 'result' : 'call', result: output }} />
  }

  return (
    <div className={cn(
      "rounded-2xl my-4 overflow-hidden border transition-all duration-300",
      isSuccess ? "border-zinc-800 bg-zinc-900/20" : "border-indigo-500/20 bg-indigo-500/5 shadow-lg shadow-indigo-500/10",
      isLoading && "animate-pulse"
    )}>
      <Collapsible open={isOpen || isLoading} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs",
              isLoading ? "bg-indigo-500/10 text-indigo-400" : "bg-zinc-800 text-zinc-400"
            )}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Terminal className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">
                  {formatToolName(toolName)}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-widest font-bold",
                    isLoading ? "text-amber-400" : "text-emerald-400"
                  )}
                >
                  {isLoading ? 'Running' : 'Completed'}
                </span>
              </div>
            </div>
          </div>
          {!isLoading && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg">
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent>
          <div className="border-t border-zinc-800/50 p-4 space-y-4 bg-black/40">
            {input && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-700" /> Parameters
                </div>
                <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/50 shadow-inner">
                  <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed">
                    {JSON.stringify(input, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {output && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-700" /> Output
                </div>
                <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/50 max-h-80 overflow-y-auto shadow-inner">
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
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
  // 1. Initial State & Context
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)
  const { artifacts, updateArtifact } = useArtifactStore()
  const { roadmap, fetchRoadmap, focus, setFocus } = useAIState()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [prevFocus, setPrevFocus] = useState<string | null>(null)
  const [showHandoff, setShowHandoff] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(conversationIdProp ?? null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([])

  // 2. Refs
  const hasInitializedRef = useRef(false)
  const mountedRef = useRef(true)
  const lastLoadedConversationId = useRef<string | null>(null)
  const bootstrapTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bootstrapAbortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastAutoSentMessage = useRef<string | null>(null)

  // 3. Memoized Values
  const agentPreference = useMemo(() => agentIdProp ?? (chatContext as any)?.agentId ?? 'general', [agentIdProp, chatContext])

  const contextKey = useMemo(() => {
    if (!chatContext) return ''
    const keys = Object.keys(chatContext).sort()
    return JSON.stringify(
      keys.reduce((acc, key) => {
        const value = (chatContext as any)[key]
        acc[key] = (value !== null && typeof value === 'object') ? JSON.stringify(value) : value
        return acc
      }, {} as Record<string, any>)
    )
  }, [chatContext])

  const mergedContext = useMemo(() => ({
    ...(chatContext || {}),
    agentId: agentPreference,
    conversationId,
  }), [contextKey, agentPreference, conversationId])

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      chatId: conversationId,
      context: mergedContext,
    }),
  }), [conversationId, mergedContext])

  // 4. useChat Hook
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
    },
  })

  // Derived Values
  const isLoading = status === 'streaming' || status === 'submitted'
  const lastMessageRole = messages[messages.length - 1]?.role
  const lastAssistantMessage = useMemo(() => messages.filter(m => m.role === 'assistant').pop(), [messages])

  // 5. Effects
  useEffect(() => {
    // Reset mounted ref on each mount (important for React Strict Mode)
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      if (bootstrapTimeoutRef.current) clearTimeout(bootstrapTimeoutRef.current)
      if (bootstrapAbortControllerRef.current) bootstrapAbortControllerRef.current.abort()
    }
  }, [])

  // Sync conversationId from prop
  useEffect(() => {
    if (conversationIdProp !== undefined && conversationIdProp !== conversationId) {
      setConversationId(conversationIdProp)
    }
  }, [conversationIdProp, conversationId])

  // Intent Detection & Suggestion Fetching
  useEffect(() => {
    if (!conversationId || status !== 'ready' || lastMessageRole !== 'assistant') return

    // Cancellation flag to prevent stale updates
    let cancelled = false

    fetchRoadmap()

    const lastContent = lastAssistantMessage ? getMessageText(lastAssistantMessage) : ''
    if (lastContent) {
      const content = lastContent.toLowerCase()
      let detectedFocus = null
      if (content.includes('keyword')) detectedFocus = 'keyword_research'
      else if (content.includes('competitor')) detectedFocus = 'gap_analysis'
      else if (content.includes('backlink')) detectedFocus = 'link_building'
      else if (content.includes('write')) detectedFocus = 'content_production'

      if (detectedFocus && detectedFocus !== focus) {
        setPrevFocus(focus)
        setFocus(detectedFocus)
        setShowHandoff(true)
        setTimeout(() => setShowHandoff(false), 8000)
      }
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/suggestions?conversationId=${conversationId}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          if (!cancelled) {
            setProactiveSuggestions(data.suggestions || [])
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[Chat] Failed to fetch suggestions:', err)
        }
      }
    }
    fetchSuggestions()

    // Cleanup: set cancellation flag to prevent stale updates
    return () => {
      cancelled = true
    }
  }, [conversationId, status, lastMessageRole, lastAssistantMessage, fetchRoadmap, setFocus, focus])

  // Artifact Synchronization
  useEffect(() => {
    messages.forEach(msg => {
      (msg as any).toolInvocations?.forEach((tool: any) => {
        const isActive = tool.state === 'call' || tool.state === 'executing' || tool.state === 'result';
        if (!isActive) return;

        if (tool.toolName === 'suggest_keywords') {
          if (tool.state === 'result') {
            updateArtifact('keyword-research', { status: 'complete', data: tool.result });
          } else {
            updateArtifact('keyword-research', { type: 'keyword', title: 'Keyword Research', status: 'streaming', data: null });
            if (!activeArtifactId) setActiveArtifactId('keyword-research');
          }
        }

        if (tool.toolName === 'n8n_backlinks') {
          if (tool.state === 'result') {
            updateArtifact('backlink-analysis', { status: 'complete', data: tool.result });
          } else {
            updateArtifact('backlink-analysis', { type: 'backlink', title: 'Backlink Analysis', status: 'streaming', data: null });
            if (!activeArtifactId) setActiveArtifactId('backlink-analysis');
          }
        }
      });
    });
  }, [messages, updateArtifact, activeArtifactId]);

  // 6. Interaction Handlers
  const handleSendMessage = useCallback((data: { text: string }) => {
    if (!data.text.trim()) return
    if (isBootstrapping && !conversationId) {
      console.warn('[AIChatInterface] Still bootstrapping...')
    }

    // Show agent handoff animation on first message
    if (messages.length === 0) {
      // Detect initial intent from user's first message
      const text = data.text.toLowerCase()
      let initialFocus = 'general'
      if (text.includes('keyword') || text.includes('research')) initialFocus = 'keyword_research'
      else if (text.includes('competitor') || text.includes('gap') || text.includes('analyze')) initialFocus = 'gap_analysis'
      else if (text.includes('backlink') || text.includes('link')) initialFocus = 'link_building'
      else if (text.includes('write') || text.includes('content') || text.includes('blog')) initialFocus = 'content_production'

      setFocus(initialFocus)
      setShowHandoff(true)
      setTimeout(() => setShowHandoff(false), 5000)
    }

    sendMessage({ text: data.text })
  }, [conversationId, isBootstrapping, sendMessage, messages.length, setFocus])

  const handleComponentSubmit = useCallback((componentType: string, data: any) => {
    if (onComponentSubmit) onComponentSubmit(componentType, data)
    const message = JSON.stringify(data) // Simplified
    handleSendMessage({ text: message })
  }, [onComponentSubmit, handleSendMessage])

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  // Helper for safe JSON parsing
  const safeParseJSON = async (response: Response) => {
    try {
      const text = await response.text()
      if (!text || text.trim() === '') return null
      return JSON.parse(text)
    } catch (e) {
      console.warn('[Chat] Failed to parse JSON response:', e)
      return null
    }
  }

  // 7. Data Loading (Bootstrapping)
  const bootstrapConversation = useCallback(async (overrideId?: string) => {
    setIsBootstrapping(true)
    setBootError(null)
    if (bootstrapTimeoutRef.current) clearTimeout(bootstrapTimeoutRef.current)
    if (bootstrapAbortControllerRef.current) bootstrapAbortControllerRef.current.abort()

    bootstrapAbortControllerRef.current = new AbortController()
    const signal = bootstrapAbortControllerRef.current.signal

    const timeoutPromise = new Promise<'timeout'>(resolve => {
      bootstrapTimeoutRef.current = setTimeout(() => {
        bootstrapAbortControllerRef.current?.abort()
        resolve('timeout')
      }, 15000) // Increased timeout for slow DB connections
    })

    const bootstrapPromise = (async () => {
      try {
        if (signal.aborted) return 'aborted'
        let workingConv = overrideId ? { id: overrideId } : null

        if (!workingConv) {
          try {
            const res = await fetch('/api/conversations?limit=1', { signal })
            if (res.ok) {
              const data = await safeParseJSON(res)
              workingConv = data?.conversations?.[0] ?? null
            }
          } catch (fetchErr) {
            console.warn('[Chat] Failed to fetch conversations:', fetchErr)
          }

          if (!workingConv && !signal.aborted) {
            try {
              const createRes = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: agentPreference }),
                signal,
              })
              if (createRes.ok) {
                const cdata = await safeParseJSON(createRes)
                workingConv = cdata?.conversation ?? null
              }
            } catch (createErr) {
              console.warn('[Chat] Failed to create conversation:', createErr)
            }
          }
        }

        if (workingConv?.id) {
          try {
            const hres = await fetch(`/api/conversations/${workingConv.id}/messages`, { signal })
            if (hres.ok) {
              const hdata = await safeParseJSON(hres)
              let hms = hdata?.messages ?? []
              if (hms.length === 0 && initialMessage && !overrideId) {
                hms = [{ id: 'initial', role: 'assistant', content: initialMessage, parts: [{ type: 'text', text: initialMessage }] }]
              }
              if (mountedRef.current && !signal.aborted) {
                setConversationId(workingConv.id)
                setMessages(hms)
              }
            }
          } catch (msgErr) {
            console.warn('[Chat] Failed to load messages:', msgErr)
            // Still set the conversation ID even if messages fail to load
            if (mountedRef.current && !signal.aborted) {
              setConversationId(workingConv.id)
              setMessages([])
            }
          }
          return 'success'
        }

        // No conversation found or created - still allow showing empty state
        console.warn('[Chat] Bootstrap completed without conversation')
        return 'no-conversation'
      } catch (e) {
        console.error('[Chat] Bootstrap error:', e)
        return (e as Error).name === 'AbortError' ? 'aborted' : 'error'
      }
    })()

    const result = await Promise.race([bootstrapPromise, timeoutPromise])

    // Always end bootstrapping state unless aborted (component unmounted)
    if (mountedRef.current && result !== 'aborted') {
      setIsBootstrapping(false)
      if (result === 'timeout') {
        console.warn('[Chat] Bootstrap timed out')
      } else if (result === 'error') {
        setBootError('Failed to initialize chat. Please try again.')
      }
    }
  }, [agentPreference, initialMessage, setMessages])

  useEffect(() => {
    if (conversationId) {
      if (lastLoadedConversationId.current !== conversationId) {
        lastLoadedConversationId.current = conversationId
        // Load messages (Omitted for brevity, but implicit in real logic)
      }
    } else if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      bootstrapConversation()
    }
  }, [conversationId, bootstrapConversation])

  useEffect(() => {
    if (autoSendMessage && autoSendMessage !== lastAutoSentMessage.current && !isBootstrapping && status === 'ready') {
      lastAutoSentMessage.current = autoSendMessage
      setTimeout(() => sendMessage({ text: autoSendMessage }), 300)
    }
  }, [autoSendMessage, isBootstrapping, status, sendMessage])

  // 8. Missing Handlers (Re-added)
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 5000)
  }, [removeToast])

  // 9. Rendering Logic Helpers
  const renderMessageContent = useCallback((message: any, textContent: string, isLast: boolean = false) => {
    const parts = message.parts || []
    const toolInvocations = message.toolInvocations || []
    const imageSources: { src: string; alt?: string }[] = []

    // Extracting images (Logic preserved from previous view)
    parts.filter((p: any) => p?.type === 'file' && p?.mediaType?.startsWith('image/') && p?.url)
      .forEach((p: any) => imageSources.push({ src: p.url, alt: p.name || 'Generated image' }))

    const uniqueImages = Array.from(new Set(imageSources.map(i => i.src)))
      .map(src => imageSources.find(i => i.src === src)!)

    return (
      <>
        {uniqueImages.map((img, idx) => (
          <div key={idx} className="my-3 rounded-xl overflow-hidden border border-white/10">
            <img src={img.src} alt={img.alt} className="w-full object-contain max-h-[500px]" />
          </div>
        ))}
        {textContent && (
          message.role === 'assistant' ? (
            <Response isStreaming={isLast && isLoading} className="prose prose-invert prose-sm max-w-none text-zinc-100">
              {textContent}
            </Response>
          ) : (
            <div className="whitespace-pre-wrap break-words text-zinc-200 text-[15px] leading-relaxed">
              {textContent}
            </div>
          )
        )}
        {parts.map((part: any, idx: number) => {
          if (part.type?.startsWith('tool-')) {
            const tName = part.type.replace('tool-', '')
            if (part.state === 'output-available' || part.state === 'result') {
              return <ToolPartInvocation key={idx} toolName={tName} toolCallId={part.toolCallId} state={part.state} input={part.input ?? part.args} output={part.output ?? part.result} />
            }
          }
          return null
        })}
        {toolInvocations.map((t: any) => (
          <ToolInvocation key={t.toolCallId} toolCall={t} onComponentSubmit={(data) => handleComponentSubmit(t.args?.component, data)} />
        ))}
      </>
    )
  }, [isLoading, handleComponentSubmit])


  // 10. Main Component Returns
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
          <button onClick={() => bootstrapConversation(conversationIdProp)} className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
            Try again
          </button>
        </div>
      </div>
    )
  }

  const activeArtifact = activeArtifactId ? artifacts[activeArtifactId] : null

  // Empty State View - with styled ProactiveSuggestions
  if (messages.length === 0) {
    // Default suggestions with proper category styling for empty state
    const defaultSuggestions: ProactiveSuggestion[] = [
      {
        taskKey: 'seo-content',
        category: 'execution',
        prompt: 'Write a high-quality, SEO-optimized blog post about [topic]',
        reasoning: 'Create content that ranks well in search engines',
        icon: '✍️',
        pillar: 'production',
        priority: 1
      },
      {
        taskKey: 'competitor-analysis',
        category: 'deep_dive',
        prompt: 'Analyze my top competitors and find content gaps',
        reasoning: 'Understand your competitive landscape',
        icon: '🔍',
        pillar: 'gap_analysis',
        priority: 2
      },
      {
        taskKey: 'content-ideas',
        category: 'adjacent',
        prompt: 'Generate 10 content ideas that will rank well for [keyword]',
        reasoning: 'Discover new topics to target',
        icon: '💡',
        pillar: 'discovery',
        priority: 3
      },
      {
        taskKey: 'eeat-improvement',
        category: 'deep_dive',
        prompt: 'How can I improve my content for better EEAT?',
        reasoning: 'Enhance expertise, experience, authority, and trust signals',
        icon: '🏆',
        pillar: 'strategy',
        priority: 4
      },
    ]

    return (
      <div className={cn("flex flex-col h-full items-center justify-center p-8 relative bg-[#1a1a1a] font-chat", className)}>
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-semibold text-zinc-100 tracking-tight">Flow Intent</h1>
            <p className="text-lg md:text-xl text-zinc-500">Your AI-powered SEO and content assistant</p>
          </div>
          <div className="w-full max-w-3xl mx-auto">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => handleSendMessage({ text: input })}
              disabled={isLoading}
              placeholder={placeholder}
              className="bg-transparent"
            />
          </div>
          {/* Styled ProactiveSuggestions component in empty state */}
          <div className="max-w-3xl mx-auto">
            <ProactiveSuggestions
              suggestions={defaultSuggestions}
              onSuggestionClick={(prompt) => handleSendMessage({ text: prompt })}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    )
  }

  // Final Chat Interface
  return (
    <div className="flex w-full h-full overflow-hidden">
      <div className={cn("flex flex-col h-full transition-all duration-500", activeArtifact ? "w-1/2 border-r border-zinc-800" : "w-full")}>
        <Conversation className="flex-1 overflow-hidden">
          <ConversationContent className="px-4 py-8 max-w-3xl mx-auto space-y-8">
            {messages.map((m, idx) => (
              <AIMessage key={m.id || idx} from={m.role as any}>
                <MessageAvatar isUser={m.role === 'user'} name={m.role === 'user' ? "You" : "AI"} />
                <MessageContent>
                  {renderMessageContent(m, getMessageText(m), idx === messages.length - 1)}
                  {/* Only show regenerate button on last assistant message */}
                  {m.role === 'assistant' && idx === messages.length - 1 && !isLoading && (
                    <div className="mt-2">
                      <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={() => regenerate?.()}>Regenerate</button>
                    </div>
                  )}
                </MessageContent>
              </AIMessage>
            ))}
            {isLoading && (
              <AIMessage from="assistant">
                <MessageAvatar isUser={false} name="AI" />
                <MessageContent>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Loader2 size={16} className="text-indigo-400 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </MessageContent>
              </AIMessage>
            )}
            <div ref={messagesEndRef} />
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <ProactiveSuggestions suggestions={proactiveSuggestions} onSuggestionClick={(p) => handleSendMessage({ text: p })} isLoading={isLoading} />
            <ChatInput value={input} onChange={setInput} onSubmit={() => handleSendMessage({ text: input })} placeholder={placeholder} disabled={isLoading} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeArtifact && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="w-1/2 h-full border-l border-zinc-800 bg-zinc-950 flex flex-col relative">
            <button onClick={() => setActiveArtifactId(null)} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100">
              <X className="w-4 h-4" />
            </button>
            {activeArtifact.type === 'keyword' && <KeywordArtifact data={activeArtifact.data} status={activeArtifact.status} />}
            {activeArtifact.type === 'backlink' && <BacklinkArtifact data={activeArtifact.data} status={activeArtifact.status} />}
          </motion.div>
        )}
      </AnimatePresence>

      <ToastArtifact toasts={toasts} onRemove={removeToast} />
      {showHandoff && focus && <div className="fixed top-20 right-8 z-50 w-80 pointer-events-none"><AgentHandoffCard intent={focus as any} /></div>}
    </div>
  )
})

AIChatInterface.displayName = 'AIChatInterface'
