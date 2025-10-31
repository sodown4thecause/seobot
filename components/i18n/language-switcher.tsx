'use client'

import React, { useState } from 'react'
import { useI18n, LocaleType, localeNames, localeFlags } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Globe } from 'lucide-react'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'compact'
  showFlag?: boolean
  showName?: boolean
  className?: string
}

export function LanguageSwitcher({ 
  variant = 'dropdown', 
  showFlag = true, 
  showName = true,
  className = ''
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (newLocale: LocaleType) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  if (variant === 'toggle') {
    return (
      <div className={`flex items-center space-x-1 bg-gray-100 rounded-lg p-1 ${className}`}>
        {Object.entries(localeNames).map(([code, name]) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code as LocaleType)}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${locale === code 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {showFlag && <span className="mr-2">{localeFlags[code as LocaleType]}</span>}
            {showName && name}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 text-sm font-medium
          text-gray-700 hover:text-gray-900 transition-colors
          ${className}
        `}
      >
        <Globe className="w-4 h-4" />
        <span>{localeFlags[locale]}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    )
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300
          rounded-lg shadow-sm hover:bg-gray-50 transition-colors
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
        "
      >
        <Globe className="w-4 h-4 text-gray-500" />
        {showFlag && <span>{localeFlags[locale]}</span>}
        {showName && <span className="font-medium text-gray-900">{localeNames[locale]}</span>}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200
                rounded-lg shadow-lg z-20 overflow-hidden
              "
            >
              <div className="py-1">
                {Object.entries(localeNames).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code as LocaleType)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 text-left
                      hover:bg-gray-50 transition-colors
                      ${locale === code ? 'bg-purple-50 text-purple-700' : 'text-gray-900'}
                    `}
                  >
                    <span className="text-lg">{localeFlags[code as LocaleType]}</span>
                    <div className="flex-1">
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-gray-500">
                        {code === 'en' && 'English'}
                        {code === 'es' && 'Español'}
                        {code === 'fr' && 'Français'}
                        {code === 'de' && 'Deutsch'}
                      </div>
                    </div>
                    {locale === code && (
                      <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  {t('settings.language', 'Language')}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Language selector for onboarding flow
export function OnboardingLanguageSelector() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex justify-center space-x-4 mb-8">
      {Object.entries(localeNames).map(([code, name]) => (
        <button
          key={code}
          onClick={() => handleLanguageChange(code as LocaleType)}
          className={`
            flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-all
            ${locale === code 
              ? 'border-purple-600 bg-purple-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <span className="text-2xl">{localeFlags[code as LocaleType]}</span>
          <span className="text-sm font-medium text-gray-900">{name}</span>
        </button>
      ))}
    </div>
  )
}

// Compact language badge for settings
export function LanguageBadge() {
  const { locale } = useI18n()

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full">
      <span>{localeFlags[locale]}</span>
      <span className="text-sm font-medium text-gray-900">{localeNames[locale]}</span>
    </div>
  )
}
