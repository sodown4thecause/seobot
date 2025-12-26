'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'

export interface ContextualSuggestion {
  title: string
  prompt: string
}

interface ContextualSuggestionsProps {
  suggestions: ContextualSuggestion[]
  onSuggestionClick: (prompt: string) => void
  context?: string
}

const CONTEXTUAL_SUGGESTIONS: Record<string, ContextualSuggestion[]> = {
  onboarding: [
    {
      title: 'What keywords should I target for my business?',
      prompt: 'What keywords should I target for my business?'
    },
    {
      title: 'How do I get started with SEO?',
      prompt: 'How do I get started with SEO?'
    },
    {
      title: "What's the first thing I should do to improve my rankings?",
      prompt: "What's the first thing I should do to improve my rankings?"
    }
  ],
  afterKeywordResearch: [
    {
      title: 'Create content for the top keyword',
      prompt: 'Create content for the top keyword from my research'
    },
    {
      title: 'Show me the competition for these keywords',
      prompt: 'Show me the competition for these keywords'
    },
    {
      title: 'What content gaps exist in this niche?',
      prompt: 'What content gaps exist in this niche?'
    }
  ],
  afterContentCreation: [
    {
      title: 'Generate images for this article',
      prompt: 'Generate images for this article'
    },
    {
      title: 'Create the social media posts',
      prompt: 'Create social media posts for this content'
    },
    {
      title: 'What links should I build for this content?',
      prompt: 'What links should I build for this content?'
    }
  ],
  afterAudit: [
    {
      title: 'Fix the critical issues first',
      prompt: 'Help me fix the critical issues from the audit'
    },
    {
      title: 'Show me how to implement these changes',
      prompt: 'Show me step-by-step how to implement these changes'
    },
    {
      title: 'Schedule a follow-up audit',
      prompt: 'Schedule a follow-up audit in 30 days'
    }
  ]
}

export function ContextualSuggestions({
  suggestions,
  onSuggestionClick,
  context
}: ContextualSuggestionsProps) {
  const displaySuggestions = suggestions.length > 0 
    ? suggestions 
    : (context ? CONTEXTUAL_SUGGESTIONS[context] || [] : [])

  if (displaySuggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="w-4 h-4" />
        <span>Suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {displaySuggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="text-xs"
          >
            {suggestion.title}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function getSuggestionsForContext(context: string): ContextualSuggestion[] {
  return CONTEXTUAL_SUGGESTIONS[context] || []
}

