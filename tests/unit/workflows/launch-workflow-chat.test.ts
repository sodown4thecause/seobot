import { describe, expect, it, vi } from 'vitest'
import { launchWorkflowChat } from '@/lib/workflows/launch-workflow-chat'

describe('launchWorkflowChat', () => {
  it('creates a new conversation and routes to dashboard workflow', async () => {
    const createdConversation = { id: 'conv_123' }
    const createConversation = vi.fn().mockResolvedValue(createdConversation)
    const setActiveConversation = vi.fn()
    const push = vi.fn()

    const result = await launchWorkflowChat('seo-tools', {
      activeAgentId: 'general',
      createConversation,
      setActiveConversation,
      push,
    })

    expect(result).toBe('launched')
    expect(createConversation).toHaveBeenCalledWith('general', 'SEO Tools & Analysis Workflow')
    expect(setActiveConversation).toHaveBeenCalledWith(createdConversation)
    expect(push).toHaveBeenCalledWith('/dashboard?workflow=seo-tools&conversationId=conv_123')
  })

  it('does not navigate when conversation creation fails', async () => {
    const createConversation = vi.fn().mockResolvedValue(null)
    const setActiveConversation = vi.fn()
    const push = vi.fn()

    const result = await launchWorkflowChat('rank-on-chatgpt', {
      createConversation,
      setActiveConversation,
      push,
    })

    expect(result).toBe('launch-failed')
    expect(setActiveConversation).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('supports workflow ids that come from the registry fallback', async () => {
    const createdConversation = { id: 'conv_456' }
    const createConversation = vi.fn().mockResolvedValue(createdConversation)
    const setActiveConversation = vi.fn()
    const push = vi.fn()

    const result = await launchWorkflowChat('aeo-citation-optimization', {
      createConversation,
      setActiveConversation,
      push,
    })

    expect(result).toBe('launched')
    expect(createConversation).toHaveBeenCalledWith('general', 'Citation Optimization Workflow')
    expect(setActiveConversation).toHaveBeenCalledWith(createdConversation)
    expect(push).toHaveBeenCalledWith('/dashboard?workflow=aeo-citation-optimization&conversationId=conv_456')
  })

  it('does not navigate when workflow id is invalid', async () => {
    const createConversation = vi.fn()
    const setActiveConversation = vi.fn()
    const push = vi.fn()

    const result = await launchWorkflowChat('missing-workflow-id', {
      createConversation,
      setActiveConversation,
      push,
    })

    expect(result).toBe('invalid-workflow')
    expect(createConversation).not.toHaveBeenCalled()
    expect(setActiveConversation).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })
})
