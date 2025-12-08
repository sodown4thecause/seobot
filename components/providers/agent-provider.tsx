// AgentProvider - Multi-Agent State Management
// Context provider for managing active agent, conversation state, and theming

'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { agentRegistry } from '@/lib/agents/registry'

// Types
export interface Agent {
  id: string
  name: string
  description: string
  personality: {
    tone: string
    style: string
    traits: string[]
    responseLength: string
    communicationStyle: string
  }
  color: string
  icon: string
  tools: Array<{
    name: string
    description: string
    category: string
    priority: string
    mcpToolNames?: string[]
  }>
  ragConfig: {
    frameworks: boolean
    agentDocuments: boolean
    conversationHistory: boolean
    maxContextLength: number
  }
}

export interface Conversation {
  id: string
  agentId: string
  title: string
  status: 'active' | 'archived' | 'pinned'
  agent: Agent
  createdAt: string
  updatedAt: string
  messageCount?: number
  lastMessage?: {
    content: string
    role: string
    createdAt: string
  }
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  type?: 'text' | 'image'  // Support image messages
  // Image message fields
  prompt?: string
  revisedPrompt?: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  seed?: number
  model?: string
  base64?: string
  imageBase64?: string
  url?: string
  providerMetadata?: any
  warnings?: any[]
  status?: 'loading' | 'done' | 'error'
  errorMessage?: string
  // Tool invocations and attachments
  toolInvocations?: any[]
  attachments?: Array<{
    id: string
    type: string
    url: string
    name?: string
    metadata?: any
  }>
}

export interface AgentState {
  // Current state
  activeAgent: Agent | null
  activeConversation: Conversation | null
  conversations: Conversation[]
  messages: Message[]

  // UI state
  isLoading: boolean
  error: string | null
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'

  // Pagination
  messagePagination: {
    hasMore: boolean
    offset: number
    limit: number
  }
}

type AgentAction =
  | { type: 'SET_ACTIVE_AGENT'; payload: Agent | null }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; updates: Partial<Conversation> } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'SET_MESSAGE_PAGINATION'; payload: Partial<AgentState['messagePagination']> }
  | { type: 'LOADING_START' }
  | { type: 'LOADING_END' }

// Initial state
const initialState: AgentState = {
  activeAgent: null,
  activeConversation: null,
  conversations: [],
  messages: [],
  isLoading: false,
  error: null,
  sidebarCollapsed: false,
  theme: 'system',
  messagePagination: {
    hasMore: true,
    offset: 0,
    limit: 20,
  },
}

// Reducer
function agentReducer(state: AgentState, action: AgentAction): AgentState {
  switch (action.type) {
    case 'SET_ACTIVE_AGENT':
      return {
        ...state,
        activeAgent: action.payload,
        error: null,
      }

    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversation: action.payload,
        messages: [], // Clear messages when switching conversations
        messagePagination: {
          hasMore: true,
          offset: 0,
          limit: 20,
        },
      }

    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload,
      }

    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      }

    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id
            ? { ...conv, ...action.payload.updates }
            : conv
        ),
        activeConversation: state.activeConversation?.id === action.payload.id
          ? { ...state.activeConversation, ...action.payload.updates }
          : state.activeConversation,
      }

    case 'DELETE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload),
        activeConversation: state.activeConversation?.id === action.payload
          ? null
          : state.activeConversation,
      }

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      }

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      }

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        ),
      }

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      }

    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      }

    case 'SET_MESSAGE_PAGINATION':
      return {
        ...state,
        messagePagination: {
          ...state.messagePagination,
          ...action.payload,
        },
      }

    case 'LOADING_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case 'LOADING_END':
      return {
        ...state,
        isLoading: false,
      }

    default:
      return state
  }
}

// Context
const AgentContext = createContext<{
  state: AgentState
  dispatch: React.Dispatch<AgentAction>
  actions: {
    // Agent actions
    setActiveAgent: (agent: Agent | null) => void
    switchAgent: (agentId: string) => void

    // Conversation actions
    setActiveConversation: (conversation: Conversation | null) => void
    createConversation: (agentId: string, title?: string) => Promise<Conversation | null>
    loadConversations: () => Promise<void>
    updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>
    deleteConversation: (id: string) => Promise<void>
    pinConversation: (id: string) => void
    archiveConversation: (id: string) => void

    // Message actions
    loadMessages: (conversationId: string, offset?: number) => Promise<void>
    sendMessage: (content: string, conversationId: string) => Promise<void>
    clearMessages: () => void

    // UI actions
    toggleSidebar: () => void
    setTheme: (theme: 'light' | 'dark' | 'system') => void

    // Utility actions
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearError: () => void
  }
} | null>(null)

