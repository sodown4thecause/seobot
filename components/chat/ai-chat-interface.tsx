'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState, forwardRef, useMemo, useCallback, useRef } from 'react'
import { useAIState } from '@/lib/context/ai-state-context'

import { Terminal, Check, Copy, ChevronDown, ChevronRight, Loader2, Sparkles, Send, X, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ChatInput } from '@/components/chat/chat-input'
import { ChatModeSelector } from '@/components/chat/chat-mode-selector'
import { renderMessageComponent } from './message-types'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Logo } from '@/components/ui/logo'
import { KeywordSuggestionsTable } from './tool-ui/keyword-suggestions-table'
import { BacklinksTable } from './tool-ui/backlinks-table'
import { SERPTable } from './tool-ui/serp-table'
import { FirecrawlResults } from './tool-ui/firecrawl-results'
import { CompetitorAnalysisTable } from './tool-ui/competitor-analysis-table'
import { GeoBrandScanResults } from './tool-ui/geo-brand-scan-results'
import { SchemaMarkupResult } from './tool-ui/schema-markup-result'
import { CrawlabilityAuditResult } from './tool-ui/crawlability-audit-result'
import { GeoFixPlanResult } from './tool-ui/geo-fix-plan-result'
import type { ProactiveSuggestion } from '@/lib/proactive/types'
import { useArtifactStore } from '@/lib/artifacts/artifact-store'
import { syncArtifactsFromMessages } from '@/lib/artifacts/sync-from-messages'
import { ArtifactPanel } from '@/components/artifacts/artifact-panel'
import { bootstrapConversationRecord } from '@/lib/chat/conversation-bootstrap'
import { BlogArtifact } from './artifacts/blog-artifact'
import { ToastArtifact, ToastMessage } from './artifacts/toast-artifact'
import { useChatModeOptional } from './chat-mode-context'
import { getChatModeAccentClasses, getChatModeUi } from '@/lib/chat/modes'
import { DEFAULT_GEO_ENGINES } from '@/lib/geo/utils'
import { DataPartRenderer } from './generative-ui/registry'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Suggestions } from '@/components/ai-elements/suggestions'
import {
  extractCitations,
  extractReasoning,
  extractSources,
} from '@/lib/chat/message-metadata'

interface AIChatInterfaceProps {
  context?: Record<string, unknown>
  className?: string
  placeholder?: string
  onComponentSubmit?: (component: string, data: any) => void
  initialMessage?: string
  conversationId?: string
  agentId?: string
  autoSendMessage?: string // For workflow prompts that should be sent automatically
  autoSendKey?: string
}

const formatToolName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const GEO_TRACKED_ENGINE_LABELS = {
  chatgpt: { label: 'ChatGPT', sub: 'OpenAI responses' },
  perplexity: { label: 'Perplexity', sub: 'sonar + citations' },
  google_ai_overview: { label: 'Google AI Overviews', sub: 'live SERP overview' },
} as const

type ParsedChatError = {
  message: string
  code: string | null
  isRateLimited: boolean
  retryAfterSeconds: number | null
  resetDate: string | null
  isPaused: boolean
}

const parseChatError = (err: Error | null | undefined): ParsedChatError | null => {
  if (!err) return null

  let message = err.message?.trim() || 'Something went wrong. Please try again.'
  let code: string | null = null
  let retryAfterSeconds: number | null = null
  let resetDate: string | null = null
  let isPaused = false
  let isRateLimited = false

  type ErrorPayload = {
    error?: string
    code?: string
    retryAfter?: number
    message?: string
    resetDate?: string
    isPaused?: boolean
  }

  const applyPayload = (payload: ErrorPayload) => {
    if (typeof payload.code === 'string') code = payload.code
    if (typeof payload.message === 'string') message = payload.message
    else if (typeof payload.error === 'string') message = payload.error
    if (typeof payload.retryAfter === 'number' && payload.retryAfter > 0) {
      retryAfterSeconds = payload.retryAfter
      isRateLimited = true
    }
    if (typeof payload.resetDate === 'string') resetDate = payload.resetDate
    if (payload.isPaused === true) isPaused = true
  }

  try {
    applyPayload(JSON.parse(message) as ErrorPayload)
  } catch {
    // Message is plain text, not JSON
  }

  const extended = err as Error & {
    status?: number
    retryAfter?: number
    data?: ErrorPayload
  }

  if (extended.status === 429) isRateLimited = true
  if (extended.status === 403 && !code) code = 'subscription_required'
  if (typeof extended.retryAfter === 'number' && extended.retryAfter > 0) {
    retryAfterSeconds = extended.retryAfter
    isRateLimited = true
  }
  if (extended.data) applyPayload(extended.data)

  if (/rate limit|too many requests|\b429\b/i.test(message)) {
    isRateLimited = true
  }

  return { message, code, isRateLimited, retryAfterSeconds, resetDate, isPaused }
}

