'use client'

import { useChat } from '@ai-sdk/react'
import { useEffect, useState, forwardRef, useMemo, useCallback, useRef } from 'react'

import { Loader2, Terminal, Check, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ChatInput } from '@/components/chat/chat-input'
import { renderMessageComponent } from './message-types'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Logo } from '@/components/ui/logo'

// AI Elements Imports
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageAvatar, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'

interface AIChatInterfaceProps {
  context?: Record<string, unknown>
  className?: string
  placeholder?: string
  onComponentSubmit?: (component: string, data: any) => void
  initialMessage?: string
  conversationId?: string
  agentId?: string
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
    .map((source: any) => {
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
    .filter((source): source is SourceItem => !!source)
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
}, ref) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(conversationIdProp ?? null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const lastLoadedConversationId = useRef<string | null>(null)
  const agentPreference = agentIdProp ?? (chatContext as any)?.agentId ?? 'general'

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])


  const mergedContext = useMemo(
    () => ({
      ...(chatContext || {}),
      agentId: agentPreference,
      conversationId,
    }),
    [chatContext, agentPreference, conversationId]
  )

  const statusToneClassMap: Record<'neutral' | 'warning' | 'success' | 'error', string> = {
    neutral: 'bg-white/10 text-zinc-200',
    warning: 'bg-amber-500/20 text-amber-200',
    success: 'bg-emerald-500/20 text-emerald-200',
    error: 'bg-rose-500/20 text-rose-200',
  }

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
    api: '/api/chat',
    experimental_throttle: 32,
    // AI SDK 6: Use prepareRequestBody instead of custom transport
    experimental_prepareRequestBody: ({ messages }) => {
      const lastMessage = messages[messages.length - 1]
      return {
        chatId: conversationId,
        message: lastMessage,
        context: mergedContext,
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const bootstrapConversation = useCallback(async (overrideConversationId?: string) => {
    setIsBootstrapping(true)
    setBootError(null)

    try {
      if (overrideConversationId && mountedRef.current) {
        setMessages([])
      }

      let workingConversation = overrideConversationId
        ? { id: overrideConversationId }
        : null

      if (!workingConversation) {
        const latestResponse = await fetch('/api/conversations?limit=1')
        if (!latestResponse.ok) {
          throw new Error('Failed to load conversations')
        }

        const latestPayload = await latestResponse.json()
        workingConversation = latestPayload?.conversations?.[0] ?? null

        if (!workingConversation) {
          const createResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ agentId: agentPreference }),
          })

          if (!createResponse.ok) {
            throw new Error('Failed to create conversation')
          }

          const createdPayload = await createResponse.json()
          workingConversation = createdPayload?.conversation ?? null
        }
      }

      if (!workingConversation?.id) {
        throw new Error('Conversation unavailable')
      }

      const historyResponse = await fetch(`/api/conversations/${workingConversation.id}/messages`)
      if (!historyResponse.ok) {
        throw new Error('Failed to load conversation history')
      }

      const historyPayload = await historyResponse.json()
      let historyMessages = historyPayload?.messages ?? []

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

      if (mountedRef.current) {
        setConversationId(workingConversation.id)
        setMessages(historyMessages)
      }
    } catch (error) {
      console.error('[AIChatInterface] Failed to bootstrap chat', error)
      if (mountedRef.current) {
        setBootError('Unable to load your chat history.')
      }
    } finally {
      if (mountedRef.current) {
        setIsBootstrapping(false)
      }
    }
  }, [agentPreference, initialMessage, setMessages])

  useEffect(() => {
    if (conversationIdProp) {
      if (lastLoadedConversationId.current === conversationIdProp) {
        return
      }
      lastLoadedConversationId.current = conversationIdProp
      bootstrapConversation(conversationIdProp)
      return
    }

    if (!conversationId) {
      bootstrapConversation()
    }
  }, [conversationIdProp, conversationId, bootstrapConversation])

  useEffect(() => {
    if (!conversationIdProp) {
      lastLoadedConversationId.current = null
    }
  }, [conversationIdProp])

  const handleSendMessage = (data: { text: string }) => {
    if (!data.text.trim() || !conversationId || isBootstrapping) return
    sendMessage({ text: data.text })
  }


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

  const renderMessageContent = (message: any, textContent: string) => (
    <>
      {textContent && (
        message.role === 'assistant' ? (
          <Response className="prose prose-invert prose-sm max-w-none text-zinc-100">{textContent}</Response>
        ) : (
          <div className="whitespace-pre-wrap break-words text-white">
            {textContent}
          </div>
        )
      )}
      {message.toolInvocations?.map((toolCall: any) => (
        <ToolInvocation
          key={toolCall.toolCallId}
          toolCall={toolCall}
          onComponentSubmit={(data) => handleComponentSubmit(toolCall.args.component, data)}
        />
      ))}
    </>
  )

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

  // HERO VIEW (Empty State)
  if (messages.length === 0) {

    return (
      <div className={cn("flex flex-col h-full items-center justify-center p-8 relative", className)}>
        <div className="w-full max-w-3xl space-y-12">

          {/* Greeting & Logo */}
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center p-1 shadow-2xl shadow-indigo-500/10 animate-pulse-glow">
              <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center relative overflow-hidden">
                <Logo className="w-16 h-16 relative z-10" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 tracking-tight">
              Good Evening, DeepAI.<br />
              <span className="text-3xl md:text-4xl font-medium text-white/60">Can I help you with anything?</span>
            </h1>
          </div>

          {/* Input Area */}
          <div className="w-full">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => {
                if (input.trim() && !isLoading && conversationId) {
                  handleSendMessage({ text: input })
                  setInput('')
                }
              }}
              disabled={isLoading || !conversationId}
              placeholder={placeholder}
              className="bg-transparent"
            />
            {error && (
              <p className="mt-2 text-sm text-rose-300/80">Something went wrong. Please try again.</p>
            )}
          </div>


          {/* Suggestion Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Smart Budget', desc: 'A budget that fits your lifestyle, not the other way around' },
              { title: 'Analytics', desc: 'Analytics empowers individuals and businesses to make smarter decisions' },
              { title: 'Spending', desc: 'Spending is the way individuals and businesses use their financial resources' }
            ].map((card) => (
              <button
                key={card.title}
                onClick={() => {
                  if (!conversationId || isLoading) return
                  const prompt = `Tell me about ${card.title}`
                  setInput(prompt)
                  handleSendMessage({ text: prompt })
                }}

                className="text-left p-5 rounded-2xl bg-[#18181b] border border-white/[0.05] hover:bg-[#27272a] hover:border-white/10 transition-all group h-full"
              >
                <h3 className="font-semibold text-zinc-100 mb-2 group-hover:text-white">{card.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400">{card.desc}</p>
              </button>
            ))}
          </div>

        </div>
      </div>
    )
  }

  // ACTIVE CHAT VIEW
  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-transparent", className)}>
      <Conversation>
        <ConversationContent>
          {messages.map((message: any) => {
            const messageText = getMessageText(message)
            const sources = extractSources(message)
            const planSteps = extractPlanSteps(message)
            const timestampLabel = getMessageTimestamp(message)
            const statusBadge = getMessageStatus(message)
            const canRegenerate =
              message.role === 'assistant' &&
              message.id === lastAssistantMessageId &&
              Boolean(regenerate) &&
              !isLoading
            const statusToneClass = statusBadge ? statusToneClassMap[statusBadge.tone] : ''

            return (
              <Message key={message.id} from={message.role} className={message.role === 'user' ? 'ml-auto' : ''}>
                <MessageAvatar
                  src=""
                  name={message.role === 'user' ? "You" : "AI"}
                  className={message.role === 'user' ? "hidden" : "bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-black/50"}
                />
                <MessageContent
                  variant={message.role === 'user' ? 'contained' : 'flat'}
                  className={cn(
                    "shadow-lg backdrop-blur-sm",
                    message.role === 'user'
                      ? "bg-indigo-600 text-white border-0 rounded-2xl rounded-tr-sm"
                      : "bg-zinc-900/60 border border-white/5 rounded-2xl rounded-tl-sm"
                  )}
                >
                  {renderMessageContent(message, messageText)}

                  {message.role === 'assistant' && sources.length > 0 && <SourcesList sources={sources} />}
                  {message.role === 'assistant' && planSteps.length > 0 && <PlanList steps={planSteps} />}

                  <div className="mt-3 flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      {statusBadge && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', statusToneClass)}>
                          {statusBadge.label}
                        </span>
                      )}
                      {timestampLabel && <span>{timestampLabel}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {messageText && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-zinc-300 hover:text-white"
                          onClick={() => copyToClipboard(messageText, message.id)}
                        >
                          {copiedId === message.id ? (
                            <Check className="mr-1.5 h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Copy
                        </Button>
                      )}
                      {canRegenerate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-zinc-300 hover:text-white"
                          onClick={() => regenerate?.()}
                        >
                          Regenerate
                        </Button>
                      )}
                    </div>
                  </div>
                </MessageContent>
              </Message>
            )
          })}

          {isLoading && (
            <Message from="assistant">
              <MessageAvatar src="" name="AI" className="bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-black/50" />
              <MessageContent variant="flat" className="bg-zinc-900/60 border border-white/5 rounded-2xl rounded-tl-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{activeToolName ? `Using ${formatToolName(activeToolName)}...` : 'Thinking...'}</span>
                </div>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton className="bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur border border-white/10" />
      </Conversation>

      <div className="p-4 md:p-6 bg-transparent space-y-2">
        {(status === 'streaming' || status === 'submitted') && (
          <div className="flex justify-end gap-3 text-xs text-zinc-400">
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
            if (input.trim() && !isLoading && conversationId) {
              handleSendMessage({ text: input })
              setInput('')
            }
          }}
          disabled={isLoading || !conversationId}
          placeholder={placeholder}
          className="bg-transparent"
        />

      </div>
    </div>
  )
})

AIChatInterface.displayName = 'AIChatInterface'
