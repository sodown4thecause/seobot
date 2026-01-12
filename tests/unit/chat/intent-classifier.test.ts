/**
 * Intent Classifier Unit Tests
 * 
 * Tests the intent classification logic that determines:
 * 1. Which agent should handle a user query
 * 2. What system prompt to use
 * 
 * Note: LLM calls are mocked to test the classification logic without API calls.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

// Mock the intent-tool-router before importing intent-classifier
vi.mock('@/lib/agents/intent-tool-router', () => ({
  IntentToolRouter: {
    classifyAndGetTools: vi.fn(),
    getIntentSystemPromptAddendum: vi.fn(),
  },
}))

// Now import the actual functions
import { classifyUserIntent, buildAgentSystemPrompt } from '@/lib/chat/intent-classifier'
import { IntentToolRouter } from '@/lib/agents/intent-tool-router'

describe('Intent Classifier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('classifyUserIntent', () => {
    describe('Onboarding Detection', () => {
      it('should return onboarding agent when page context is "onboarding"', async () => {
        const result = await classifyUserIntent({
          query: 'hello',
          context: { page: 'onboarding' },
        })

        expect(result.agent).toBe('onboarding')
        expect(result.confidence).toBe(1.0)
        expect(result.reasoning).toContain('Onboarding')
        // Should not call LLM for onboarding
        expect(IntentToolRouter.classifyAndGetTools).not.toHaveBeenCalled()
      })

      it('should return onboarding agent when onboarding context is present', async () => {
        const result = await classifyUserIntent({
          query: 'what should I do next',
          context: { onboarding: { currentStep: 2 } },
        })

        expect(result.agent).toBe('onboarding')
        expect(result.confidence).toBe(1.0)
        expect(IntentToolRouter.classifyAndGetTools).not.toHaveBeenCalled()
      })

      it('should return onboarding for setup-related queries', async () => {
        const result = await classifyUserIntent({
          query: 'how do I setup my account',
        })

        expect(result.agent).toBe('onboarding')
        expect(result.confidence).toBe(1.0)
      })
    })

    describe('LLM Classification', () => {
      it('should use LLM classification for non-onboarding queries', async () => {
        const mockClassification = {
          classification: {
            primaryIntent: 'keyword_research',
            secondaryIntents: ['serp_analysis'],
            recommendedAgent: 'seo-aeo',
            confidence: 0.92,
            reasoning: 'User wants to research keywords',
          },
          tools: ['keywords_data_google_ads_search_volume', 'serp_organic_live_advanced'],
          allIntents: ['keyword_research', 'serp_analysis'],
        }

        ;(IntentToolRouter.classifyAndGetTools as Mock).mockResolvedValue(mockClassification)

        const result = await classifyUserIntent({
          query: 'analyze keywords for my website',
        })

        expect(IntentToolRouter.classifyAndGetTools).toHaveBeenCalledWith('analyze keywords for my website')
        expect(result.agent).toBe('seo-aeo')
        expect(result.confidence).toBe(0.92)
        expect(result.reasoning).toBe('User wants to research keywords')
        expect(result.tools).toContain('keywords_data_google_ads_search_volume')
        expect(result.allIntents).toContain('keyword_research')
      })

      it('should return content agent for content creation queries', async () => {
        const mockClassification = {
          classification: {
            primaryIntent: 'content_optimization',
            secondaryIntents: [],
            recommendedAgent: 'content',
            confidence: 0.95,
            reasoning: 'User wants to create blog content',
          },
          tools: ['generate_researched_content', 'perplexity_search'],
          allIntents: ['content_optimization'],
        }

        ;(IntentToolRouter.classifyAndGetTools as Mock).mockResolvedValue(mockClassification)

        const result = await classifyUserIntent({
          query: 'write a blog post about productivity',
        })

        expect(result.agent).toBe('content')
        expect(result.confidence).toBe(0.95)
        expect(result.tools).toContain('generate_researched_content')
      })

      it('should return general agent for ambiguous queries', async () => {
        const mockClassification = {
          classification: {
            primaryIntent: 'general',
            secondaryIntents: [],
            recommendedAgent: 'general',
            confidence: 0.6,
            reasoning: 'General question without specific SEO or content intent',
          },
          tools: ['perplexity_search'],
          allIntents: ['general'],
        }

        ;(IntentToolRouter.classifyAndGetTools as Mock).mockResolvedValue(mockClassification)

        const result = await classifyUserIntent({
          query: 'what is the weather today',
        })

        expect(result.agent).toBe('general')
        expect(result.confidence).toBe(0.6)
      })
    })

    describe('Fallback Behavior', () => {
      it('should fallback to keyword routing when LLM fails', async () => {
        ;(IntentToolRouter.classifyAndGetTools as Mock).mockRejectedValue(new Error('LLM API error'))

        // Use a query that will route to SEO via keyword matching
        const result = await classifyUserIntent({
          query: 'analyze SEO performance',
        })

        expect(result.agent).toBe('seo-aeo')
        expect(result.confidence).toBe(0.7)  // Lower confidence for fallback
        expect(result.reasoning).toBe('Keyword-based routing fallback')
        expect(result.classification).toBeNull()
      })

      it('should fallback to general for unknown queries when LLM fails', async () => {
        ;(IntentToolRouter.classifyAndGetTools as Mock).mockRejectedValue(new Error('API timeout'))

        const result = await classifyUserIntent({
          query: 'hello there',
        })

        expect(result.agent).toBe('general')
        expect(result.confidence).toBe(0.7)
      })
    })
  })

  describe('buildAgentSystemPrompt', () => {
    // Note: Tests for buildAgentSystemPrompt are limited because the function uses 
    // a runtime require() for '@/lib/onboarding/prompts' which vitest cannot mock.
    // The function's behavior is tested indirectly through integration tests.
    
    // We can still verify that the function exists and returns a string
    it('should be a function', () => {
      expect(typeof buildAgentSystemPrompt).toBe('function')
    })
  })
})
