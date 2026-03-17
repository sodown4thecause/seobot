'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ExternalLink, BookOpen, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export interface SourceItem {
  id?: string
  title?: string
  url?: string
  description?: string
  favicon?: string
  type?: 'article' | 'document' | 'website' | 'internal'
}

interface SourcesProps {
  sources: SourceItem[]
  className?: string
  variant?: 'compact' | 'expanded'
}

export function Sources({ sources, className, variant = 'compact' }: SourcesProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!sources || sources.length === 0) return null

  const uniqueSources = sources.filter((source, index, self) => 
    index === self.findIndex((s) => s.url === source.url || s.title === source.title)
  )

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('mt-4', className)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-blue-400 hover:text-blue-300 hover:bg-transparent font-medium text-sm flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Used {uniqueSources.length} {uniqueSources.length === 1 ? 'source' : 'sources'}</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-3 space-y-3">
            {uniqueSources.map((source, index) => (
              <SourceItemComponent key={source.id || index} source={source} index={index} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function SourceItemComponent({ source, index }: { source: SourceItem; index: number }) {
  const [imageError, setImageError] = useState(false)
  
  const getFaviconUrl = (url?: string) => {
    if (!url) return null
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  const faviconUrl = source.favicon || getFaviconUrl(source.url)
  const Icon = source.type === 'document' ? FileText : ExternalLink

  return (
    <div className="flex items-start gap-3 group">
      <div className="flex-shrink-0 w-6 h-6 rounded bg-zinc-800/80 flex items-center justify-center text-xs font-medium text-zinc-500">
        {index + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 group/link"
          >
            {faviconUrl && !imageError ? (
              <img
                src={faviconUrl}
                alt=""
                className="w-4 h-4 flex-shrink-0 mt-0.5 rounded-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-zinc-500" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 group-hover/link:text-blue-400 transition-colors line-clamp-1">
                {source.title || source.url}
              </p>
              {source.description && (
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                  {source.description}
                </p>
              )}
            </div>
            
            <ExternalLink className="w-3 h-3 text-zinc-600 group-hover/link:text-zinc-400 flex-shrink-0 mt-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
        ) : (
          <div className="flex items-start gap-2">
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-zinc-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">
                {source.title || `Source ${index + 1}`}
              </p>
              {source.description && (
                <p className="text-xs text-zinc-500 mt-0.5">{source.description}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
