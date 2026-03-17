'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowRight, Lightbulb, Search, FileText, Sparkles, Target, TrendingUp, Zap } from 'lucide-react'
import { useState } from 'react'

export interface SuggestionItem {
  id?: string
  text: string
  icon?: 'lightbulb' | 'search' | 'file' | 'sparkles' | 'target' | 'trending' | 'zap' | string
  category?: string
  onClick?: () => void
}

interface SuggestionsProps {
  suggestions: SuggestionItem[]
  onSuggestionClick?: (text: string) => void
  className?: string
  variant?: 'horizontal' | 'vertical' | 'grid'
  title?: string
}

const iconMap: Record<string, React.ReactNode> = {
  lightbulb: <Lightbulb className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
  file: <FileText className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />,
  target: <Target className="w-4 h-4" />,
  trending: <TrendingUp className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
}

export function Suggestions({ 
  suggestions, 
  onSuggestionClick, 
  className, 
  variant = 'horizontal',
  title = 'Suggested questions'
}: SuggestionsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (!suggestions || suggestions.length === 0) return null

  const containerClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
  }

  return (
    <div className={cn('mt-6', className)}>
      {title && (
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
          {title}
        </p>
      )}
      
      <div className={containerClasses[variant]}>
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon ? (iconMap[suggestion.icon] || <Sparkles className="w-4 h-4" />) : null
          const id = suggestion.id || `suggestion-${index}`
          const isHovered = hoveredId === id
          
          return (
            <motion.button
              key={id}
              onClick={() => {
                if (suggestion.onClick) {
                  suggestion.onClick()
                } else if (onSuggestionClick) {
                  onSuggestionClick(suggestion.text)
                }
              }}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className={cn(
                'group flex items-center gap-2 px-4 py-2.5 rounded-full',
                'border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50',
                'text-sm text-zinc-300 hover:text-zinc-100',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500',
                variant === 'vertical' && 'justify-between'
              )}
            >
              <div className="flex items-center gap-2">
                {Icon && (
                  <span className={cn(
                    'text-zinc-500 group-hover:text-zinc-300 transition-colors',
                    isHovered && 'text-zinc-300'
                  )}>
                    {Icon}
                  </span>
                )}
                <span className="line-clamp-1">{suggestion.text}</span>
              </div>
              
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -4 }}
                transition={{ duration: 0.15 }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              </motion.div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// Alternative: Compact suggestion chips that appear inline with content
interface InlineSuggestionProps {
  text: string
  onClick?: () => void
  className?: string
}

export function InlineSuggestion({ text, onClick, className }: InlineSuggestionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
        'bg-zinc-800/50 hover:bg-zinc-700/50',
        'text-xs text-zinc-400 hover:text-zinc-200',
        'border border-zinc-700/50 hover:border-zinc-600/50',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500',
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      <span>{text}</span>
    </button>
  )
}
