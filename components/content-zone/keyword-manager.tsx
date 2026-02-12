'use client'

import React, { useState, useCallback } from 'react'
import { X, Plus, TrendingUp, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Keyword {
  id: string
  text: string
  searchVolume?: number
  difficulty?: number
  isPrimary?: boolean
}

interface KeywordManagerProps {
  keywords: Keyword[]
  onKeywordsChange: (keywords: Keyword[]) => void
  primaryKeyword: string
  onPrimaryKeywordChange: (keyword: string) => void
}

export function KeywordManager({ 
  keywords, 
  onKeywordsChange, 
  primaryKeyword, 
  onPrimaryKeywordChange 
}: KeywordManagerProps) {
  const [newKeyword, setNewKeyword] = useState('')
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Keyword[]>([])

  const addKeyword = () => {
    if (!newKeyword.trim()) return
    
    const keywordText = newKeyword.trim().toLowerCase()
    
    // Check for duplicates
    if (keywords.some(k => k.text === keywordText) || primaryKeyword === keywordText) {
      setNewKeyword('')
      return
    }

    const keyword: Keyword = {
      id: Math.random().toString(36).substring(7),
      text: keywordText,
    }

    onKeywordsChange([...keywords, keyword])
    setNewKeyword('')
  }

  const removeKeyword = (id: string) => {
    onKeywordsChange(keywords.filter(k => k.id !== id))
  }

  const loadSuggestions = useCallback(async () => {
    if (!primaryKeyword.trim()) return

    setIsLoadingSuggestions(true)
    
    try {
      const response = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: [primaryKeyword],
          includeMetrics: true 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.suggestions && Array.isArray(data.suggestions)) {
          const newSuggestions: Keyword[] = data.suggestions
            .filter((s: { keyword: string }) => 
              s.keyword !== primaryKeyword && 
              !keywords.some(k => k.text === s.keyword.toLowerCase())
            )
            .slice(0, 10)
            .map((s: { keyword: string; searchVolume?: number; difficulty?: number }) => ({
              id: Math.random().toString(36).substring(7),
              text: s.keyword.toLowerCase(),
              searchVolume: s.searchVolume,
              difficulty: s.difficulty,
            }))
          
          setSuggestions(newSuggestions)
        }
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [primaryKeyword, keywords])

  const addSuggestion = (suggestion: Keyword) => {
    onKeywordsChange([...keywords, { ...suggestion, id: Math.random().toString(36).substring(7) }])
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }

  return (
    <div className="space-y-6">
      {/* Primary Keyword */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-blue-400" />
          <label className="text-sm font-medium text-white">Primary Keyword</label>
          <span className="text-xs text-zinc-500">(Required)</span>
        </div>
        <Input
          value={primaryKeyword}
          onChange={(e) => onPrimaryKeywordChange(e.target.value)}
          placeholder="Enter your main target keyword..."
          className="bg-zinc-900/50 border-zinc-700"
        />
        <p className="text-xs text-zinc-500">
          This is the main keyword you want to rank for
        </p>
      </div>

      {/* Secondary Keywords */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-400" />
            <label className="text-sm font-medium text-white">Secondary Keywords</label>
            <span className="text-xs text-zinc-500">({keywords.length}/10)</span>
          </div>
          {primaryKeyword && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSuggestions}
              disabled={isLoadingSuggestions}
              className="text-xs h-7"
            >
              {isLoadingSuggestions ? 'Loading...' : 'Get Suggestions'}
            </Button>
          )}
        </div>

        {/* Keyword Input */}
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add secondary keyword..."
            className="bg-zinc-900/50 border-zinc-700"
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            disabled={keywords.length >= 10}
          />
          <Button 
            onClick={addKeyword} 
            disabled={!newKeyword.trim() || keywords.length >= 10}
            size="sm"
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Keywords List */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge
                key={keyword.id}
                variant="secondary"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 flex items-center gap-2 group"
              >
                <span>{keyword.text}</span>
                {(keyword.searchVolume || keyword.difficulty) && (
                  <span className="text-xs text-zinc-500">
                    {keyword.searchVolume && `${keyword.searchVolume.toLocaleString()} vol`}
                    {keyword.searchVolume && keyword.difficulty && ' · '}
                    {keyword.difficulty && `${keyword.difficulty} KD`}
                  </span>
                )}
                <button
                  onClick={() => removeKeyword(keyword.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-zinc-500 mb-2">Suggested keywords:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => addSuggestion(suggestion)}
                  disabled={keywords.length >= 10}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-all',
                    keywords.length >= 10
                      ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50'
                  )}
                >
                  + {suggestion.text}
                  {suggestion.searchVolume && (
                    <span className="ml-1 text-zinc-600">
                      ({suggestion.searchVolume.toLocaleString()})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
