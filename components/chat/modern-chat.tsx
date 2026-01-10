'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage as Message } from 'ai'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useAIState } from '@/lib/context/ai-state-context'
import { AgentHandoffCard } from './agent-handoff-card'
import { Send, Sparkles, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeywordSuggestionsTable } from './tool-ui/keyword-suggestions-table'
import { BacklinksTable } from './tool-ui/backlinks-table'
import { SERPTable } from './tool-ui/serp-table'
import { FirecrawlResults } from './tool-ui/firecrawl-results'
import { KeywordArtifact } from './artifacts/keyword-artifact'
import { BacklinkArtifact } from './artifacts/backlink-artifact'
import { ToastArtifact, ToastMessage } from './artifacts/toast-artifact'
import { useArtifactStore } from '@/lib/artifacts/artifact-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Message as AIMessage, MessageAvatar, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import { Loader } from '@/components/ai-elements/loader'
import { ChatInput } from '@/components/chat/chat-input'

interface ModernChatProps {
  context?: any
  placeholder?: string
}

export function ModernChat({ context, placeholder = "Message the AI" }: ModernChatProps) {
  const { focus, setFocus, fetchRoadmap } = useAIState()
  const [input, setInput] = useState('')

  const [showHandoff, setShowHandoff] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)

  const { artifacts, updateArtifact } = useArtifactStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const handoffTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      body: { context },
    })
  }, [context])

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    transport,
    onError: (err: any) => {
      console.error('[Chat] Error:', err)
      // Handle error gracefully - don't break the UI
    },
  })

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (handoffTimeoutRef.current) clearTimeout(handoffTimeoutRef.current)
      toastTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      toastTimeoutsRef.current.clear()
    }
  }, [])

  // Cache for message text to avoid repeated filtering/mapping
  const messageTextCache = useRef(new WeakMap<object, string>())

  // Safely access properties
  const isLoading = status === 'streaming' || status === 'submitted'

  const getMessageText = (message: any): string => {
    // Check cache first
    const cached = messageTextCache.current.get(message)
    if (cached !== undefined) {
      return cached
    }

    let result = ''

    if (typeof message.content === 'string' && message.content.trim().length > 0) {
      result = message.content
    } else if (Array.isArray(message.parts)) {
      result = message.parts
        .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
        .map((part: any) => part.text)
        .join('')
    }

    // Cache the result
    messageTextCache.current.set(message, result)
    return result
  }

  const handleSendMessage = (data: { text: string }) => {
    if (sendMessage) {
      sendMessage({ text: data.text })
    }
  }

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
    
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      toastTimeoutsRef.current.delete(id)
    }, 5000)
    
    toastTimeoutsRef.current.set(id, timeoutId)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    
    // Clear the timeout if it exists
    const timeoutId = toastTimeoutsRef.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      toastTimeoutsRef.current.delete(id)
    }
  }

  useEffect(() => {
    // Refresh roadmap and detect intent on completion
    if (status === 'ready' && messages.length > 0) {
      const lastRole = messages[messages.length - 1].role
      if (lastRole === 'assistant') {
        fetchRoadmap()

        const text = getMessageText(messages[messages.length - 1]).toLowerCase()
        let detectedFocus = null
        if (text.includes('keyword') || text.includes('search volume')) detectedFocus = 'keyword_research'
        else if (text.includes('competitor') || text.includes('gap')) detectedFocus = 'gap_analysis'
        else if (text.includes('backlink') || text.includes('authority')) detectedFocus = 'link_building'
        else if (text.includes('write') || text.includes('article')) detectedFocus = 'content_production'

        if (detectedFocus && detectedFocus !== focus) {
          // Clear any existing handoff timeout
          if (handoffTimeoutRef.current) {
            clearTimeout(handoffTimeoutRef.current)
          }

          setFocus(detectedFocus)
          setShowHandoff(true)
          handoffTimeoutRef.current = setTimeout(() => setShowHandoff(false), 8000) // Hide after 8s
        }
      }
    }
  }, [messages, status, fetchRoadmap, focus, setFocus])

  // Artifact Synchronization - Handle side effects outside render
  useEffect(() => {
    messages.forEach((message: any) => {
      const toolInvocations = message.toolInvocations
      if (!toolInvocations || !Array.isArray(toolInvocations)) return

      toolInvocations.forEach((tool: any) => {
        const isSuccess = tool.state === 'result'
        const isExecuting = tool.state === 'call' || tool.state === 'executing'
        const isActive = isSuccess || isExecuting

        if (!isActive) return

        // Handle keyword research tool
        if (tool.toolName === 'suggest_keywords') {
          if (isExecuting) {
            updateArtifact('keyword-research', { 
              type: 'keyword', 
              title: 'Keyword Research', 
              status: 'streaming', 
              data: null 
            })
            setActiveArtifactId('keyword-research')
          } else if (isSuccess) {
            updateArtifact('keyword-research', { 
              status: 'complete', 
              data: tool.result 
            })
            addToast('success', 'Keyword research analysis complete.')
          }
        }

        // Handle backlinks tool
        if (tool.toolName === 'n8n_backlinks') {
          if (isExecuting) {
            updateArtifact('backlink-analysis', { 
              type: 'backlink', 
              title: 'Backlink Analysis', 
              status: 'streaming', 
              data: null 
            })
            setActiveArtifactId('backlink-analysis')
          } else if (isSuccess) {
            updateArtifact('backlink-analysis', { 
              status: 'complete', 
              data: tool.result 
            })
            addToast('success', 'Backlink profile analysis complete.')
          }
        }
      })
    })
  }, [messages, updateArtifact, addToast])

  const renderToolInvocation = (toolInvocation: { toolName: string; state: string; result?: any }, index: number) => {
    const { toolName, state } = toolInvocation
    const isSuccess = state === 'result'
    const isExecuting = state === 'call' || state === 'executing'
    const isActive = isSuccess || isExecuting

    if (toolName === 'suggest_keywords' && isActive) {
      return (
        <div key={index} className="w-full my-4">
          <KeywordSuggestionsTable toolInvocation={toolInvocation} />
        </div>
      )
    }

    if (toolName === 'n8n_backlinks' && isActive) {
      return (
        <div key={index} className="w-full my-4">
          <BacklinksTable toolInvocation={toolInvocation} />
        </div>
      )
    }

    if ((toolName === 'serp_organic_live_advanced' || toolName === 'dataforseo_labs_google_serp_competitors') && isActive) {
      return (
        <div key={index} className="w-full my-4">
          <SERPTable toolInvocation={toolInvocation} />
        </div>
      )
    }

    if ((toolName === 'firecrawl_scrape' || toolName === 'firecrawl_search') && isActive) {
      return (
        <div key={index} className="w-full my-4">
          <FirecrawlResults toolInvocation={toolInvocation} />
        </div>
      )
    }

    // Fallback for other tools or if rendering is not implemented
    return (
      <div key={index} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl text-xs text-zinc-500 my-2 font-mono flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
        Tool: <span className="text-zinc-300 font-bold">{toolName}</span> ({state})
      </div>
    )
  }

  const activeArtifact = activeArtifactId ? artifacts[activeArtifactId] : null;

  return (
    <div className="flex w-full h-full overflow-hidden bg-zinc-950">
      {/* Main Chat Area */}
      <div className={cn(
        "flex flex-col h-full transition-all duration-500 ease-in-out",
        activeArtifact ? "w-1/2 border-r border-zinc-800" : "w-full"
      )}>
        <Conversation className="flex-1 overflow-hidden">
          <ConversationContent className="px-4 py-8 max-w-3xl mx-auto space-y-8">
            {messages.map((message, idx) => (
              <AIMessage key={message.id || idx} from={message.role as any}>
                <MessageAvatar role={message.role as any} isUser={message.role === 'user'} />
                <MessageContent>
                  <Response isStreaming={status === 'streaming' && idx === messages.length - 1}>
                    {getMessageText(message)}
                  </Response>

                  {(message as any).toolInvocations?.map((toolInvocation: any, tIdx: number) => (
                    renderToolInvocation(toolInvocation, tIdx)
                  ))}
                </MessageContent>
              </AIMessage>
            ))}
            {isLoading && (
              <AIMessage from="assistant">
                <MessageAvatar name="AI" />
                <MessageContent>
                  <Loader />
                </MessageContent>
              </AIMessage>
            )}
            <div ref={messagesEndRef} />
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="p-4 border-t border-zinc-900 bg-zinc-950">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              value={input}
              onChange={(e: any) => setInput(e.target.value)}
              onSubmit={() => {
                handleSendMessage({ text: input })
                setInput('')
              }}
              placeholder={placeholder}
            />
          </div>
        </div>
      </div>

      {/* Artifact Side Panel */}
      <AnimatePresence>
        {activeArtifact && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="w-1/2 h-full border-l border-zinc-800 bg-zinc-950 flex flex-col relative"
          >
            <button
              onClick={() => setActiveArtifactId(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Send className="w-4 h-4 rotate-45" /> {/* Close icon substitute */}
            </button>

            {activeArtifact.type === 'keyword' && (
              <KeywordArtifact data={activeArtifact.data} status={activeArtifact.status} />
            )}
            {activeArtifact.type === 'backlink' && (
              <BacklinkArtifact data={activeArtifact.data} status={activeArtifact.status} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ToastArtifact toasts={toasts} onRemove={removeToast} />

      {showHandoff && focus && (
        <div className="fixed top-20 right-8 z-50 w-80 pointer-events-none">
          <AgentHandoffCard intent={focus as any} />
        </div>
      )}
    </div>
  )
}
