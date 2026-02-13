'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export interface BusinessContext {
  websiteUrl?: string
  industry?: string
  goals?: string[]
  locations?: string[]
  contentFrequency?: string
}

export interface BrandVoice {
  tone: string
  style: string
  personality?: Record<string, unknown>
  samplePhrases?: string[]
}

export interface StoredCompetitor {
  id: string
  domain: string
  domainAuthority?: number | null
  monthlyTraffic?: number | null
  priority?: string
}

export interface StoredKeyword {
  id: string
  keyword: string
  searchVolume?: number
  keywordDifficulty?: number
  currentRanking?: number
  intent?: string
  priority?: string
}

export interface UserContextData {
  userId: string | null
  businessContext: BusinessContext | null
  brandVoice: BrandVoice | null
  competitors: StoredCompetitor[]
  keywords: StoredKeyword[]
  isLoading: boolean
  error: string | null
  hasCompletedOnboarding: boolean
}

interface ContentZoneContextType extends UserContextData {
  refreshContext: () => Promise<void>
}

const ContentZoneContext = createContext<ContentZoneContextType | undefined>(undefined)

export function ContentZoneProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [contextData, setContextData] = useState<UserContextData>({
    userId: null,
    businessContext: null,
    brandVoice: null,
    competitors: [],
    keywords: [],
    isLoading: true,
    error: null,
    hasCompletedOnboarding: false,
  })

  const fetchUserContext = async () => {
    if (!user) {
      setContextData(prev => ({ ...prev, isLoading: false, error: 'Not authenticated' }))
      return
    }

    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        if (response.status === 404) {
          setContextData({
            userId: user.id,
            businessContext: null,
            brandVoice: null,
            competitors: [],
            keywords: [],
            isLoading: false,
            error: null,
            hasCompletedOnboarding: false,
          })
          return
        }
        throw new Error('Failed to fetch user context')
      }

      const data = await response.json()

      setContextData({
        userId: user.id,
        businessContext: data.profile ? {
          websiteUrl: data.profile.websiteUrl,
          industry: data.profile.industry,
          goals: data.profile.goals,
          locations: data.profile.locations,
          contentFrequency: data.profile.contentFrequency,
        } : null,
        brandVoice: data.brandVoice ? {
          tone: data.brandVoice.tone,
          style: data.brandVoice.style,
          personality: data.brandVoice.personality,
          samplePhrases: data.brandVoice.samplePhrases,
        } : null,
        competitors: data.competitors || [],
        keywords: data.keywords || [],
        isLoading: false,
        error: null,
        hasCompletedOnboarding: !!(data.profile?.websiteUrl),
      })
    } catch (error) {
      setContextData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchUserContext()
    }
  }, [isLoaded, user])

  return (
    <ContentZoneContext.Provider
      value={{
        ...contextData,
        refreshContext: fetchUserContext,
      }}
    >
      {children}
    </ContentZoneContext.Provider>
  )
}

export function useContentZone() {
  const context = useContext(ContentZoneContext)
  if (context === undefined) {
    throw new Error('useContentZone must be used within a ContentZoneProvider')
  }
  return context
}

