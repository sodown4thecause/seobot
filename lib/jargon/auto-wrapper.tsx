import React from 'react'
import { JargonTooltip } from '@/components/jargon/jargon-tooltip'
import { JARGON_DICTIONARY } from './dictionary'

/**
 * Automatically wraps jargon terms in content with tooltips
 * 
 * This utility function scans text content and automatically wraps
 * recognized jargon terms with JargonTooltip components.
 */

interface AutoWrapOptions {
  variant?: 'inline' | 'underline' | 'badge'
  showIcon?: boolean
  caseSensitive?: boolean
  wholeWordsOnly?: boolean
  excludeTerms?: string[]
  maxReplacements?: number
}

// Create a map of terms for faster lookup
const termMap = new Map<string, string>()
JARGON_DICTIONARY.forEach(term => {
  termMap.set(term.term.toLowerCase(), term.term)
  // Also add common variations
  if (term.term.includes('-')) {
    termMap.set(term.term.replace(/-/g, ' ').toLowerCase(), term.term)
  }
  if (term.term.includes(' ')) {
    termMap.set(term.term.replace(/\s+/g, '-').toLowerCase(), term.term)
  }
})

/**
 * Automatically wrap jargon terms in text content
 */
export function autoWrapJargonTerms(
  content: string, 
  options: AutoWrapOptions = {}
): React.ReactNode[] {
  const {
    variant = 'underline',
    showIcon = false,
    caseSensitive = false,
    wholeWordsOnly = true,
    excludeTerms = [],
    maxReplacements = 10
  } = options

  if (!content || typeof content !== 'string') {
    return [content]
  }

  // Create exclude set for faster lookup
  const excludeSet = new Set(excludeTerms.map(term => 
    caseSensitive ? term : term.toLowerCase()
  ))

  // Sort terms by length (longest first) to avoid partial matches
  const sortedTerms = Array.from(termMap.keys())
    .filter(term => !excludeSet.has(term))
    .sort((a, b) => b.length - a.length)

  let result: React.ReactNode[] = [content]
  let replacementCount = 0

  for (const searchTerm of sortedTerms) {
    if (replacementCount >= maxReplacements) break

    const originalTerm = termMap.get(searchTerm)!
    
    // Create regex pattern
    const flags = caseSensitive ? 'g' : 'gi'
    const pattern = wholeWordsOnly 
      ? new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, flags)
      : new RegExp(escapeRegExp(searchTerm), flags)

    // Process each element in the result array
    result = result.flatMap((element, index) => {
      // Only process string elements
      if (typeof element !== 'string') {
        return [element]
      }

      const matches = Array.from(element.matchAll(pattern))
      if (matches.length === 0) {
        return [element]
      }

      const parts: React.ReactNode[] = []
      let lastIndex = 0

      for (const match of matches) {
        if (replacementCount >= maxReplacements) break

        const matchIndex = match.index!
        const matchedText = match[0]

        // Add text before match
        if (matchIndex > lastIndex) {
          parts.push(element.slice(lastIndex, matchIndex))
        }

        // Add wrapped jargon term
        parts.push(
          <JargonTooltip
            key={`${originalTerm}-${index}-${matchIndex}`}
            term={originalTerm}
            variant={variant}
            showIcon={showIcon}
          >
            {matchedText}
          </JargonTooltip>
        )

        lastIndex = matchIndex + matchedText.length
        replacementCount++
      }

      // Add remaining text
      if (lastIndex < element.length) {
        parts.push(element.slice(lastIndex))
      }

      return parts
    })
  }

  return result
}

/**
 * React component that automatically wraps jargon terms in children
 */
interface AutoJargonWrapperProps {
  children: string
  options?: AutoWrapOptions
  className?: string
}

export function AutoJargonWrapper({ 
  children, 
  options = {},
  className = ''
}: AutoJargonWrapperProps) {
  const wrappedContent = autoWrapJargonTerms(children, options)
  
  return (
    <span className={className}>
      {wrappedContent}
    </span>
  )
}

/**
 * Hook for auto-wrapping jargon terms
 */
export function useAutoJargonWrap(
  content: string, 
  options: AutoWrapOptions = {}
): React.ReactNode[] {
  return React.useMemo(() => {
    return autoWrapJargonTerms(content, options)
  }, [content, options])
}

// Utility function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Common jargon terms that appear frequently (for performance optimization)
export const COMMON_JARGON_TERMS = [
  'SEO',
  'SERP', 
  'keyword',
  'backlink',
  'organic traffic',
  'meta description',
  'title tag',
  'page speed',
  'domain authority',
  'click-through rate',
  'bounce rate',
  'featured snippet',
  'local SEO',
  'AEO',
  'E-E-A-T'
]

/**
 * Lightweight wrapper that only processes common terms
 */
export function autoWrapCommonJargon(
  content: string,
  options: AutoWrapOptions = {}
): React.ReactNode[] {
  return autoWrapJargonTerms(content, {
    ...options,
    maxReplacements: 5 // Limit for performance
  })
}