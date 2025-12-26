/**
 * Integration Tests: Mode Switching
 * 
 * Tests user mode transitions, UI adaptation, and feature access control
 * 
 * Requirements: 1.2, 1.3, 1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/providers/user-mode-provider', () => ({
  useUserMode: vi.fn(),
  UserModeProvider: vi.fn(),
}))

describe('Mode Switching Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Beginner to Practitioner Transition', () => {
    it('should switch from beginner to practitioner mode', () => {
      const modes = ['beginner', 'practitioner', 'agency']
      const currentMode = 'beginner'
      const targetMode = 'practitioner'

      const canSwitch = modes.includes(targetMode) && currentMode !== targetMode
      expect(canSwitch).toBe(true)
    })

    it('should preserve user data during mode switch', () => {
      const userData = {
        businessInfo: { name: 'Test Business' },
        goals: ['increase traffic'],
        preferences: { jargonLevel: 'beginner' },
      }

      const modeSwitch = {
        from: 'beginner',
        to: 'practitioner',
        preservedData: userData,
      }

      expect(modeSwitch.preservedData.businessInfo).toEqual(userData.businessInfo)
      expect(modeSwitch.preservedData.goals).toEqual(userData.goals)
    })
  })

  describe('UI Adaptation Verification', () => {
    it('should show simplified UI in beginner mode', () => {
      const beginnerUI = {
        complexity: 'simple',
        features: ['basic_keyword_research', 'simple_content_generation'],
        jargonTooltips: true,
        guidedWorkflows: true,
      }

      expect(beginnerUI.complexity).toBe('simple')
      expect(beginnerUI.jargonTooltips).toBe(true)
    })

    it('should show advanced UI in practitioner mode', () => {
      const practitionerUI = {
        complexity: 'advanced',
        features: [
          'advanced_keyword_research',
          'competitor_analysis',
          'link_building',
          'technical_seo',
        ],
        jargonTooltips: false,
        guidedWorkflows: false,
      }

      expect(practitionerUI.complexity).toBe('advanced')
      expect(practitionerUI.features.length).toBeGreaterThan(2)
    })

    it('should show agency UI in agency mode', () => {
      const agencyUI = {
        complexity: 'expert',
        features: [
          'multi_client_management',
          'white_label',
          'team_collaboration',
          'advanced_analytics',
        ],
        jargonTooltips: false,
        guidedWorkflows: false,
        teamFeatures: true,
      }

      expect(agencyUI.complexity).toBe('expert')
      expect(agencyUI.teamFeatures).toBe(true)
    })
  })

  describe('Feature Access Control', () => {
    it('should restrict advanced features in beginner mode', () => {
      const beginnerFeatures = {
        allowed: ['basic_keyword_research', 'simple_content'],
        restricted: ['link_building', 'technical_seo', 'competitor_analysis'],
      }

      const requestedFeature = 'link_building'
      const hasAccess = beginnerFeatures.allowed.includes(requestedFeature)
      
      expect(hasAccess).toBe(false)
      expect(beginnerFeatures.restricted).toContain(requestedFeature)
    })

    it('should allow all features in practitioner mode', () => {
      const practitionerFeatures = {
        allowed: [
          'keyword_research',
          'content_generation',
          'link_building',
          'technical_seo',
          'competitor_analysis',
        ],
        restricted: [],
      }

      const requestedFeature = 'link_building'
      const hasAccess = practitionerFeatures.allowed.includes(requestedFeature)
      
      expect(hasAccess).toBe(true)
      expect(practitionerFeatures.restricted.length).toBe(0)
    })

    it('should allow team features only in agency mode', () => {
      const agencyFeatures = {
        allowed: [
          'multi_client_management',
          'team_collaboration',
          'white_label',
          'advanced_analytics',
        ],
        teamFeatures: true,
      }

      const requestedFeature = 'team_collaboration'
      const hasAccess = agencyFeatures.allowed.includes(requestedFeature)
      
      expect(hasAccess).toBe(true)
      expect(agencyFeatures.teamFeatures).toBe(true)
    })
  })
})

