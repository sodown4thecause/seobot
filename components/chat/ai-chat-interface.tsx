'use client'

import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Copy, Check } from 'lucide-react'
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
}

export function AIChatInterface({ 
  context, 
  className,
  placeholder = "Type your message...",
  onComponentSubmit,
  initialMessage
}: AIChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingComponents, setPendingComponents] = useState<Map<string, MessageComponent>>(new Map())
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    body: { context },
    initialMessages: initialMessage ? [{ role: 'assistant', content: initialMessage }] : undefined,
    onFinish: (message) => {
      scrollToBottom()
      // Parse components from message
      parseComponentsFromMessage(message.content, message.id)
    }
  })

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
    append({ role: 'user', content: message })
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

  const renderMessageContent = (content: string, messageId: string) => {
    // Remove JSON code blocks from display
    const cleanedContent = content.replace(/```json\n[\s\S]*?\n```/g, '').trim()
    const component = pendingComponents.get(messageId)
    
    return (
      <>
        {cleanedContent && (
          <div className="whitespace-pre-wrap break-words">
            {cleanedContent}
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
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "group flex items-start gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 shadow-2xl",
                    message.role === 'user'
                      ? 'bg-white/15 backdrop-blur-md border border-white/20 text-white rounded-tr-sm'
                      : 'glass text-white rounded-tl-sm'
                  )}
                >
                  {renderMessageContent(message.content, message.id)}
                </div>
                {message.role === 'assistant' && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
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
                      content={message.content}
                      size="sm"
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 justify-start"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
            handleInputChange({ target: { value } } as any)
          }}
          onSubmit={() => {
            if (input.trim() && !isLoading) {
              handleSubmit(new Event('submit') as any)
            }
          }}
          disabled={isLoading}
          placeholder={placeholder}
          showQuickActions={messages.length === 0}
          onQuickActionClick={(text) => {
            append({ role: 'user', content: text })
          }}
        />
      </div>
    </div>
  )
}
