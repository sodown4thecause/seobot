import { Locale, i18n } from 'next-international'

export const locales = ['en', 'es', 'fr', 'de'] as const
export type LocaleType = typeof locales[number]

export const defaultLocale: LocaleType = 'en'

export const localeNames: Record<LocaleType, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch'
}

export const localeFlags: Record<LocaleType, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪'
}

export function getLocaleFromPathname(pathname: string): LocaleType {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}`) || pathname === `/${locale}`) {
      return locale
    }
  }
  return defaultLocale
}

export function getPathnameWithoutLocale(pathname: string): string {
  const locale = getLocaleFromPathname(pathname)
  if (locale === defaultLocale && !pathname.startsWith(`/${defaultLocale}`)) {
    return pathname
  }
  return pathname.replace(`/${locale}`, '') || '/'
}

export function createLocalizedPath(pathname: string, locale: LocaleType): string {
  const pathWithoutLocale = getPathnameWithoutLocale(pathname)
  
  if (locale === defaultLocale) {
    return pathWithoutLocale === '/' ? '/' : pathWithoutLocale
  }
  
  return `/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
}

// SEO-specific translations keys that will be used throughout the app
export const seoTranslationKeys = {
  // Common
  'loading': 'Loading...',
  'error': 'Error',
  'save': 'Save',
  'cancel': 'Cancel',
  'edit': 'Edit',
  'delete': 'Delete',
  'publish': 'Publish',
  'draft': 'Draft',
  'published': 'Published',
  'continue': 'Continue',
  'back': 'Back',
  'next': 'Next',
  'previous': 'Previous',
  
  // Navigation
  'dashboard': 'Dashboard',
  'opportunities': 'Opportunities',
  'content': 'Content',
  'analytics': 'Analytics',
  'competitors': 'Competitors',
  'settings': 'Settings',
  
  // SEO Terms
  'seo_score': 'SEO Score',
  'search_volume': 'Search Volume',
  'keyword_difficulty': 'Keyword Difficulty',
  'domain_authority': 'Domain Authority',
  'backlinks': 'Backlinks',
  'rankings': 'Rankings',
  'organic_traffic': 'Organic Traffic',
  'keyword_research': 'Keyword Research',
  'competitor_analysis': 'Competitor Analysis',
  'content_optimization': 'Content Optimization',
  'link_building': 'Link Building',
  
  // Content
  'blog_post': 'Blog Post',
  'product_page': 'Product Page',
  'landing_page': 'Landing Page',
  'word_count': 'Word Count',
  'reading_time': 'Reading Time',
  'meta_title': 'Meta Title',
  'meta_description': 'Meta Description',
  'internal_links': 'Internal Links',
  
  // Actions
  'create_content': 'Create Content',
  'analyze_keyword': 'Analyze Keyword',
  'track_competitors': 'Track Competitors',
  'generate_report': 'Generate Report',
  'export_data': 'Export Data',
  
  // Time
  'today': 'Today',
  'yesterday': 'Yesterday',
  'this_week': 'This Week',
  'this_month': 'This Month',
  'last_7_days': 'Last 7 Days',
  'last_30_days': 'Last 30 Days',
  'last_90_days': 'Last 90 Days',
} as const

export type SeoTranslationKey = keyof typeof seoTranslationKeys
