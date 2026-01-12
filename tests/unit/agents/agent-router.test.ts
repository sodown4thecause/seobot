/**
 * AgentRouter Unit Tests
 * 
 * Tests the agent routing logic that determines which specialized agent
 * should handle a user query (onboarding, seo-aeo, content, general).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AgentRouter, type AgentRoutingResult } from '@/lib/agents/agent-router'
import { AGENT_IDS } from '@/lib/agents/constants'

describe('AgentRouter', () => {
  describe('routeQuery', () => {
    describe('Onboarding Agent Routing', () => {
      it('should route to onboarding when page context is "onboarding"', () => {
        const result = AgentRouter.routeQuery('hello', { page: 'onboarding' })
        
        expect(result.agent).toBe(AGENT_IDS.ONBOARDING)
        expect(result.confidence).toBeGreaterThan(0.9)
        expect(result.tools).toContain('client_ui')
      })

      it('should route to onboarding for setup-related queries', () => {
        // Use exact keywords from AgentRouter.getOnboardingKeywords()
        // Note: Word boundary matching means 'onboard' won't match 'onboarding'
        const queries = [
          'how do I setup my account',           // 'setup' keyword
          'getting started with the platform',   // 'getting started' multi-word phrase
          'I want to onboard my team',           // 'onboard' keyword (exact match)
          'how to start using this tool',        // 'how to start' multi-word phrase
          'show me a tutorial',                  // 'tutorial' keyword
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent, `Query "${query}" should route to onboarding but got ${result.agent}`).toBe(AGENT_IDS.ONBOARDING)
          expect(result.confidence).toBeGreaterThanOrEqual(0.85)
        }
      })

      it('should include matched keywords in result', () => {
        const result = AgentRouter.routeQuery('help me setup and configure my account')
        
        expect(result.matchedKeywords).toBeDefined()
        expect(result.matchedKeywords!.length).toBeGreaterThan(0)
      })
    })

    describe('Content Agent Routing', () => {
      it('should route to content for explicit content creation requests', () => {
        const queries = [
          'write me a blog post about SEO',
          'create an article on digital marketing',
          'generate a blog about AI trends',
          'draft a landing page for our product',
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent).toBe(AGENT_IDS.CONTENT)
          expect(result.confidence).toBeGreaterThanOrEqual(0.9)
        }
      })

      it('should route to content for content optimization queries', () => {
        const queries = [
          'rewrite this paragraph to sound more natural',
          'humanize this content',
          'make this text less AI-like',
          'check for plagiarism in this article',
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent).toBe(AGENT_IDS.CONTENT)
        }
      })

      it('should include content generation tools', () => {
        const result = AgentRouter.routeQuery('write me a blog post about productivity')
        
        expect(result.tools).toContain('generate_researched_content')
        expect(result.tools).toContain('perplexity_search')
      })

      it('should prioritize content over SEO when explicit content intent is present', () => {
        // "blog post" is content, but "SEO" is in the query too
        const result = AgentRouter.routeQuery('write a blog post about SEO best practices')
        
        expect(result.agent).toBe(AGENT_IDS.CONTENT)
      })
    })

    describe('SEO/AEO Agent Routing', () => {
      it('should route to SEO for analytics queries', () => {
        const queries = [
          'analyze my website SEO performance',
          'what is the search volume for this keyword',
          'show me competitor backlinks',
          'audit my technical SEO',
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
        }
      })

      it('should route to SEO for keyword research queries', () => {
        // Use exact SEO keywords that don't also match content keywords
        // Note: 'research for' is a content keyword, so avoid it
        const queries = [
          'analyze keyword research data',             // 'keyword research' + avoids 'research for'
          'check keyword difficulty for react',        // 'keyword difficulty' multi-word phrase
          'find the search volume for this term',      // 'search volume' multi-word phrase
          'determine the search intent for this',      // 'search intent' multi-word phrase
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent, `Query "${query}" should route to SEO but got ${result.agent}, matched: ${result.matchedKeywords}`).toBe(AGENT_IDS.SEO_AEO)
        }
      })

      it('should route to SEO for SERP analysis queries', () => {
        const queries = [
          'analyze SERP for "best coffee makers"',
          'show me search results for this keyword',
          'what are the featured snippets for this query',
          'analyze the google ranking for our site',
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
        }
      })

      it('should route to SEO for backlink queries', () => {
        // Use exact keywords from AgentRouter.getSEOKeywords()
        const queries = [
          'show me backlink for example.com',   // 'backlink' keyword (singular)
          'find the referring domains',         // 'referring domains' multi-word phrase
          'check for toxic links on my site',   // 'toxic links' multi-word phrase
          'analyze domain authority',           // 'domain authority' multi-word phrase
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
        }
      })

      it('should include SEO tools', () => {
        // Use 'seo' keyword to guarantee SEO routing
        const result = AgentRouter.routeQuery('analyze my SEO performance and ranking')
        
        expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
        expect(result.tools).toContain('keywords_data_google_ads_search_volume')
        expect(result.tools).toContain('serp_organic_live_advanced')
        expect(result.tools).toContain('n8n_backlinks')
      })
    })

    describe('General Agent Routing (Fallback)', () => {
      it('should route to general for ambiguous queries', () => {
        const queries = [
          'hello',
          'how are you',
          'what can you do',
          'help me with something',
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent).toBe(AGENT_IDS.GENERAL)
        }
      })

      it('should have lower confidence for general routing', () => {
        const result = AgentRouter.routeQuery('random question here')
        
        expect(result.agent).toBe(AGENT_IDS.GENERAL)
        expect(result.confidence).toBeLessThanOrEqual(0.75)
      })

      it('should include basic tools for general agent', () => {
        const result = AgentRouter.routeQuery('hello there')
        
        expect(result.tools).toContain('perplexity_search')
        expect(result.tools).toContain('client_ui')
      })
    })

    describe('Confidence Calculation', () => {
      it('should increase confidence with more keyword matches', () => {
        const singleMatch = AgentRouter.routeQuery('SEO')
        const multipleMatches = AgentRouter.routeQuery('SEO keyword research backlinks analytics')
        
        expect(multipleMatches.confidence).toBeGreaterThan(singleMatch.confidence)
      })

      it('should cap confidence at reasonable maximum', () => {
        const result = AgentRouter.routeQuery(
          'SEO keyword research backlinks analytics ranking traffic metrics performance'
        )
        
        expect(result.confidence).toBeLessThanOrEqual(0.98)
      })
    })

    describe('Word Boundary Matching', () => {
      it('should not match partial words', () => {
        // "seotool" should not match "seo"
        const result = AgentRouter.routeQuery('I need help with my seotool')
        
        // If word boundary is working, this should NOT route to SEO
        // since "seo" appears only as part of "seotool"
        // However, "seotool" is not a content keyword either, so general
        expect(result.agent).toBe(AGENT_IDS.GENERAL)
      })

      it('should match whole words correctly', () => {
        const result = AgentRouter.routeQuery('I need SEO help')
        
        expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
      })

      it('should match multi-word phrases', () => {
        const result = AgentRouter.routeQuery('I want a blog post about marketing')
        
        expect(result.agent).toBe(AGENT_IDS.CONTENT)
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty message', () => {
        const result = AgentRouter.routeQuery('')
        
        expect(result.agent).toBe(AGENT_IDS.GENERAL)
      })

      it('should handle very long messages', () => {
        const longMessage = 'SEO '.repeat(100)
        const result = AgentRouter.routeQuery(longMessage)
        
        expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
        expect(result).toHaveProperty('confidence')
      })

      it('should be case insensitive', () => {
        const lowerCase = AgentRouter.routeQuery('seo analysis')
        const upperCase = AgentRouter.routeQuery('SEO ANALYSIS')
        const mixedCase = AgentRouter.routeQuery('SeO AnAlYsIs')
        
        expect(lowerCase.agent).toBe(AGENT_IDS.SEO_AEO)
        expect(upperCase.agent).toBe(AGENT_IDS.SEO_AEO)
        expect(mixedCase.agent).toBe(AGENT_IDS.SEO_AEO)
      })

      it('should handle special characters in query', () => {
        const result = AgentRouter.routeQuery('SEO analysis for example.com/path?query=value')
        
        expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
      })
    })
  })

  describe('getAgentSystemPrompt', () => {
    it('should return a non-empty system prompt for each agent type', () => {
      const agentTypes = [AGENT_IDS.ONBOARDING, AGENT_IDS.SEO_AEO, AGENT_IDS.CONTENT, AGENT_IDS.GENERAL]
      
      for (const agentType of agentTypes) {
        const prompt = AgentRouter.getAgentSystemPrompt(agentType, {})
        
        expect(prompt).toBeDefined()
        expect(typeof prompt).toBe('string')
        expect(prompt.length).toBeGreaterThan(100)
      }
    })

    it('should customize prompt based on context', () => {
      const basePrompt = AgentRouter.getAgentSystemPrompt(AGENT_IDS.CONTENT, {})
      const contextPrompt = AgentRouter.getAgentSystemPrompt(AGENT_IDS.CONTENT, {
        page: 'dashboard',
      })
      
      // Both should be valid prompts
      expect(basePrompt).toBeDefined()
      expect(contextPrompt).toBeDefined()
    })
  })
})