// Provider component
export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, initialState)

  // Initialize with default agent
  useEffect(() => {
    const defaultAgent = agentRegistry.getAgent('general')
    if (defaultAgent && !state.activeAgent) {
      const agentConfig: Agent = {
        id: defaultAgent.id,
        name: defaultAgent.name,
        description: defaultAgent.description,
        personality: {
          tone: defaultAgent.personality.tone,
          style: defaultAgent.personality.style,
          traits: defaultAgent.personality.traits,
          responseLength: defaultAgent.personality.responseLength,
          communicationStyle: defaultAgent.personality.communicationStyle,
        },
        color: '#6366f1',
        icon: '🤖',
        tools: defaultAgent.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          priority: tool.priority,
          mcpToolNames: tool.mcpToolNames,
        })),
        ragConfig: defaultAgent.ragConfig,
      }
      dispatch({ type: 'SET_ACTIVE_AGENT', payload: agentConfig })
    }
  }, [])

  // Theme management
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (state.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(state.theme)
    }
  }, [state.theme])

  // Actions
  const actions = {
    // Agent actions
    setActiveAgent: (agent: Agent | null) => {
      dispatch({ type: 'SET_ACTIVE_AGENT', payload: agent })
    },

    switchAgent: async (agentId: string) => {
      console.log('[AgentProvider] Switching to agent:', agentId)
      const agent = agentRegistry.getAgent(agentId)
      if (agent) {
        const agentConfig: Agent = {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          personality: {
            tone: agent.personality.tone,
            style: agent.personality.style,
            traits: agent.personality.traits,
            responseLength: agent.personality.responseLength,
            communicationStyle: agent.personality.communicationStyle,
          },
          color: '#6366f1',
          icon: '🤖',
          tools: agent.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            category: tool.category,
            priority: tool.priority,
            mcpToolNames: tool.mcpToolNames,
          })),
          ragConfig: agent.ragConfig,
        }
        dispatch({ type: 'SET_ACTIVE_AGENT', payload: agentConfig })

        // Always create a new conversation when switching agents
        console.log('[AgentProvider] Creating new conversation for agent:', agentId)
        const newConv = await actions.createConversation(agentId, `${agent.name} Chat`)
        if (newConv) {
          console.log('[AgentProvider] Conversation created:', newConv.id)
          dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: newConv })
        } else {
          console.error('[AgentProvider] Failed to create conversation')
          dispatch({ type: 'SET_ERROR', payload: 'Failed to create conversation. Please try again.' })
        }
      }
    },

    // Conversation actions
    setActiveConversation: (conversation: Conversation | null) => {
      dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversation })
    },

    createConversation: async (agentId: string, title?: string): Promise<Conversation | null> => {
      try {
        dispatch({ type: 'LOADING_START' })

        const agent = agentRegistry.getAgent(agentId)
        if (!agent) {
          throw new Error(`Agent '${agentId}' not found`)
        }

        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId,
            title: title || `${agent.name} Chat`,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create conversation')
        }

        const { conversation: conv } = await response.json()

        // Transform to match Conversation type
        const conversation: Conversation = {
          id: conv.id,
          agentId: conv.agent_type,
          title: conv.title,
          status: conv.status,
          agent: conv.agent ? {
            id: conv.agent.id,
            name: conv.agent.name,
            description: conv.agent.description,
            personality: conv.agent.personality,
            color: '#6366f1',
            icon: '🤖',
            tools: agent.tools.map(t => ({
              name: t.name,
              description: t.description,
              category: t.category,
              priority: t.priority,
              mcpToolNames: t.mcpToolNames,
            })),
            ragConfig: agent.ragConfig,
          } : null as any,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        }

        dispatch({ type: 'ADD_CONVERSATION', payload: conversation })

        return conversation
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
        return null
      } finally {
        dispatch({ type: 'LOADING_END' })
      }
    },

    loadConversations: async () => {
      try {
        dispatch({ type: 'LOADING_START' })

        const response = await fetch('/api/conversations?status=active&limit=50')

        if (!response.ok) {
          throw new Error('Failed to load conversations')
        }

        const { conversations } = await response.json()

        // Transform conversations to match our Conversation type
        const transformedConversations: Conversation[] = conversations.map((conv: any) => ({
          id: conv.id,
          agentId: conv.agent_type,
          title: conv.title,
          status: conv.status,
          agent: conv.agent ? {
            id: conv.agent.id,
            name: conv.agent.name,
            description: conv.agent.description,
            personality: conv.agent.personality,
            color: '#6366f1',
            icon: '🤖',
            tools: [],
            ragConfig: {
              frameworks: true,
              agentDocuments: true,
              conversationHistory: true,
              maxContextLength: 4000,
            },
          } : null as any,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          messageCount: conv.messageCount,
          lastMessage: conv.lastMessage,
        }))

        dispatch({ type: 'SET_CONVERSATIONS', payload: transformedConversations })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        dispatch({ type: 'LOADING_END' })
      }
    },

    updateConversation: async (id: string, updates: Partial<Conversation>) => {
      try {
        const response = await fetch('/api/conversations', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationIds: [id],
            updates,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update conversation')
        }

        dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, updates } })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },

    deleteConversation: async (id: string) => {
      try {
        const response = await fetch('/api/conversations', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationIds: [id],
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete conversation')
        }

        dispatch({ type: 'DELETE_CONVERSATION', payload: id })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      }
    },

    pinConversation: (id: string) => {
      actions.updateConversation(id, { status: 'pinned' })
    },

    archiveConversation: (id: string) => {
      actions.updateConversation(id, { status: 'archived' })
    },

    // Message actions
    loadMessages: async (conversationId: string, offset: number = 0) => {
      try {
        dispatch({ type: 'LOADING_START' })

        const response = await fetch(`/api/conversations/${conversationId}/messages?offset=${offset}&limit=50`)

        if (!response.ok) {
          throw new Error('Failed to load messages')
        }

        const { messages: fetchedMessages, pagination } = await response.json()

        // Transform messages to match our Message type
        const transformedMessages: Message[] = fetchedMessages.map((msg: any) => ({
          id: msg.id,
          conversationId: msg.conversation_id || conversationId,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt || msg.created_at,
          toolInvocations: msg.toolInvocations || msg.tool_invocations || [],
          attachments: msg.attachments || [],
        }))

        if (offset === 0) {
          dispatch({ type: 'SET_MESSAGES', payload: transformedMessages })
        } else {
          dispatch({ type: 'SET_MESSAGES', payload: [...state.messages, ...transformedMessages] })
        }

        dispatch({
          type: 'SET_MESSAGE_PAGINATION',
          payload: {
            hasMore: pagination.hasMore,
            offset: pagination.offset + pagination.limit
          }
        })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        dispatch({ type: 'LOADING_END' })
      }
    },

    sendMessage: async (content: string, conversationId: string) => {
      const tempMessageId = `temp-${Date.now()}`

      try {
        dispatch({ type: 'LOADING_START' })

        // Add user message optimistically
        const userMessage: Message = {
          id: tempMessageId,
          conversationId,
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
        }
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage })

        // Get agent ID from active agent or conversation
        const agentId = state.activeAgent?.id || 'general'

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content,
              }
            ],
            conversationId,
            agentId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }))
          throw new Error(errorData.error || 'Failed to send message')
        }

        // Handle streaming response (SSE format from DefaultChatTransport)
        const reader = response.body?.getReader()
        if (!reader) {
          console.error('[AgentProvider] No response stream from API')
          throw new Error('No response stream')
        }

        console.log('[AgentProvider] Starting to read stream...')

        const decoder = new TextDecoder()
        let buffer = ''
        const assistantMessageId = `assistant-${Date.now()}`
        let assistantMessage = ''
        let messageAdded = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim()

              // Skip [DONE] marker
              if (dataStr === '[DONE]') {
                console.log('[AgentProvider] Received [DONE] marker')
                continue
              }

              try {
                const data = JSON.parse(dataStr)
                console.log('[AgentProvider] Received data:', data.type, data)

                // Handle error events from the stream
                if (data.type === 'error') {
                  const errorMsg = data.error || data.message || JSON.stringify(data)
                  console.error('[AgentProvider] Stream error event received:', {
                    type: data.type,
                    error: data.error,
                    message: data.message,
                    fullData: data
                  })
                  // Don't throw - just log and continue
                  // The error will be handled by the catch block if it's critical
                  console.warn('[AgentProvider] Continuing despite error event...')
                  continue
                }

                // Handle different message part types
                if (data.type === 'text-delta') {
                  // Accumulate text deltas
                  const delta = data.textDelta || ''
                  console.log('[AgentProvider] Text delta:', delta)
                  assistantMessage += delta

                  // Add message to state on first chunk
                  if (!messageAdded) {
                    dispatch({
                      type: 'ADD_MESSAGE',
                      payload: {
                        id: assistantMessageId,
                        conversationId,
                        role: 'assistant',
                        content: assistantMessage,
                        createdAt: new Date().toISOString(),
                      }
                    })
                    messageAdded = true
                  } else {
                    // Update message in real-time
                    dispatch({
                      type: 'UPDATE_MESSAGE',
                      payload: {
                        id: assistantMessageId,
                        updates: {
                          content: assistantMessage,
                        }
                      }
                    })
                  }
                } else if (data.type === 'text') {
                  // Full text (for compatibility)
                  assistantMessage = data.text || assistantMessage

                  if (!messageAdded) {
                    dispatch({
                      type: 'ADD_MESSAGE',
                      payload: {
                        id: assistantMessageId,
                        conversationId,
                        role: 'assistant',
                        content: assistantMessage,
                        createdAt: new Date().toISOString(),
                      }
                    })
                    messageAdded = true
                  } else {
                    dispatch({
                      type: 'UPDATE_MESSAGE',
                      payload: {
                        id: assistantMessageId,
                        updates: {
                          content: assistantMessage,
                        }
                      }
                    })
                  }
                } else if (data.type === 'message' && data.message) {
                  // Final message
                  const finalText = data.message.parts?.find((p: any) => p.type === 'text')?.text || assistantMessage
                  assistantMessage = finalText

                  if (messageAdded) {
                    dispatch({
                      type: 'UPDATE_MESSAGE',
                      payload: {
                        id: assistantMessageId,
                        updates: {
                          content: finalText,
                        }
                      }
                    })
                  }
                } else if (data.type === 'tool-call' || data.type === 'tool-result') {
                  // Log tool execution for debugging
                  console.log('[AgentProvider] Tool event:', data.type, data.toolName || data.tool)
                }
              } catch (e) {
                // Log parsing errors but don't break the stream
                console.warn('[AgentProvider] Failed to parse SSE data:', {
                  line: line.substring(0, 100),
                  error: e instanceof Error ? e.message : String(e)
                })

                // If this is a critical error (not just malformed JSON), rethrow
                if (e instanceof Error && e.message.includes('Stream error')) {
                  throw e
                }
              }
            }
          }
        }

        console.log('[AgentProvider] Stream complete. Final message length:', assistantMessage.length)

        // Ensure final message is saved
        if (assistantMessage) {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              id: assistantMessageId,
              updates: {
                content: assistantMessage,
              }
            }
          })
        }

        // Reload messages from persistence after a delay to allow server-side inserts to complete
        // Increased delay to 2 seconds to prevent race condition where reload happens before save
        if (conversationId) {
          setTimeout(() => {
            console.log('[AgentProvider] Reloading messages from database...')
            actions.loadMessages(conversationId).catch(err => {
              console.warn('[AgentProvider] Delayed message reload failed:', err)
            })
          }, 2000)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[AgentProvider] Send message error:', errorMessage, error)

        dispatch({ type: 'SET_ERROR', payload: errorMessage })

        // Only remove the specific temporary message we just added, not all messages
        // This prevents the entire chat from disappearing on error
        dispatch({
          type: 'SET_MESSAGES',
          payload: state.messages.filter(m => m.id !== tempMessageId)
        })

        // Add error message to chat to inform user
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: `error-${Date.now()}`,
            conversationId: conversationId || '',
            role: 'assistant',
            content: `I encountered an error: ${errorMessage}. Please try again or rephrase your message.`,
            createdAt: new Date().toISOString(),
          }
        })
      } finally {
        dispatch({ type: 'LOADING_END' })
      }
    },

    clearMessages: () => {
      dispatch({ type: 'CLEAR_MESSAGES' })
    },

    // UI actions
    toggleSidebar: () => {
      dispatch({ type: 'TOGGLE_SIDEBAR' })
    },

    setTheme: (theme: 'light' | 'dark' | 'system') => {
      dispatch({ type: 'SET_THEME', payload: theme })
    },

    // Utility actions
    setLoading: (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    },

    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    },

    clearError: () => {
      dispatch({ type: 'SET_ERROR', payload: null })
    },
  }

  // Load conversations after actions are defined
  useEffect(() => {
    if (state.activeAgent && state.conversations.length === 0) {
      actions.loadConversations().catch(err => {
        console.warn('[AgentProvider] Failed to load conversations:', err)
      })
    }
  }, [state.activeAgent?.id])

  return (
    <AgentContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AgentContext.Provider>
  )
}

// Hook to use the agent context
export function useAgent() {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}
