'use client'

import { useChat } from '@ai-sdk/react'
import type { UIMessage as Message } from 'ai'
import { useEffect, useRef, useState, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Copy, Check, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatInput } from '@/components/chat/chat-input'
import { renderMessageComponent, type MessageComponent } from './message-types'
import { ExportButton } from '@/components/ui/export-button'

interface AIChatInterfaceProps {
  context?: any
  className?: string
  placeholder?: string
  onComponentSubmit?: (component: string, data: any) => void
  initialMessage?: string
  workflowResults?: any
}

export const AIChatInterface = forwardRef<HTMLDivElement, AIChatInterfaceProps>(({
  context,
  className,
  placeholder = "Type your message...",
  onComponentSubmit,
  initialMessage,
  workflowResults
}, ref) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingComponents, setPendingComponents] = useState<Map<string, MessageComponent>>(new Map())
  const [input, setInput] = useState('')

  const chat = useChat({
    api: '/api/chat', // Explicit API endpoint for AI SDK 6
    body: { context }, // Pass context to backend
    streamProtocol: 'ui-message', // AI SDK 6 default protocol
    initialMessages: initialMessage ? [{ role: 'assistant', content: initialMessage, id: 'initial' }] : undefined,
    onFinish: (message: any) => {
      console.log('[Chat] Message finished:', message)
      scrollToBottom()
      // Parse components from message
      const textContent: string = message.content || ''
      parseComponentsFromMessage(textContent, message.id)
    },
    onError: (error: any) => {
      console.error('[Chat] Stream error:', error)
      console.error('[Chat] Error details:', {
        message: error?.message,
        stack: error?.stack,
        error
      })
      // Handle error gracefully - don't break the UI
    },
  } as any) as any

  // console.log('[Chat] useChat hook result:', chat)
  
  // Safely access properties
  const messages = chat?.messages || []
  const append = chat?.append || chat?.sendMessage // Fallback to sendMessage if append is missing
  const status = chat?.status || 'ready'
  const setMessages = chat?.setMessages
  
  const isLoading = status === 'streaming' || status === 'submitted'

  const sendMessage = (data: { text: string }) => {
    // Check if we have append (newer SDK) or sendMessage (older SDK/compat)
    if (append) {
      // If it's the newer SDK 'append', it expects a message object
      // If it's the older 'sendMessage', it often expected { text } or a message object.
      // Let's try the standard message object which is most robust across versions.
      append({ role: 'user', content: data.text })
    } else {
      console.error('[Chat] No send function available')
    }
  }

  // Inject workflow results as a message when they arrive
  useEffect(() => {
    if (workflowResults && workflowResults.components) {
      console.log('[Chat] Injecting workflow results:', workflowResults)

      // Create a message with workflow results
      const workflowMessage: any = {
        id: `workflow-${Date.now()}`,
        role: 'assistant',
        content: workflowResults.summary || 'Workflow completed successfully!',
        parts: [{ type: 'text', text: workflowResults.summary || 'Workflow completed successfully!' }],
      }

      // Add the message to chat
      setMessages((prev: any[]) => [...prev, workflowMessage])

      // Add components to pending components for rendering
      workflowResults.components.forEach((comp: any) => {
        setPendingComponents(prev => new Map(prev.set(workflowMessage.id, comp)))
      })

      scrollToBottom()
    }
  }, [workflowResults])

  const parseComponentsFromMessage = (content: string, messageId: string) => {
    // Look for JSON code blocks in the message
    const jsonRegex = /```json\n([\s\S]*?)\n```/g
    const matches = Array.from(content.matchAll(jsonRegex))

    if (matches.length > 0) {
      matches.forEach((match) => {
        try {
          const component: MessageComponent = JSON.parse(match[1])
          if (component.component) {
            setPendingComponents(prev => new Map(prev.set(messageId, component)))
          }
        } catch (e) {
          console.error('Failed to parse component:', e)
        }
      })
    }
  }

  const handleComponentSubmit = (messageId: string, component: MessageComponent, data: any) => {
    // Remove pending component
    setPendingComponents(prev => {
      const newMap = new Map(prev)
      newMap.delete(messageId)
      return newMap
    })

    // Send data to chat
    if (onComponentSubmit) {
      onComponentSubmit(component.component, data)
    }

    // Append user message with component data
    const message = formatComponentData(component.component, data)
    console.log('[Chat] Sending component message:', message)
    sendMessage({ text: message })
  }

  const formatComponentData = (componentType: string, data: any): string => {
    switch (componentType) {
      case 'url_input':
        return `My website URL is: ${data}`
      case 'card_selector':
        return `I selected: ${Array.isArray(data) ? data.join(', ') : data}`
      case 'location_picker':
        return `My location is: ${data.country}${data.region ? `, ${data.region}` : ''}${data.city ? `, ${data.city}` : ''}`
      case 'confirmation_buttons':
        return data
      default:
        return JSON.stringify(data)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, pendingComponents])

  const renderMessageContent = (message: any, messageId: string) => {
    console.log('[Chat] Rendering message:', { id: messageId, role: message.role, content: message.content, parts: message.parts, tools: message.toolInvocations })

    let textContent: string = message.content || ''

    // Handle AI SDK 6 parts format if content is empty
    if (!textContent && message.parts && Array.isArray(message.parts)) {
      textContent = message.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('')
    }

    // Remove JSON code blocks from display
    const cleanedContent = textContent.replace(/```json\n[\s\S]*?\n```/g, '').trim()
    const component = pendingComponents.get(messageId)

    // Find tool calls
    // AI SDK 6 uses toolInvocations
    const toolCalls = message.toolInvocations || []

    return (
      <>
        {cleanedContent && (
          <div className="whitespace-pre-wrap break-words prose prose-invert prose-sm max-w-none">
            <div className="text-white/90 leading-relaxed">
              {cleanedContent.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < cleanedContent.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        )}
        {toolCalls.length > 0 && (
          <div className="mt-4 space-y-3">
            {toolCalls.map((toolCall: any, index: number) => {
              const toolName = toolCall.toolName
              const toolInput = toolCall.args
              // AI SDK 6: result is in 'result' property
              const toolOutput = toolCall.result
              const toolState = toolCall.state
              const isLoading = toolState !== 'result'
              const isSuccess = toolState === 'result'
              const isError = false // AI SDK 6 handles errors differently, usually via state

              if (toolName === 'client_ui') {
                const componentData = {
                  component: toolInput.component,
                  props: toolInput.props || {}
                }

                return (
                  <div key={index} className="mt-4 w-full">
                    {renderMessageComponent(componentData, (data) => handleComponentSubmit(messageId, componentData, data))}
                  </div>
                )
              }

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm",
                    "border rounded-xl p-4 space-y-3",
                    "transition-all duration-200",
                    isError ? "border-red-500/30" : "border-white/10",
                    isSuccess && !isError && "border-green-500/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        isLoading && "bg-blue-500/20 animate-pulse",
                        isSuccess && !isError && "bg-green-500/20",
                        isError && "bg-red-500/20"
                      )}>
                        {isLoading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                        {isSuccess && !isError && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {isError && <XCircle className="w-4 h-4 text-red-400" />}
                        {!isLoading && !isSuccess && !isError && (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">
                          {toolName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                        {toolState && (
                          <span className={cn(
                            "text-xs mt-0.5",
                            isSuccess && !isError ? 'text-green-400' :
                              isError ? 'text-red-400' :
                                'text-blue-400'
                          )}>
                            {toolState.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {toolInput && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs font-medium text-white/70 mb-1.5">Input</div>
                      <div className="text-sm text-white/90 font-mono">
                        {typeof toolInput === 'object' ? (
                          <pre className="whitespace-pre-wrap break-words text-xs">
                            {JSON.stringify(toolInput, null, 2)}
                          </pre>
                        ) : (
                          toolInput
                        )}
                      </div>
                    </div>
                  )}
                  {toolOutput && (isSuccess || isError) && (
                    <div className={cn(
                      "rounded-lg p-3 border max-h-48 overflow-y-auto",
                      isError ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"
                    )}>
                      <div className={cn(
                        "text-xs font-medium mb-1.5",
                        isError ? "text-red-400" : "text-green-400"
                      )}>
                        {isError ? "Error" : "Output"}
                      </div>
                      <pre className="text-xs text-white/90 whitespace-pre-wrap break-words font-mono">
                        {typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                  {toolCall.errorText && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <div className="text-xs font-medium text-red-400 mb-1">Error</div>
                      <div className="text-sm text-red-300">{toolCall.errorText}</div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
        {component && (
          <div className="mt-4">
            {renderMessageComponent(component, (data) => handleComponentSubmit(messageId, component, data))}
          </div>
        )}
      </>
    )
  }

  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Create Something New?</h2>
            <p className="text-white/80 max-w-md mb-6">
              I'm your AI SEO assistant. I can help you analyze competitors, find keyword opportunities,
              and create optimized content.
            </p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((message: any) => {
            const isUser = message.role === 'user'
            const isAssistant = message.role === 'assistant'
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "group flex items-start gap-3",
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {isAssistant && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5 max-w-[85%]">
                  <div
                    className={cn(
                      "rounded-2xl px-5 py-4 shadow-2xl transition-all duration-200",
                      isUser
                        ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 text-white rounded-tr-sm hover:border-white/30'
                        : 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 text-white rounded-tl-sm hover:border-white/20'
                    )}
                  >
                    {renderMessageContent(message, message.id)}
                  </div>
                  {isAssistant && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <button
                        onClick={() => {
                          const textContent = message.content || ''
                          copyToClipboard(textContent, message.id)
                        }}
                        className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded hover:bg-muted"
                        title="Copy to clipboard"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3 text-primary" />
                            <span className="text-primary">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <ExportButton
                        content={message.content || ''}
                        size="sm"
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 justify-start"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center mt-1">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-sm text-white/70">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4">
        <ChatInput
          value={input}
          onChange={(value) => {
            setInput(value)
          }}
          onSubmit={() => {
            if (input.trim() && !isLoading) {
              console.log('[Chat] Sending message:', input)
              sendMessage({ text: input })
              setInput('')
            }
          }}
          disabled={isLoading}
          placeholder={placeholder}
          showQuickActions={messages.length === 0}
          onQuickActionClick={(text) => {
            console.log('[Chat] Sending quick action:', text)
            sendMessage({ text })
          }}
        />
      </div>
    </div>
  )
})
