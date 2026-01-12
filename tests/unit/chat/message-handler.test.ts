/**
 * Message Handler Unit Tests
 * 
 * Tests the message handling utilities for the chat API:
 * - Message extraction (legacy and AI SDK 6 formats)
 * - Message conversion
 * - Message validation
 */

import { describe, it, expect, vi } from 'vitest'
import {
  extractLastUserMessageContent,
  validateMessages,
  extractMessageContent,
  isUserMessage,
  isAssistantMessage,
  getLastMessage,
  extractToolInvocations,
} from '@/lib/chat/message-handler'

describe('Message Handler', () => {
  describe('extractLastUserMessageContent', () => {
    it('should return empty string for empty messages array', () => {
      expect(extractLastUserMessageContent([])).toBe('')
    })

    it('should return empty string for undefined messages', () => {
      expect(extractLastUserMessageContent(undefined as any)).toBe('')
    })

    it('should extract content from legacy format message', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello world' },
      ] as any[]

      expect(extractLastUserMessageContent(messages)).toBe('Hello world')
    })

    it('should extract content from AI SDK 6 parts format', () => {
      const messages = [
        {
          id: '1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello from parts' }],
        },
      ] as any[]

      expect(extractLastUserMessageContent(messages)).toBe('Hello from parts')
    })

    it('should concatenate multiple text parts', () => {
      const messages = [
        {
          id: '1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'world' },
          ],
        },
      ] as any[]

      expect(extractLastUserMessageContent(messages)).toBe('Hello world')
    })

    it('should ignore non-text parts', () => {
      const messages = [
        {
          id: '1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Hello' },
            { type: 'tool-invocation', toolName: 'test' },
            { type: 'text', text: ' world' },
          ],
        },
      ] as any[]

      expect(extractLastUserMessageContent(messages)).toBe('Hello world')
    })

    it('should return last message content when multiple messages exist', () => {
      const messages = [
        { id: '1', role: 'user', content: 'First message' },
        { id: '2', role: 'assistant', content: 'Response' },
        { id: '3', role: 'user', content: 'Second message' },
      ] as any[]

      expect(extractLastUserMessageContent(messages)).toBe('Second message')
    })
  })

  describe('extractMessageContent', () => {
    it('should extract from legacy format', () => {
      const message = { id: '1', role: 'user', content: 'Test content' } as any
      expect(extractMessageContent(message)).toBe('Test content')
    })

    it('should extract from parts format', () => {
      const message = {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Parts content' }],
      } as any
      expect(extractMessageContent(message)).toBe('Parts content')
    })

    it('should return empty string for message without content or parts', () => {
      const message = { id: '1', role: 'user' } as any
      expect(extractMessageContent(message)).toBe('')
    })

    it('should handle null/undefined gracefully', () => {
      expect(extractMessageContent(undefined as any)).toBe('')
      expect(extractMessageContent(null as any)).toBe('')
    })
  })

  describe('validateMessages', () => {
    it('should return null for valid messages array', () => {
      const messages = [{ id: '1', role: 'user', content: 'Test' }]
      expect(validateMessages(messages)).toBeNull()
    })

    it('should return error response for empty array', () => {
      const response = validateMessages([])
      expect(response).not.toBeNull()
      expect(response?.status).toBe(400)
    })

    it('should return error response for non-array', () => {
      const response = validateMessages('not an array')
      expect(response).not.toBeNull()
      expect(response?.status).toBe(400)
    })

    it('should return error response for undefined', () => {
      const response = validateMessages(undefined)
      expect(response).not.toBeNull()
      expect(response?.status).toBe(400)
    })

    it('should return error response for null', () => {
      const response = validateMessages(null)
      expect(response).not.toBeNull()
      expect(response?.status).toBe(400)
    })
  })

  describe('isUserMessage', () => {
    it('should return true for user role', () => {
      expect(isUserMessage({ id: '1', role: 'user', content: '' } as any)).toBe(true)
    })

    it('should return false for assistant role', () => {
      expect(isUserMessage({ id: '1', role: 'assistant', content: '' } as any)).toBe(false)
    })

    it('should return false for system role', () => {
      expect(isUserMessage({ id: '1', role: 'system', content: '' } as any)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isUserMessage(undefined as any)).toBe(false)
    })
  })

  describe('isAssistantMessage', () => {
    it('should return true for assistant role', () => {
      expect(isAssistantMessage({ id: '1', role: 'assistant', content: '' } as any)).toBe(true)
    })

    it('should return false for user role', () => {
      expect(isAssistantMessage({ id: '1', role: 'user', content: '' } as any)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isAssistantMessage(undefined as any)).toBe(false)
    })
  })

  describe('getLastMessage', () => {
    it('should return the last message', () => {
      const messages = [
        { id: '1', role: 'user', content: 'First' },
        { id: '2', role: 'assistant', content: 'Second' },
        { id: '3', role: 'user', content: 'Third' },
      ] as any[]

      expect(getLastMessage(messages)?.id).toBe('3')
    })

    it('should return undefined for empty array', () => {
      expect(getLastMessage([])).toBeUndefined()
    })

    it('should return the only message for single-element array', () => {
      const messages = [{ id: '1', role: 'user', content: 'Only' }] as any[]
      expect(getLastMessage(messages)?.id).toBe('1')
    })
  })

  describe('extractToolInvocations', () => {
    it('should extract tool invocations from message parts', () => {
      const message = {
        id: '1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Some text' },
          {
            type: 'tool-invocation',
            toolInvocation: {
              toolName: 'search_web',
              result: { data: 'result' },
              state: 'completed',
            },
          },
        ],
      } as any

      const invocations = extractToolInvocations(message)
      expect(invocations).toHaveLength(1)
      expect(invocations[0].toolName).toBe('search_web')
      expect(invocations[0].state).toBe('completed')
      expect(invocations[0].result).toEqual({ data: 'result' })
    })

    it('should return empty array for message without parts', () => {
      const message = { id: '1', role: 'assistant', content: 'Text' } as any
      expect(extractToolInvocations(message)).toEqual([])
    })

    it('should return empty array for message without tool invocations', () => {
      const message = {
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Just text' }],
      } as any

      expect(extractToolInvocations(message)).toEqual([])
    })

    it('should handle multiple tool invocations', () => {
      const message = {
        id: '1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-invocation',
            toolInvocation: { toolName: 'tool1' },
          },
          {
            type: 'tool-invocation',
            toolInvocation: { toolName: 'tool2' },
          },
        ],
      } as any

      const invocations = extractToolInvocations(message)
      expect(invocations).toHaveLength(2)
      expect(invocations[0].toolName).toBe('tool1')
      expect(invocations[1].toolName).toBe('tool2')
    })
  })
})
