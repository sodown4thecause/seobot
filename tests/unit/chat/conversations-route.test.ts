import type { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetUserId = vi.fn()
const mockJson = vi.fn()
const mockFrom = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn((...args) => ({ type: 'eq', args }))
const mockAnd = vi.fn((...args) => ({ type: 'and', args }))
const mockDesc = vi.fn((arg) => ({ type: 'desc', arg }))

vi.mock('@/lib/auth/clerk', () => ({
  getUserId: mockGetUserId,
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: mockFrom,
    })),
    insert: mockInsert,
  },
  conversations: {
    id: 'id',
    userId: 'userId',
    status: 'status',
    updatedAt: 'updatedAt',
  },
  messages: {
    id: 'id',
    conversationId: 'conversationId',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: mockEq,
  and: mockAnd,
  desc: mockDesc,
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: mockJson,
  },
}))

describe('POST /api/conversations', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockJson.mockImplementation((body, init) => ({ body, status: init?.status ?? 200 }))
  })

  it('reuses the latest empty active conversation before inserting a new one', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const emptyConversation = {
      id: 'conv-empty',
      userId: 'user-123',
      title: 'New Conversation',
      agentType: 'general',
      status: 'active',
      updatedAt: new Date('2026-03-10T00:00:00Z'),
    }

    const selectConversationChain = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([emptyConversation]),
    }
    const messageCountChain = {
      where: vi.fn().mockResolvedValue([]),
    }

    mockFrom.mockReturnValueOnce(selectConversationChain).mockReturnValueOnce(messageCountChain)

    const { POST } = await import('@/app/api/conversations/route')

    const request = {
      json: vi.fn().mockResolvedValue({ agentId: 'general' }),
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.body).toEqual({ conversation: emptyConversation })
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