const ConversationLoadingSkeleton = () => (
  <div className="space-y-6 px-4 py-2 max-w-3xl mx-auto" role="status" aria-live="polite" aria-label="Loading conversation">
    {[0, 1, 2].map((index) => (
      <div key={index} className={cn('flex gap-3', index % 2 === 1 && 'flex-row-reverse')}>
        <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-zinc-800" />
        <Skeleton className={cn('h-16 rounded-2xl bg-zinc-800', index % 2 === 0 ? 'w-2/3' : 'w-1/2')} />
      </div>
    ))}
  </div>
)

const ChatErrorBanner = ({
  error,
  retryCountdown,
  onRetry,
}: {
  error: Error
  retryCountdown: number | null
  onRetry: () => void
}) => {
  const parsed = parseChatError(error)
  if (!parsed) return null

  const retryDisabled = parsed.isRateLimited && retryCountdown !== null && retryCountdown > 0
  const needsUpgrade =
    parsed.code === 'subscription_required' ||
    parsed.code === 'credit_limit_exceeded' ||
    parsed.code === 'authentication_required'
  const resetLabel = parsed.resetDate
    ? new Date(parsed.resetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-2">
          <p>{parsed.message}</p>
          {parsed.code === 'credit_limit_exceeded' && resetLabel && (
            <p className="text-xs text-red-200/80">
              {parsed.isPaused ? 'Usage paused until' : 'Resets on'} {resetLabel}
            </p>
          )}
          {parsed.isRateLimited && retryCountdown !== null && retryCountdown > 0 && (
            <p className="text-xs text-red-200/80">
              Try again in {retryCountdown}s
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {needsUpgrade ? (
              <a
                href={parsed.code === 'authentication_required' ? '/sign-in' : '/billing/checkout'}
                className="rounded-full border border-red-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-100 transition-colors hover:bg-red-500/20"
              >
                {parsed.code === 'authentication_required' ? 'Sign in' : 'Upgrade plan'}
              </a>
            ) : (
              <button
                type="button"
                onClick={onRetry}
                disabled={retryDisabled}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
                  retryDisabled
                    ? 'cursor-not-allowed border-red-500/20 text-red-300/50'
                    : 'border-red-400/30 text-red-100 hover:bg-red-500/20'
                )}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
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

  // Backlink tools
  n8n_backlinks: BacklinksTable,

  // Competitor tools
  dataforseo_labs_google_competitors_domain: CompetitorAnalysisTable,
  dataforseo_labs_google_domain_intersection: CompetitorAnalysisTable,
  dataforseo_labs_google_page_intersection: CompetitorAnalysisTable,

  // SERP tools
  serp_organic_live_advanced: SERPTable,
  dataforseo_labs_google_serp_competitors: SERPTable,

  // Scraping tools
  firecrawl_scrape: FirecrawlResults,
  firecrawl_search: FirecrawlResults,

  // GEO / AI visibility tools
  generate_schema_markup: SchemaMarkupResult,
  ai_crawlability_audit: CrawlabilityAuditResult,
  geo_generate_fix: GeoFixPlanResult,
}

// ... ToolInvocation Component (Keeping it as is for functionality) ...
const ToolInvocation = ({
  toolCall,
  onComponentSubmit,
  onGenerateFix,
}: {
  toolCall: any
  onComponentSubmit: (data: any) => void
  onGenerateFix?: (prompt: string) => void
}) => {
  const { toolName, args, state, result } = toolCall
  const isLoading = state !== 'result'
  const isSuccess = state === 'result'
  const [isOpen, setIsOpen] = useState(false)

  if (toolName === 'generate_content_package' && isSuccess && result?.success) {
    return <ContentPackagePreview output={result} />
  }

  if (toolName === 'geo_brand_scan' && isSuccess && result?.success) {
    return <GeoBrandScanResults toolInvocation={toolCall} onGenerateFix={onGenerateFix} />
  }

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
  onGenerateFix,
}: {
  toolName: string
  toolCallId?: string
  state?: string
  input?: any
  output?: any
  onGenerateFix?: (prompt: string) => void
}) => {
  const isLoading = state !== 'output-available' && state !== 'result'
  const isSuccess = !isLoading
  const [isOpen, setIsOpen] = useState(false)

  if (toolName === 'generate_content_package' && isSuccess && output?.success) {
    return <ContentPackagePreview output={output} />
  }

  if (toolName === 'geo_brand_scan' && isSuccess && output?.success) {
    return (
      <GeoBrandScanResults
        toolInvocation={{ args: input, result: output, state: 'result' }}
        onGenerateFix={onGenerateFix}
      />
    )
  }

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

type ContentPackageImagePreview = {
  type: 'main' | 'thumbnail'
  url?: string
  previewUrl?: string
  altText?: string
  saveStatus?: 'saved' | 'preview_only' | 'failed'
}

type ContentPackagePreviewOutput = {
  title?: string
  images?: {
    main?: ContentPackageImagePreview
    thumbnail?: ContentPackageImagePreview
  }
}

const ContentPackagePreview = ({ output }: { output: ContentPackagePreviewOutput }) => {
  const images = output.images || {}
  const mainImage = images.main
  const thumbnail = images.thumbnail

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
      <div className="border-b border-white/10 p-4">
        <p className="text-sm font-semibold text-emerald-100">Content package saved</p>
        <p className="mt-1 text-xs text-zinc-400">{output.title}</p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {[mainImage, thumbnail].filter((image): image is ContentPackageImagePreview => Boolean(image)).map((image) => {
          const imageSrc = image.url || image.previewUrl

          return (
            <figure key={image.type} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc} alt={image.altText || image.type} className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-zinc-950 px-4 text-center text-xs text-zinc-500">
                  Image generated, but persistent preview storage is not configured.
                </div>
              )}
              <figcaption className="space-y-1 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
                  {image.type === 'main' ? 'Main image' : 'Thumbnail'}
                </p>
                <p className="text-xs text-zinc-500">{image.saveStatus === 'saved' ? 'Saved to library' : 'Preview only'}</p>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}

type PlanStep = {
  title?: string
  description?: string
  status?: string
}

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

const MessageMeta = ({
  timestamp,
  status,
}: {
  timestamp: string | null
  status: { label: string; tone: 'neutral' | 'warning' | 'success' | 'error' } | null
}) => {
  if (!timestamp && !status) return null

  const toneClasses = status?.tone === 'error'
    ? 'text-red-300 bg-red-500/10 border-red-500/20'
    : status?.tone === 'warning'
      ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
      : status?.tone === 'success'
        ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
        : 'text-zinc-300 bg-white/5 border-white/10'

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
      {timestamp && <span>{timestamp}</span>}
      {status && (
        <span className={cn('rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide', toneClasses)}>
          {status.label}
        </span>
      )}
    </div>
  )
}

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

const messageHasPartialAssistantContent = (message: { role?: string; parts?: unknown[]; toolInvocations?: unknown[]; content?: unknown }): boolean => {
  if (message.role !== 'assistant') return false

  const text = getMessageText(message)
  if (text.trim().length > 0) return true

  const parts = message.parts || []
  if (parts.some((part: unknown) => {
    const typed = part as { type?: string }
    return typed.type?.startsWith('tool-') || typed.type?.startsWith('data-')
  })) {
    return true
  }

  return (message.toolInvocations?.length ?? 0) > 0
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
  autoSendKey,
}, ref) => {
  // 1. Initial State & Context
  const { chatMode } = useChatModeOptional()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)
  const { artifacts, updateArtifact } = useArtifactStore()
  const { roadmap, fetchRoadmap, focus, setFocus } = useAIState()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [prevFocus, setPrevFocus] = useState<string | null>(null)
  const [showHandoff, setShowHandoff] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(conversationIdProp ?? null)
  const [hydratedConversationId, setHydratedConversationId] = useState<string | null>(conversationIdProp ?? null)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([])

  // 2. Refs
  const hasInitializedRef = useRef(false)
  const mountedRef = useRef(true)
  const lastLoadedConversationId = useRef<string | null>(null)
  const bootstrapTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bootstrapAbortControllerRef = useRef<AbortController | null>(null)
  const lastAutoSentKey = useRef<string | null>(null)
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
    mode: chatMode,
    chatMode,
  }), [contextKey, agentPreference, conversationId, chatMode])

  const latestRequestRef = useRef({
    chatId: conversationId,
    context: mergedContext,
  })

  useEffect(() => {
    latestRequestRef.current = {
      chatId: conversationId,
      context: mergedContext,
    }
  }, [conversationId, mergedContext])

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => latestRequestRef.current,
  }), [])

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
  const hasPartialAssistantContent = useMemo(
    () => messages.length > 0 && messageHasPartialAssistantContent(messages[messages.length - 1]),
    [messages]
  )
  const showThinkingIndicator = isLoading && !hasPartialAssistantContent

  useEffect(() => {
    if (!error) {
      setRetryCountdown(null)
      return
    }

    const parsed = parseChatError(error)
    if (parsed?.retryAfterSeconds && parsed.retryAfterSeconds > 0) {
      setRetryCountdown(parsed.retryAfterSeconds)
    } else {
      setRetryCountdown(null)
    }
  }, [error])

  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return

    const timer = setInterval(() => {
      setRetryCountdown((current) => (current !== null && current > 1 ? current - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [retryCountdown])

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
    const nextConversationId = conversationIdProp ?? null

    if (nextConversationId !== conversationId) {
      setConversationId(nextConversationId)
      setHydratedConversationId(null)
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

  // Artifact synchronization from tool invocations
  useEffect(() => {
    syncArtifactsFromMessages({
      messages: messages as Array<{ toolInvocations?: Array<{ toolName: string; state: string; result?: unknown }> }>,
      chatMode,
      activeArtifactId,
      updateArtifact,
      setActiveArtifactId,
      openOnStart: false,
    })
  }, [messages, chatMode, activeArtifactId, updateArtifact])

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
    setInput('') // Clear input after sending (AI SDK 6 best practice)
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

  const handleRetry = useCallback(() => {
    if (retryCountdown !== null && retryCountdown > 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant') {
      regenerate?.()
      return
    }

    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
    const lastUserText = lastUserMessage ? getMessageText(lastUserMessage) : ''
    if (lastUserText.trim()) {
      sendMessage({ text: lastUserText })
    }
  }, [messages, regenerate, retryCountdown, sendMessage])

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
        const workingConv = await bootstrapConversationRecord({
          overrideId,
          createConversation: async () => {
            if (signal.aborted) return null

            try {
              const createRes = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: agentPreference }),
                signal,
              })

              if (!createRes.ok) {
                return null
              }

              const cdata = await safeParseJSON(createRes)
              return cdata?.conversation ?? null
            } catch (createErr) {
              console.warn('[Chat] Failed to create conversation:', createErr)
              throw createErr
            }
          },
          listConversations: async () => {
            if (signal.aborted) return []

            try {
              const res = await fetch('/api/conversations?limit=1', { signal })
              if (!res.ok) {
                return []
              }

              const data = await safeParseJSON(res)
              return data?.conversations ?? []
            } catch (fetchErr) {
              console.warn('[Chat] Failed to fetch conversations:', fetchErr)
              return []
            }
          },
        })

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
                setHydratedConversationId(workingConv.id)
                setMessages(hms)
              }
            }
          } catch (msgErr) {
            console.warn('[Chat] Failed to load messages:', msgErr)
            // Still set the conversation ID even if messages fail to load
            if (mountedRef.current && !signal.aborted) {
              setConversationId(workingConv.id)
              setHydratedConversationId(workingConv.id)
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
        setHydratedConversationId(null)
        setIsLoadingConversation(true)
        // Clear messages immediately to avoid stale content flash
        setMessages([])
        // Load messages for the switched conversation
        const loadMessagesForConversation = async () => {
          try {
            const res = await fetch(`/api/conversations/${conversationId}/messages`)
            if (res.ok) {
              const data = await res.json()
              const msgs = data?.messages ?? []
              if (mountedRef.current && lastLoadedConversationId.current === conversationId) {
                setMessages(msgs)
                setHydratedConversationId(conversationId)
              }
            } else {
              console.warn('[Chat] Failed to load messages for conversation:', conversationId)
            }
          } catch (err) {
            console.error('[Chat] Error loading messages:', err)
          } finally {
            if (mountedRef.current && lastLoadedConversationId.current === conversationId) {
              setIsLoadingConversation(false)
            }
          }
        }
        loadMessagesForConversation()
      }
    } else if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      bootstrapConversation()
    }
  }, [conversationId, bootstrapConversation, setMessages])

  // Auto-send workflow messages (from sidebar Content Creation / Workflows)
  useEffect(() => {
    if (!autoSendMessage) return
    if (!conversationId) return
    if (hydratedConversationId !== conversationId) return
    if (status === 'streaming' || status === 'submitted') return
    if (isBootstrapping) return
    const resolvedAutoSendKey = autoSendKey ?? `${conversationId}:${autoSendMessage}`
    if (lastAutoSentKey.current === resolvedAutoSendKey) return
    // Small delay so the chat is visually ready
    const t = setTimeout(() => {
      lastAutoSentKey.current = resolvedAutoSendKey
      sendMessage({ text: autoSendMessage })
    }, 400)
    return () => clearTimeout(t)
  }, [autoSendKey, autoSendMessage, conversationId, hydratedConversationId, status, isBootstrapping, sendMessage])

  

  // 8. Missing Handlers (Re-added)
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 5000)
  }, [removeToast])

  const previousChatModeRef = useRef(chatMode)
  useEffect(() => {
    if (previousChatModeRef.current !== chatMode && messages.length > 0) {
      addToast(
        'info',
        'Mode switched — new messages will use the selected mode. Start a new chat for a clean thread.'
      )
    }
    previousChatModeRef.current = chatMode
  }, [chatMode, messages.length, addToast])

  // 9. Rendering Logic Helpers
  const renderMessageContent = useCallback((message: any, textContent: string, isLast: boolean = false) => {
    const parts = message.parts || []
    const toolInvocations = message.toolInvocations || []
    const imageSources: { src: string; alt?: string }[] = []
    const sources = extractSources(message)
    const reasoningSteps = extractReasoning(message)
    const citations = extractCitations(message)
    const planSteps = extractPlanSteps(message)
    const timestamp = getMessageTimestamp(message)
    const status = getMessageStatus(message)
    const isStreaming = isLast && isLoading

    // Extracting images (Logic preserved from previous view)
    parts.filter((p: any) => p?.type === 'file' && p?.mediaType?.startsWith('image/') && p?.url)
      .forEach((p: any) => imageSources.push({ src: p.url, alt: p.name || 'Generated image' }))

    // Single-pass deduplication using Set - O(n) instead of O(n^2)
    const uniqueImages: { src: string; alt?: string }[] = []
    const seenSrcs = new Set<string>()
    for (const img of imageSources) {
      if (!seenSrcs.has(img.src)) {
        seenSrcs.add(img.src)
        uniqueImages.push(img)
      }
    }

    return (
      <>
        {uniqueImages.map((img, idx) => (
          <div key={idx} className="my-3 rounded-xl overflow-hidden border border-white/10">
            <img src={img.src} alt={img.alt} className="w-full object-contain max-h-[500px]" />
          </div>
        ))}
        {textContent && (
          message.role === 'assistant' ? (
            <Response 
              isStreaming={isStreaming} 
              sources={sources.length > 0 ? sources : undefined}
              reasoningSteps={reasoningSteps.length > 0 ? reasoningSteps : undefined}
              isReasoning={isStreaming && reasoningSteps.length > 0}
              citations={citations.length > 0 ? citations : undefined}
            >
              {textContent}
            </Response>
          ) : (
            <div className="whitespace-pre-wrap break-words text-zinc-200 text-[15px] leading-relaxed">
              {textContent}
            </div>
          )
        )}
        {/* Legacy plan steps (kept for backward compatibility) */}
        {planSteps.length > 0 && <PlanList steps={planSteps} />}
        <MessageMeta timestamp={timestamp} status={status} />
        {parts.map((part: any, idx: number) => {
          if (part.type?.startsWith('data-')) {
            return <DataPartRenderer key={part.id ?? `data-${idx}`} part={part} />
          }
          if (part.type?.startsWith('tool-')) {
            const tName = part.type.replace('tool-', '')
            return (
              <ToolPartInvocation
                key={part.toolCallId ?? `tool-${idx}`}
                toolName={tName}
                toolCallId={part.toolCallId}
                state={part.state}
                input={part.input ?? part.args}
                output={part.output ?? part.result}
                onGenerateFix={(prompt) => handleSendMessage({ text: prompt })}
              />
            )
          }
          return null
        })}
        {toolInvocations.map((t: any) => (
          <ToolInvocation
            key={t.toolCallId}
            toolCall={t}
            onComponentSubmit={(data) => handleComponentSubmit(t.args?.component, data)}
            onGenerateFix={(prompt) => handleSendMessage({ text: prompt })}
          />
        ))}
      </>
    )
  }, [isLoading, handleComponentSubmit, handleSendMessage])


  // 10. Main Component Returns
  if (isBootstrapping) {
    const loadingLabel = conversationIdProp
      ? 'Loading your chat workspace...'
      : 'Starting a new chat...'

    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3 text-zinc-400" role="status" aria-live="polite" aria-label="Loading chat workspace">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <p className="text-sm">{loadingLabel}</p>
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
    const seoSuggestions = [
      { id: 'keyword-gap', text: 'Analyze flowintent.com and tell me the top 5 keyword opportunities I\'m missing vs my competitors', icon: 'target' as const },
      { id: 'keyword-target', text: 'What keywords should I target to rank for "AI SEO tools" — give me search volume, difficulty, and intent', icon: 'search' as const },
      { id: 'competitor-scrape', text: 'Run a full competitor analysis for the keyword "content marketing platform" and scrape the top 3 ranking pages', icon: 'lightbulb' as const },
      { id: 'backlink-profile', text: 'Check the backlink profile for ahrefs.com and identify their top referring domains', icon: 'zap' as const },
    ]
    const geoSuggestions = [
      { id: 'ai-brand-visibility', text: 'My brand is "Flow Intent" (flowintent.com) — check if I appear across ChatGPT, Perplexity, and Google AI Overviews for "best AI SEO tools"', icon: 'sparkles' as const },
      { id: 'geo-competitor', text: 'Track my brand "Flow Intent" for the query "alternatives to Ahrefs" and tell me which competitors appear', icon: 'target' as const },
      { id: 'geo-optimize', text: 'How can I optimize my content to get cited in AI-generated answers?', icon: 'search' as const },
      { id: 'geo-new-brand', text: 'I want to start tracking my brand across AI platforms — where do I begin?', icon: 'zap' as const },
    ]
    const contentSuggestions = [
      { id: 'pillar-page', text: 'Write a comprehensive pillar page on "AI SEO" — research top-ranking competitors first', icon: 'lightbulb' as const },
      { id: 'comparison-article', text: 'Create a comparison article for the top 5 AI writing tools, targeting "best AI writer" (check search volume first)', icon: 'target' as const },
      { id: 'faq-page', text: 'Write an FAQ page targeting "People Also Ask" questions for the keyword "content marketing strategy"', icon: 'sparkles' as const },
      { id: 'blog-post', text: 'Generate a blog post about Core Web Vitals optimization — include current Google benchmarks', icon: 'zap' as const },
    ]
    const modeMap = { seo: seoSuggestions, geo: geoSuggestions, content: contentSuggestions }
    const defaultSuggestions = modeMap[chatMode] ?? seoSuggestions

    const activeModeUi = getChatModeUi(chatMode)

    // GEO mode gets a dedicated workflow onboarding panel
    if (chatMode === 'geo') {
      return (
        <div className={cn("flex flex-col h-full items-center justify-center p-6 relative bg-zinc-950 font-chat overflow-y-auto", className)}>
          <div className="w-full max-w-3xl space-y-6 py-4">
            <div className="flex justify-center">
              <ChatModeSelector />
            </div>

            {/* Hero */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-tight">GEO / AEO Mode</h1>
              <p className="text-zinc-400 text-base max-w-xl mx-auto">
                Track how often your brand appears inside ChatGPT, Perplexity, and Google AI Overviews — and get actionable steps to increase your AI visibility.
              </p>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
              <p className="text-xs font-mono uppercase tracking-widest text-violet-400">How this works</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { step: '1', label: 'Tell us your brand', detail: 'Share your brand name, website, and industry so we know what to track.' },
                  { step: '2', label: 'Pick your queries', detail: 'Choose what people search for — we suggest the best ones based on your niche.' },
                  { step: '3', label: 'We query the AI models', detail: 'We send your queries to ChatGPT, Perplexity, and Google AI Overviews in real time and capture their responses.' },
                  { step: '4', label: 'Get actionable insights', detail: 'See exactly where you appear, what your competitors say, and which content will get you cited.' },
                ].map(({ step, label, detail }) => (
                  <div key={step} className="flex gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What we track */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              {DEFAULT_GEO_ENGINES.map((engine) => {
                const engineMeta = GEO_TRACKED_ENGINE_LABELS[engine as keyof typeof GEO_TRACKED_ENGINE_LABELS]
                if (!engineMeta) return null
                return (
                  <div key={engine} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                    <p className="text-sm font-semibold text-zinc-200">{engineMeta.label}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">{engineMeta.sub}</p>
                  </div>
                )
              })}
            </div>

            {/* Chat input */}
            <div className="w-full">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSendMessage({ text: input })}
                disabled={isLoading}
                placeholder="Tell me your brand name and what you want to track..."
                className="bg-transparent"
              />
            </div>

            {/* Starter prompts */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono">Quick starts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {geoSuggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSendMessage({ text: s.text })}
                    className="text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-300 hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-zinc-100 transition-all duration-200"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // SEO mode gets a dedicated workflow onboarding panel
    if (chatMode === 'seo') {
      return (
        <div className={cn("flex flex-col h-full items-center justify-center p-6 relative bg-zinc-950 font-chat overflow-y-auto", className)}>
          <div className="w-full max-w-3xl space-y-6 py-4">
            <div className="flex justify-center">
              <ChatModeSelector />
            </div>

            {/* Hero */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-tight">SEO Mode</h1>
              <p className="text-zinc-400 text-base max-w-xl mx-auto">
                Data-driven keyword research, competitor intelligence, backlink audits, and technical SEO — every recommendation backed by real DataForSEO and Firecrawl data.
              </p>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
              <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">How this works</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { step: '1', label: 'Share your domain', detail: 'Drop in your website or a target keyword — we pull live ranking and search data instantly.' },
                  { step: '2', label: 'Analyze the SERP', detail: 'We check who currently ranks, search volume, difficulty, and intent for your terms.' },
                  { step: '3', label: 'Find the gaps', detail: 'We compare you against competitors to surface the keyword and content gaps worth chasing.' },
                  { step: '4', label: 'Build the strategy', detail: 'Get prioritized actions — quick wins first, then the longer-term plays with projected impact.' },
                ].map(({ step, label, detail }) => (
                  <div key={step} className="flex gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What we cover */}
            <div className="flex flex-wrap justify-center gap-2">
              {['Keyword Research', 'Competitor Analysis', 'Backlinks', 'Technical Audit', 'Trends', 'YouTube SEO'].map(pill => (
                <span key={pill} className="rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs font-medium text-zinc-300">
                  {pill}
                </span>
              ))}
            </div>

            {/* Chat input */}
            <div className="w-full">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSendMessage({ text: input })}
                disabled={isLoading}
                placeholder="Share your domain or a keyword to start..."
                className="bg-transparent"
              />
            </div>

            {/* Starter prompts */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono">Quick starts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {seoSuggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSendMessage({ text: s.text })}
                    className="text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-300 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-zinc-100 transition-all duration-200"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Content mode gets a dedicated workflow onboarding panel
    if (chatMode === 'content') {
      const contentUi = getChatModeUi('content')
      const contentAccent = getChatModeAccentClasses('content')
      return (
        <div className={cn("flex flex-col h-full items-center justify-center p-6 relative bg-zinc-950 font-chat overflow-y-auto", className)}>
          <div className="w-full max-w-3xl space-y-6 py-4">
            <div className="flex justify-center">
              <ChatModeSelector />
            </div>

            {/* Hero */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-tight">{contentUi.heroTitle}</h1>
              <p className="text-zinc-400 text-base max-w-xl mx-auto">{contentUi.tagline}</p>
            </div>

            {/* How it works */}
            <div className={cn('rounded-2xl border p-5 space-y-4', contentAccent.borderPanel, contentAccent.bgPanel)}>
              <p className={cn('text-xs font-mono uppercase tracking-widest', contentAccent.textLabel)}>How this works</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { step: '1', label: 'Choose your topic', detail: 'Tell us what you want to create and the goal — rank, convert, or earn AI citations.' },
                  { step: '2', label: 'Research the keywords', detail: 'We pull search volume, difficulty, and intent, then study who already ranks.' },
                  { step: '3', label: 'Generate the content', detail: 'We write SEO and AEO-optimized content with images, structured for featured snippets.' },
                  { step: '4', label: 'Optimize and refine', detail: 'Quality scoring and a revision pass ensure the piece is ready to publish.' },
                ].map(({ step, label, detail }) => (
                  <div key={step} className="flex gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div className={cn('w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5', contentAccent.stepRing)}>{step}</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content types */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              {[
                { label: 'Blog Post', sub: '1000-2500 words' },
                { label: 'Landing Page', sub: 'conversion-focused' },
                { label: 'FAQ Page', sub: 'PAA-optimized' },
                { label: 'Comparison', sub: 'best X / X vs Y' },
                { label: 'Pillar Page', sub: '3000+ words' },
              ].map(({ label, sub }) => (
                <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <p className="text-sm font-semibold text-zinc-200">{label}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">{sub}</p>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <div className="w-full">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSendMessage({ text: input })}
                disabled={isLoading}
                placeholder="What content do you want to create today?"
                className="bg-transparent"
              />
            </div>

            {/* Starter prompts */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono">Quick starts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {contentSuggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSendMessage({ text: s.text })}
                    className={cn(
                      'text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm text-zinc-300 hover:text-zinc-100 transition-all duration-200',
                      contentAccent.promptHoverBorder,
                      contentAccent.promptHoverBg
                    )}
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={cn("flex flex-col h-full items-center justify-center p-8 relative bg-zinc-950 font-chat", className)}>
        <div className="w-full max-w-4xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-semibold text-zinc-100 tracking-tight">Flow Intent</h1>
            <p className="text-base md:text-lg text-zinc-500">{activeModeUi.selectorDescription}</p>
          </div>
          {/* Mode Selector */}
          <div className="flex justify-center">
            <ChatModeSelector />
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
          <div className="max-w-3xl mx-auto">
            <Suggestions
              suggestions={defaultSuggestions}
              onSuggestionClick={(prompt) => handleSendMessage({ text: prompt })}
              title="Try asking"
            />
          </div>
        </div>
      </div>
    )
  }

  // Final Chat Interface
  return (
    <div className={cn("relative flex w-full overflow-hidden bg-zinc-950", className)}>
      <div className={cn(
        "flex flex-col h-full transition-all duration-500",
        activeArtifact
          ? "hidden md:flex md:w-1/2 md:border-r md:border-zinc-800"
          : "w-full"
      )}>
        <Conversation>
          <ConversationContent className="px-4 py-2 max-w-3xl mx-auto">
            {isLoadingConversation && messages.length === 0 ? (
              <ConversationLoadingSkeleton />
            ) : (
              <>
            {messages.map((m, idx) => {
              const isLastMsg = idx === messages.length - 1
              const text = getMessageText(m)
              const isContentAssistant = chatMode === 'content' && m.role === 'assistant' && text.length > 200
              const messageId = m.id || `message-${idx}`

              return (
                <AIMessage key={messageId} from={m.role as any}>
                  <MessageAvatar isUser={m.role === 'user'} name={m.role === 'user' ? "You" : "AI"} />
                  <MessageContent>
                    {isContentAssistant ? (
                      <BlogArtifact
                        content={text}
                        isStreaming={isLastMsg && isLoading}
                      />
                    ) : (
                      renderMessageContent(m, text, isLastMsg)
                    )}
                    {m.role === 'assistant' && text.trim().length > 0 && !isContentAssistant && (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 rounded transition-colors cursor-pointer"
                          onClick={() => copyToClipboard(text, messageId)}
                          aria-label="Copy response"
                        >
                          {copiedId === messageId ? (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              Copy
                            </>
                          )}
                        </button>
                        {isLastMsg && !isLoading && (
                          <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 rounded transition-colors cursor-pointer" onClick={() => regenerate?.()} aria-label="Regenerate response">Regenerate</button>
                        )}
                      </div>
                    )}
                  </MessageContent>
                </AIMessage>
              )
            })}
            {showThinkingIndicator && (
              <AIMessage from="assistant">
                <MessageAvatar isUser={false} name="AI" />
                <MessageContent>
                  <div className="flex items-center gap-2 text-zinc-400" role="status" aria-live="polite" aria-label="AI is thinking">
                    <Loader2 size={16} className="text-emerald-400 animate-spin" aria-hidden="true" />
                    <span>Thinking...</span>
                  </div>
                </MessageContent>
              </AIMessage>
            )}
              </>
            )}

          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="p-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {error && (
              <ChatErrorBanner
                error={error}
                retryCountdown={retryCountdown}
                onRetry={handleRetry}
              />
            )}
            {proactiveSuggestions.length > 0 && (
              <Suggestions
                suggestions={proactiveSuggestions.map(s => ({
                  id: s.taskKey,
                  text: s.prompt,
                  icon: s.icon?.toLowerCase().includes('research') ? 'search' :
                        s.icon?.toLowerCase().includes('idea') ? 'lightbulb' :
                        s.icon?.toLowerCase().includes('link') ? 'zap' :
                        s.icon?.toLowerCase().includes('eeat') ? 'sparkles' : 'sparkles',
                }))}
                onSuggestionClick={(prompt) => handleSendMessage({ text: prompt })}
                title="Suggested next steps"
              />
            )}
            {/* Mode selector above input */}
            <div className="flex justify-start">
              <ChatModeSelector />
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <ChatInput value={input} onChange={setInput} onSubmit={() => handleSendMessage({ text: input })} placeholder={placeholder} disabled={isLoading} />
              </div>
              {isLoading && (
                <button
                  type="button"
                  onClick={() => stop?.()}
                  aria-label="Stop generating"
                  className="h-10 shrink-0 rounded-full border border-zinc-700/50 bg-zinc-800/50 px-4 text-xs font-semibold uppercase tracking-wide text-zinc-200 hover:bg-zinc-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 cursor-pointer"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeArtifact && activeArtifactId && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={cn(
              'h-full border-zinc-800 bg-zinc-950',
              'fixed inset-0 z-40 w-full md:relative md:inset-auto md:z-auto md:w-1/2 md:border-l'
            )}
          >
            <ArtifactPanel
              artifact={{ ...activeArtifact, id: activeArtifactId }}
              chatMode={chatMode}
              conversationId={conversationId ?? undefined}
              onClose={() => setActiveArtifactId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ToastArtifact toasts={toasts} onRemove={removeToast} />
      {showHandoff && focus && <div className="fixed top-20 right-8 z-50 w-80 pointer-events-none"><AgentHandoffCard intent={focus as any} /></div>}
    </div>
  )
})

AIChatInterface.displayName = 'AIChatInterface'

// _review
