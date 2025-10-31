'use client'

import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Sparkles, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { renderMessageComponent, type MessageComponent } from './message-types'

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
    <div className={cn("flex flex-col h-full min-h-0 bg-background", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to SEO Platform</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              I'm your AI SEO assistant. I can help you analyze competitors, find keyword opportunities, 
              and create optimized content. What would you like to work on today?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Analyze my competitors",
                "Find keyword opportunities",
                "Create SEO content",
                "Build link strategies"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => append({ role: 'user', content: suggestion })}
                  className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "group flex items-start gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mt-1">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === 'user'
                      ? 'bg-muted text-foreground'
                      : 'bg-card border border-border text-card-foreground'
                  )}
                >
                  {renderMessageContent(message.content, message.id)}
                </div>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity self-start px-2 py-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded hover:bg-muted"
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
      <div className="border-t border-border p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </div>
  )
}
