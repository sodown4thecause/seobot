'use client'

import { useChat } from '@ai-sdk/react'
import type { UIMessage as Message } from 'ai'
import { useEffect, useState, forwardRef } from 'react'
import { Sparkles, Copy, Check, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatInput } from '@/components/chat/chat-input'
import { renderMessageComponent, type MessageComponent } from './message-types'
import { ExportButton } from '@/components/ui/export-button'

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

export const AIChatInterface = forwardRef<HTMLDivElement, AIChatInterfaceProps>(({
  context,
  className,
  placeholder = "Type your message...",
  onComponentSubmit,
  initialMessage,
  workflowResults
}, ref) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingComponents, setPendingComponents] = useState<Map<string, MessageComponent>>(new Map())
  const [input, setInput] = useState('')

  const chat = useChat({
    api: '/api/chat',
    body: { context },
    streamProtocol: 'ui-message',
    initialMessages: initialMessage ? [{ role: 'assistant', content: initialMessage, id: 'initial' }] : undefined,
    onFinish: (message: any) => {
      console.log('[Chat] Message finished:', message)
      const textContent: string = message.content || ''
      parseComponentsFromMessage(textContent, message.id)
    },
    onError: (error: any) => {
      console.error('[Chat] Stream error:', error)
    },
  } as any) as any

  const messages = chat?.messages || []
  const append = chat?.append || chat?.sendMessage
  const status = chat?.status || 'ready'
  const setMessages = chat?.setMessages
  
  const isLoading = status === 'streaming' || status === 'submitted'

  const sendMessage = (data: { text: string }) => {
    if (append) {
      append({ role: 'user', content: data.text })
    } else {
      console.error('[Chat] No send function available')
    }
  }

  useEffect(() => {
    if (workflowResults && workflowResults.components) {
      const workflowMessage: any = {
        id: `workflow-${Date.now()}`,
        role: 'assistant',
        content: workflowResults.summary || 'Workflow completed successfully!',
        parts: [{ type: 'text', text: workflowResults.summary || 'Workflow completed successfully!' }],
      }

      setMessages((prev: any[]) => [...prev, workflowMessage])

      workflowResults.components.forEach((comp: any) => {
        setPendingComponents(prev => new Map(prev.set(workflowMessage.id, comp)))
      })
    }
  }, [workflowResults, setMessages])

  const parseComponentsFromMessage = (content: string, messageId: string) => {
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
    setPendingComponents(prev => {
      const newMap = new Map(prev)
      newMap.delete(messageId)
      return newMap
    })

    if (onComponentSubmit) {
      onComponentSubmit(component.component, data)
    }

    const message = formatComponentData(component.component, data)
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

  const renderMessageContent = (message: any, messageId: string) => {
    let textContent: string = message.content || ''

    if (!textContent && message.parts && Array.isArray(message.parts)) {
      textContent = message.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('')
    }

    const cleanedContent = textContent.replace(/```json\n[\s\S]*?\n```/g, '').trim()
    const component = pendingComponents.get(messageId)
    const toolCalls = message.toolInvocations || []

    return (
      <>
        {cleanedContent && (
          message.role === 'assistant' ? (
            <Response className="prose prose-invert prose-sm max-w-none">{cleanedContent}</Response>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {cleanedContent}
            </div>
          )
        )}
        {toolCalls.length > 0 && (
          <div className="mt-4 space-y-3">
            {toolCalls.map((toolCall: any, index: number) => {
              const toolName = toolCall.toolName
              const toolInput = toolCall.args
              const toolOutput = toolCall.result
              const toolState = toolCall.state
              const isLoading = toolState !== 'result'
              const isSuccess = toolState === 'result'
              const isError = false 

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
                <div
                  key={index}
                  className={cn(
                    "bg-zinc-900",
                    "border rounded-md p-4 space-y-3",
                    isError ? "border-red-500/30" : "border-zinc-800",
                    isSuccess && !isError && "border-green-900/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center bg-zinc-800",
                        isLoading && "animate-pulse",
                      )}>
                        {isLoading && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                        {isSuccess && !isError && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {isError && <XCircle className="w-4 h-4 text-red-500" />}
                        {!isLoading && !isSuccess && !isError && (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-100 font-mono">
                          {toolName}
                        </span>
                        {toolState && (
                          <span className={cn(
                            "text-xs mt-0.5",
                            isSuccess && !isError ? 'text-green-500' :
                              isError ? 'text-red-500' :
                                'text-zinc-500'
                          )}>
                            {toolState}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {toolInput && (
                    <div className="bg-black rounded-md p-3 border border-zinc-800">
                      <div className="text-xs font-medium text-zinc-500 mb-1.5 font-mono">Input</div>
                      <div className="text-sm text-zinc-300 font-mono">
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
                      "rounded-md p-3 border max-h-48 overflow-y-auto",
                      isError ? "bg-red-900/10 border-red-500/30" : "bg-green-900/10 border-green-900/30"
                    )}>
                      <div className={cn(
                        "text-xs font-medium mb-1.5 font-mono",
                        isError ? "text-red-400" : "text-green-400"
                      )}>
                        {isError ? "Error" : "Output"}
                      </div>
                      <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words font-mono">
                        {typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                  {toolCall.errorText && (
                    <div className="bg-red-900/10 border border-red-500/30 rounded-md p-3">
                      <div className="text-xs font-medium text-red-400 mb-1 font-mono">Error</div>
                      <div className="text-sm text-red-300 font-mono">{toolCall.errorText}</div>
                    </div>
                  )}
                </div>
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
                {renderMessageContent(message, message.id)}
                
                {/* Actions for assistant */}
                {message.role === 'assistant' && (
                   <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const textContent = message.content || ''
                          copyToClipboard(textContent, message.id)
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
          
          {isLoading && (
            <Message from="assistant">
               <MessageAvatar src="" name="AI" />
               <MessageContent variant="flat">
                 <div className="flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   <span>Thinking...</span>
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
