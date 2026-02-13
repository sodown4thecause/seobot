'use client'

import React, { useState, useCallback } from 'react'
import { Trash2, Plus, RefreshCw, ExternalLink, Check, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface Competitor {
  id: string
  url: string
  title?: string
  wordCount?: number
  headings?: string[]
  isSelected: boolean
  isLoading?: boolean
}

interface CompetitorManagerProps {
  competitors: Competitor[]
  onCompetitorsChange: (competitors: Competitor[] | ((prev: Competitor[]) => Competitor[])) => void
  targetKeyword: string
}

export function CompetitorManager({ competitors, onCompetitorsChange, targetKeyword }: CompetitorManagerProps) {
  const [newUrl, setNewUrl] = useState('')
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const discoverCompetitors = useCallback(async () => {
    if (!targetKeyword.trim()) {
      setError('Please enter a primary keyword first')
      return
    }

    setIsDiscovering(true)
    setError(null)

    try {
      // First, try to get competitor URLs from Jina/Firecrawl
      const response = await fetch('/api/competitors/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: targetKeyword }),
      })

      if (!response.ok) {
        throw new Error('Failed to discover competitors')
      }

      const data = await response.json()
      
      if (data.competitors && Array.isArray(data.competitors)) {
        const newCompetitors: Competitor[] = data.competitors.map((comp: { url: string; title?: string }) => ({
          id: Math.random().toString(36).substring(7),
          url: comp.url,
          title: comp.title,
          isSelected: true,
          isLoading: true,
        }))

        onCompetitorsChange([...competitors, ...newCompetitors])

        // Fetch details for each competitor
        newCompetitors.forEach(async (comp) => {
          try {
            const scrapeResponse = await fetch('/api/analyze-website', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: comp.url }),
            })

            if (scrapeResponse.ok) {
              const scrapeData = await scrapeResponse.json()
              onCompetitorsChange((prev: Competitor[]) => 
                prev.map((c: Competitor) => 
                  c.id === comp.id 
                    ? { ...c, title: scrapeData.title || c.title, wordCount: scrapeData.wordCount, headings: scrapeData.headings, isLoading: false }
                    : c
                )
              )
            } else {
              onCompetitorsChange((prev: Competitor[]) => 
                prev.map((c: Competitor) => c.id === comp.id ? { ...c, isLoading: false } : c)
              )
            }
          } catch {
            onCompetitorsChange((prev: Competitor[]) => 
              prev.map((c: Competitor) => c.id === comp.id ? { ...c, isLoading: false } : c)
            )
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover competitors')
    } finally {
      setIsDiscovering(false)
    }
  }, [targetKeyword, competitors, onCompetitorsChange])

  const addCompetitor = () => {
    if (!newUrl.trim()) return
    
    // Basic URL validation
    let url = newUrl.trim()
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }

    const competitor: Competitor = {
      id: Math.random().toString(36).substring(7),
      url,
      isSelected: true,
      isLoading: true,
    }

    onCompetitorsChange([...competitors, competitor])
    setNewUrl('')

    // Fetch competitor details
    fetch('/api/analyze-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          onCompetitorsChange((prev: Competitor[]) => 
            prev.map((c: Competitor) => 
              c.id === competitor.id 
                ? { ...c, title: data.title, wordCount: data.wordCount, headings: data.headings, isLoading: false }
                : c
            )
          )
        } else {
          onCompetitorsChange((prev: Competitor[]) => 
            prev.map((c: Competitor) => c.id === competitor.id ? { ...c, isLoading: false } : c)
          )
        }
      })
      .catch(() => {
        onCompetitorsChange((prev: Competitor[]) => 
          prev.map((c: Competitor) => c.id === competitor.id ? { ...c, isLoading: false } : c)
        )
      })
  }

  const removeCompetitor = (id: string) => {
    onCompetitorsChange(competitors.filter(c => c.id !== id))
  }

  const toggleCompetitor = (id: string) => {
    onCompetitorsChange(competitors.map(c => 
      c.id === id ? { ...c, isSelected: !c.isSelected } : c
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Competitors</h3>
          <p className="text-sm text-zinc-400">
            Analyze top-ranking content to create better articles
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={discoverCompetitors}
          disabled={isDiscovering || !targetKeyword}
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', isDiscovering && 'animate-spin')} />
          {isDiscovering ? 'Discovering...' : 'Auto-Discover'}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Enter competitor URL..."
          className="bg-zinc-900/50 border-zinc-700"
          onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
        />
        <Button onClick={addCompetitor} disabled={!newUrl.trim()} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {competitors.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-zinc-700 rounded-xl">
          <Globe className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No competitors added yet</p>
          <p className="text-zinc-600 text-xs mt-1">
            Click "Auto-Discover" to find top-ranking pages for your keyword
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {competitors.map((competitor) => (
            <div
              key={competitor.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-all',
                competitor.isSelected
                  ? 'border-zinc-700 bg-zinc-900/50'
                  : 'border-zinc-800 bg-zinc-900/20 opacity-50'
              )}
            >
              <button
                onClick={() => toggleCompetitor(competitor.id)}
                className={cn(
                  'mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors',
                  competitor.isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-zinc-600 hover:border-zinc-500'
                )}
              >
                {competitor.isSelected && <Check className="w-3 h-3 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                {competitor.isLoading ? (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-white truncate">
                      {competitor.title || 'Untitled Page'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="truncate">{competitor.url}</span>
                      {competitor.wordCount && (
                        <span>{competitor.wordCount.toLocaleString()} words</span>
                      )}
                    </div>
                    {competitor.headings && competitor.headings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {competitor.headings.slice(0, 3).map((heading, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400"
                          >
                            {heading}
                          </span>
                        ))}
                        {competitor.headings.length > 3 && (
                          <span className="text-xs px-2 py-1 text-zinc-600">
                            +{competitor.headings.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                <a
                  href={competitor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </a>
                <button
                  onClick={() => removeCompetitor(competitor.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                >
                  <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
