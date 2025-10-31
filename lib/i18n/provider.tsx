'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { LocaleType, defaultLocale, locales, getLocaleFromPathname } from './config'

interface I18nContextType {
  locale: LocaleType
  setLocale: (locale: LocaleType) => void
  t: (key: string, fallback?: string) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface Translations {
  [key: string]: any
}

const translations: Record<LocaleType, Translations> = {
  en: () => import('./locales/en.json').then(m => m.default),
  es: () => import('./locales/es.json').then(m => m.default),
  fr: () => import('./locales/fr.json').then(m => m.default),
  de: () => import('./locales/de.json').then(m => m.default),
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleType>(defaultLocale)
  const [translationsData, setTranslationsData] = useState<Translations>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const data = await translations[locale]()
        setTranslationsData(data)
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error)
        // Fallback to English
        const fallbackData = await translations[defaultLocale]()
        setTranslationsData(fallbackData)
      } finally {
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [locale])

  // Detect locale from pathname on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detectedLocale = getLocaleFromPathname(window.location.pathname)
      if (detectedLocale !== locale) {
        setLocale(detectedLocale)
      }
    }
  }, [])

  const setLocale = (newLocale: LocaleType) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale)
      
      // Update URL if needed
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const currentLocale = getLocaleFromPathname(currentPath)
        
        if (currentLocale !== newLocale) {
          // Remove current locale from path
          let pathWithoutLocale = currentPath
          for (const loc of locales) {
            if (currentPath.startsWith(`/${loc}`)) {
              pathWithoutLocale = currentPath.replace(`/${loc}`, '') || '/'
              break
            }
          }
          
          // Add new locale to path (except for English which is default)
          let newPath = pathWithoutLocale
          if (newLocale !== defaultLocale) {
            newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
          }
          
          window.history.replaceState(null, '', newPath)
        }
      }
      
      // Store preference
      localStorage.setItem('preferred-locale', newLocale)
    }
  }

  const t = (key: string, fallback?: string): string => {
    if (isLoading) return fallback || key
    
    const keys = key.split('.')
    let value = translationsData
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }
    
    return typeof value === 'string' ? value : fallback || key
  }

  const isRTL = ['ar', 'he', 'fa'].includes(locale)

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    isRTL,
  }

  return (
    <I18nContext.Provider value={value}>
      {!isLoading && children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Helper function for server-side translations
export async function getServerTranslations(locale: LocaleType = defaultLocale) {
  try {
    const translations = await import(`./locales/${locale}.json`)
    return translations.default
  } catch (error) {
    console.error(`Failed to load server translations for ${locale}:`, error)
    const fallbackTranslations = await import(`./locales/${defaultLocale}.json`)
    return fallbackTranslations.default
  }
}

// Hook for SEO-specific translations
export function useSeoTranslations() {
  const { t } = useI18n()
  
  return {
    // Common
    loading: () => t('common.loading'),
    error: () => t('common.error'),
    save: () => t('common.save'),
    cancel: () => t('common.cancel'),
    edit: () => t('common.edit'),
    delete: () => t('common.delete'),
    publish: () => t('common.publish'),
    draft: () => t('common.draft'),
    published: () => t('common.published'),
    continue: () => t('common.continue'),
    back: () => t('common.back'),
    next: () => t('common.next'),
    previous: () => t('common.previous'),
    
    // Navigation
    dashboard: () => t('navigation.dashboard'),
    opportunities: () => t('navigation.opportunities'),
    content: () => t('navigation.content'),
    analytics: () => t('navigation.analytics'),
    competitors: () => t('navigation.competitors'),
    settings: () => t('navigation.settings'),
    
    // SEO Terms
    seoScore: () => t('seo.seo_score'),
    searchVolume: () => t('seo.search_volume'),
    keywordDifficulty: () => t('seo.keyword_difficulty'),
    domainAuthority: () => t('seo.domain_authority'),
    backlinks: () => t('seo.backlinks'),
    rankings: () => t('seo.rankings'),
    organicTraffic: () => t('seo.organic_traffic'),
    keywordResearch: () => t('seo.keyword_research'),
    competitorAnalysis: () => t('seo.competitor_analysis'),
    contentOptimization: () => t('seo.content_optimization'),
    linkBuilding: () => t('seo.link_building'),
    
    // Content
    blogPost: () => t('content.blog_post'),
    productPage: () => t('content.product_page'),
    landingPage: () => t('content.landing_page'),
    wordCount: () => t('content.word_count'),
    readingTime: () => t('content.reading_time'),
    metaTitle: () => t('content.meta_title'),
    metaDescription: () => t('content.meta_description'),
    internalLinks: () => t('content.internal_links'),
    
    // Actions
    createContent: () => t('actions.create_content'),
    analyzeKeyword: () => t('actions.analyze_keyword'),
    trackCompetitors: () => t('actions.track_competitors'),
    generateReport: () => t('actions.generate_report'),
    exportData: () => t('actions.export_data'),
  }
}
