'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Quote, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface InlineCitationProps {
  number: number
  title?: string
  url?: string
  description?: string
  className?: string
}

const getSafeUrl = (url?: string) => {
  if (!url) return null

  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' ? parsedUrl : null
  } catch {
    return null
  }
}

export function InlineCitation({ number, title, url, description, className }: InlineCitationProps) {
  const [imageError, setImageError] = useState(false)
  const safeUrl = getSafeUrl(url)

  const getFaviconUrl = (url?: string) => {
    const parsedUrl = getSafeUrl(url)
    return parsedUrl ? `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=16` : null
  }

  const faviconUrl = getFaviconUrl(url)

  const CitationButton = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 p-0 mx-0.5',
        'rounded-full bg-blue-500/10 hover:bg-blue-500/20',
        'text-blue-400 hover:text-blue-300 text-xs font-medium',
        'transition-colors duration-150',
        !safeUrl && 'cursor-default',
        className
      )}
    >
      <span className="sr-only">Citation {number}</span>
      {number}
    </Button>
  )

  if (!url && !title && !description) {
    return CitationButton
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {CitationButton}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center"
          className="w-64 p-3 bg-zinc-900 border-zinc-800 shadow-xl"
          sideOffset={6}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Quote className="w-3 h-3" />
              <span className="text-xs font-medium uppercase tracking-wide">Citation {number}</span>
            </div>
            
            {title && (
              <p className="text-sm font-medium text-zinc-200 line-clamp-2">
                {title}
              </p>
            )}
            
            {description && (
              <p className="text-xs text-zinc-500 line-clamp-3">
                {description}
              </p>
            )}
            
            {safeUrl && (
              <a
                href={safeUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2 group"
              >
                {faviconUrl && !imageError ? (
                  <img
                    src={faviconUrl}
                    alt=""
                    className="w-3 h-3 rounded-sm"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Link2 className="w-3 h-3" />
                )}
                <span className="line-clamp-1 group-hover:underline">
                  {safeUrl.hostname}
                </span>
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Component for rendering text with inline citations
export interface CitationTextProps {
  text: string
  citations: Array<{
    number: number
    title?: string
    url?: string
    description?: string
  }>
  className?: string
}

export function CitationText({ text, citations, className }: CitationTextProps) {
  // Parse text to find citation markers like [1], [2], etc.
  const parts = text.split(/(\[\d+\])/g)
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        const match = part.match(/\[(\d+)\]/)
        if (match) {
          const citationNumber = parseInt(match[1], 10)
          const citation = citations.find(c => c.number === citationNumber)
          
          if (citation) {
            return (
              <InlineCitation
                key={index}
                number={citation.number}
                title={citation.title}
                url={citation.url}
                description={citation.description}
              />
            )
          }
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
