'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage as Message } from 'ai'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Send, Sparkles, Copy, Check } from 'lucide-react'
import { KeywordSuggestionsTable } from './tool-ui/keyword-suggestions-table'

interface ModernChatProps {
  context?: any
  placeholder?: string
}

export function ModernChat({ context, placeholder = "Message the AI" }: ModernChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [input, setInput] = useState('')

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
    error,
  } = useChat({
    transport,
    onError: (err: any) => {
      console.error('[Chat] Error:', err)
      // Handle error gracefully - don't break the UI
    },
  })

  // Safely access properties
  const isLoading = status === 'streaming' || status === 'submitted'

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

  const handleSendMessage = (data: { text: string }) => {
    if (sendMessage) {
      sendMessage({ text: data.text })
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const renderToolInvocation = (toolInvocation: { toolName: string; state: string }, index: number) => {
    if (toolInvocation.toolName === 'suggest_keywords') {
      return (
        <div key={index} className="w-full my-2">
          <KeywordSuggestionsTable toolInvocation={toolInvocation} />
        </div>
      )
    }

    // Fallback for other tools or if rendering is not implemented
    return (
      <div key={index} className="bg-gray-800 p-2 rounded text-xs text-gray-400 my-1 font-mono">
        Tool: {toolInvocation.toolName} ({toolInvocation.state})
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#1a1d29',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '12px',
            opacity: 0.6
          }}>
            <Sparkles size={48} style={{ color: '#8b5cf6' }} />
            <p style={{ fontSize: '18px', fontWeight: 500 }}>How can I help you today?</p>
          </div>
        )}

        {messages.map((message: any) => {
          // Handle both simple content and tool invocations
          // AI SDK 6 typically attaches toolInvocations to the message
          const toolInvocations = message.toolInvocations || [];
          const text = getMessageText(message);

          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              <div style={{
                display: 'flex',
                gap: '12px',
                maxWidth: message.role === 'user' ? '85%' : '100%',
                width: message.role === 'assistant' ? '100%' : 'auto',
                alignItems: 'flex-start',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
              }}>
                {message.role === 'assistant' && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Sparkles size={16} />
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {text && (
                    <div style={{
                      backgroundColor: message.role === 'user' ? '#2d3748' : '#2a2f3f',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxWidth: '100%' // Ensure text doesn't overflow if container is full width
                    }}>
                      {text}
                    </div>
                  )}

                  {/* Render Tool Invocations */}
                  {toolInvocations.length > 0 && (
                    <div className="w-full mt-2">
                      {toolInvocations.map((toolInvocation: any, index: number) =>
                        renderToolInvocation(toolInvocation, index)
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'assistant' && text && (
                  <button
                    onClick={() => copyToClipboard(text, message.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      color: copiedId === message.id ? '#10b981' : '#6b7280',
                      transition: 'all 0.2s',
                      opacity: 0.7,
                      height: 'fit-content'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.backgroundColor = '#374151'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {copiedId === message.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} />
            </div>
            <div style={{
              backgroundColor: '#2a2f3f',
              padding: '12px 16px',
              borderRadius: '16px',
              display: 'flex',
              gap: '6px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#8b5cf6',
                animation: 'bounce 1s infinite'
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#8b5cf6',
                animation: 'bounce 1s infinite 0.15s'
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#8b5cf6',
                animation: 'bounce 1s infinite 0.3s'
              }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #374151'
      }}>
        <form onSubmit={(e) => {
          e.preventDefault()
          if (input.trim() && !isLoading) {
            console.log('[Chat] Sending message:', input)
            handleSendMessage({ text: input })
            setInput('')
          }
        }} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <input
              id="modern-chat-input"
              name="modern-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                backgroundColor: '#2d3748',
                border: '1px solid #4a5568',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6'
                e.target.style.backgroundColor = '#374151'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#4a5568'
                e.target.style.backgroundColor = '#2d3748'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                position: 'absolute',
                right: '8px',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: input.trim() ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : '#4a5568',
                color: '#fff',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !isLoading) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
