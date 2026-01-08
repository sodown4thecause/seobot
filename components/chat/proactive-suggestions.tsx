'use client'

import { cn } from '@/lib/utils'
import type { ProactiveSuggestion } from '@/lib/proactive/types'

interface ProactiveSuggestionsProps {
    suggestions: ProactiveSuggestion[]
    onSuggestionClick: (prompt: string) => void
    className?: string
    isLoading?: boolean
}

const CATEGORY_STYLES = {
    deep_dive: {
        bg: 'bg-zinc-900/30 hover:bg-zinc-800/50',
        border: 'border-zinc-800 hover:border-zinc-700',
        text: 'text-zinc-400 group-hover:text-zinc-200',
        label: 'Deep Dive',
    },
    adjacent: {
        bg: 'bg-zinc-900/30 hover:bg-zinc-800/50',
        border: 'border-zinc-800 hover:border-zinc-700',
        text: 'text-zinc-400 group-hover:text-zinc-200',
        label: 'Adjacent Strategy',
    },
    execution: {
        bg: 'bg-zinc-900/30 hover:bg-zinc-800/50',
        border: 'border-zinc-800 hover:border-zinc-700',
        text: 'text-zinc-400 group-hover:text-zinc-200',
        label: 'Execution',
    },
}

export function ProactiveSuggestions({
    suggestions,
    onSuggestionClick,
    className,
    isLoading,
}: ProactiveSuggestionsProps) {
    if (!suggestions || suggestions.length === 0) {
        return null
    }

    return (
        <div className={cn('mt-4 space-y-2', className)}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Suggested Next Steps
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="grid gap-2">
                {suggestions.map((suggestion, index) => {
                    const style = CATEGORY_STYLES[suggestion.category]

                    return (
                        <button
                            key={`${suggestion.taskKey}-${index}`}
                            onClick={() => onSuggestionClick(suggestion.prompt)}
                            disabled={isLoading}
                            className={cn(
                                'group relative flex items-start gap-3 p-3 rounded-xl border transition-all text-left',
                                style.bg,
                                style.border,
                                isLoading && 'opacity-50 cursor-not-allowed',
                                !isLoading && 'cursor-pointer'
                            )}
                        >
                            {/* Icon */}
                            <span className="text-lg flex-shrink-0 mt-0.5">
                                {suggestion.icon}
                            </span>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn('text-[10px] font-semibold uppercase tracking-wider', style.text)}>
                                        {style.label}
                                    </span>
                                </div>

                                <p className="text-sm text-zinc-200 font-medium leading-snug">
                                    {suggestion.prompt}
                                </p>

                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                    {suggestion.reasoning}
                                </p>
                            </div>

                            {/* Arrow indicator */}
                            <div className={cn(
                                'flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                                style.text
                            )}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * Compact variant for inline display
 */
export function ProactiveSuggestionsCompact({
    suggestions,
    onSuggestionClick,
    className,
    isLoading,
}: ProactiveSuggestionsProps) {
    if (!suggestions || suggestions.length === 0) {
        return null
    }

    return (
        <div className={cn('flex flex-wrap gap-2 mt-3', className)}>
            {suggestions.map((suggestion, index) => {
                const style = CATEGORY_STYLES[suggestion.category]

                return (
                    <button
                        key={`${suggestion.taskKey}-${index}`}
                        onClick={() => onSuggestionClick(suggestion.prompt)}
                        disabled={isLoading}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                            style.bg,
                            style.border,
                            style.text,
                            isLoading && 'opacity-50 cursor-not-allowed',
                            !isLoading && 'cursor-pointer'
                        )}
                    >
                        <span>{suggestion.icon}</span>
                        <span className="max-w-[200px] truncate">{suggestion.prompt}</span>
                    </button>
                )
            })}
        </div>
    )
}
