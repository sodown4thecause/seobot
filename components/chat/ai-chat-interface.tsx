'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState, forwardRef, useMemo } from 'react'
import { Sparkles, Copy, Check, Loader2, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatInput } from '@/components/chat/chat-input'
import { renderMessageComponent, type MessageComponent } from './message-types'
import { ExportButton } from '@/components/ui/export-button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// AI Elements Imports
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageAvatar, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'

interface AIChatInterfaceProps {
  context?: any
  className?: string
  placeholder?: string
  onComponentSubmit?: (component: string, data: any) => void
  initialMessage?: string
  workflowResults?: any
}

const formatToolName = (name: string) => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const ToolInvocation = ({ toolCall, onComponentSubmit }: { toolCall: any, onComponentSubmit: (data: any) => void }) => {
  const { toolName, args, state, result } = toolCall
  const isLoading = state !== 'result'
  const isSuccess = state === 'result'
  // In AI SDK 6, error state might be different, but we can infer from result or lack thereof if needed.
  // For now assuming result presence = success.
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

  // For technical tools (Search, SEO analysis, etc.)
  return (
    <div className={cn(
      "bg-zinc-900/50 border rounded-md my-2 overflow-hidden transition-all",
      isSuccess ? "border-zinc-800" : "border-zinc-700",
      isLoading && "animate-pulse border-zinc-700"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-6 h-6 rounded flex items-center justify-center",
              isLoading ? "bg-blue-500/10 text-blue-400" : "bg-zinc-800 text-zinc-400"
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
          </div>
          <CollapsibleTrigger asChild>
            <button className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="border-t border-zinc-800 p-3 space-y-3 bg-black/20">
            {/* Input */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Input</div>
              <div className="bg-zinc-950 rounded p-2 border border-zinc-800/50">
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono overflow-x-auto">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
            </div>

            {/* Output */}
            {result && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Output</div>
                <div className="bg-zinc-950 rounded p-2 border border-zinc-800/50 max-h-60 overflow-y-auto">
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

export const AIChatInterface = forwardRef<HTMLDivElement, AIChatInterfaceProps>(({
  context,
  className,
  placeholder = "Type your message...",
  onComponentSubmit,
  initialMessage,
  workflowResults
}, ref) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [input, setInput] = useState('')

  // AI SDK 6: useChat hook with DefaultChatTransport
  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
  } = useChat({
    id: 'dashboard-chat',
    messages: initialMessage
      ? [{ role: 'assistant' as const, content: initialMessage, id: 'initial', parts: [] }]
      : undefined,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { context },
    }),
    onError: (error: Error) => {
      console.error('[Chat] Stream error:', error)
    },
    onFinish: (message: any) => {
      console.log('[Chat] Message finished:', message)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Debug: Log messages state
  useEffect(() => {
    console.log('[Chat] Messages updated:', {
      count: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        hasContent: !!m.content,
        hasParts: !!m.parts,
        contentLength: m.content?.length || 0,
      })),
      status,
      isLoading,
    })
  }, [messages, status, isLoading])

  const handleSendMessage = (data: { text: string }) => {
    if (!data.text.trim()) return

    // AI SDK 6: Use sendMessage with text parameter
    sendMessage({ text: data.text })
  }

  // Handle workflow results injection as a synthetic tool message
  useEffect(() => {
    if (workflowResults && workflowResults.components) {
      const toolInvocations = workflowResults.components.map((comp: any, index: number) => ({
        toolCallId: `workflow-ui-${Date.now()}-${index}`,
        toolName: 'client_ui',
        args: { component: comp.component, props: comp.props },
        state: 'result',
        result: { displayed: true }
      }))

      const workflowMessage: any = {
        id: `workflow-${Date.now()}`,
        role: 'assistant',
        content: workflowResults.summary || 'Workflow completed successfully!',
        toolInvocations: toolInvocations
      }

      setMessages((prev: any[]) => [...prev, workflowMessage])
    }
  }, [workflowResults, setMessages])

  const handleComponentSubmit = (componentType: string, data: any) => {
    if (onComponentSubmit) {
      onComponentSubmit(componentType, data)
    }

    const message = formatComponentData(componentType, data)
    handleSendMessage({ text: message })
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

  // Smart loading state: Check for active tools
  const activeToolName = useMemo(() => {
    if (!isLoading) return null
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.toolInvocations) {
      const active = lastMessage.toolInvocations.find((t: any) => t.state !== 'result')
      return active ? active.toolName : null
    }
    return null
  }, [messages, isLoading])

  const renderMessageContent = (message: any) => {
    // Debug: Log message structure
    console.log('[Chat] Rendering message:', { 
      id: message.id, 
      role: message.role, 
      content: message.content,
      parts: message.parts,
      hasContent: !!message.content,
      hasParts: !!message.parts
    })

    // AI SDK 6: Messages might have parts instead of content
    let textContent = message.content
    
    // If no content but has parts, extract text from parts
    if (!textContent && message.parts) {
      const textParts = message.parts.filter((part: any) => part.type === 'text')
      textContent = textParts.map((part: any) => part.text).join('')
    }

    return (
      <>
        {textContent && (
          message.role === 'assistant' ? (
            <Response className="prose prose-invert prose-sm max-w-none">{textContent}</Response>
          ) : (
            <div className="whitespace-pre-wrap break-words">
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
        
        {/* AI SDK 6: Handle tool-call parts */}
        {message.parts?.filter((part: any) => part.type === 'tool-call').map((toolCall: any) => (
          <ToolInvocation
            key={toolCall.toolCallId}
            toolCall={{
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              args: toolCall.input,
              state: 'result',
            }}
            onComponentSubmit={(data) => handleComponentSubmit(toolCall.toolName, data)}
          />
        ))}
      </>
    )
  }

  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-background", className)}>
      <Conversation>
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-zinc-50" />
                </div>
              }
              title="Ready to Create?"
              description="I'm your AI assistant. How can I help you today?"
            />
          )}

          {messages.map((message: any) => (
            <Message key={message.id} from={message.role}>
              <MessageAvatar
                src=""
                name={message.role === 'user' ? "You" : "AI"}
              />
              <MessageContent variant={message.role === 'user' ? 'contained' : 'flat'}>
                {renderMessageContent(message)}

                {/* Actions for assistant */}
                {message.role === 'assistant' && message.content && (
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        copyToClipboard(message.content, message.id)
                      }}
                      className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 rounded hover:bg-zinc-800"
                      title="Copy to clipboard"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          <span className="text-green-500">Copied</span>
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
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    />
                  </div>
                )}
              </MessageContent>
            </Message>
          ))}

          {isLoading && !activeToolName && (
            <Message from="assistant">
              <MessageAvatar src="" name="AI" />
              <MessageContent variant="flat">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </MessageContent>
            </Message>
          )}

          {isLoading && activeToolName && (
            <Message from="assistant">
              <MessageAvatar src="" name="AI" />
              <MessageContent variant="flat">
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Using {formatToolName(activeToolName)}...</span>
                </div>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-4 bg-background border-t border-zinc-800">
        <ChatInput
          value={input}
          onChange={(value) => {
            setInput(value)
          }}
          onSubmit={() => {
            if (input.trim() && !isLoading) {
              console.log('[Chat] Sending message:', input)
              handleSendMessage({ text: input })
              setInput('')
            }
          }}
          disabled={isLoading}
          placeholder={placeholder}
          showQuickActions={messages.length === 0}
          onQuickActionClick={(text) => {
            console.log('[Chat] Sending quick action:', text)
            handleSendMessage({ text })
          }}
        />
      </div>
    </div>
  )
})

AIChatInterface.displayName = 'AIChatInterface'
