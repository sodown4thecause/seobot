'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HelpTooltipProps {
  content: string
  title?: string
  className?: string
}

export function HelpTooltip({ content, title, className }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={className || 'inline-flex items-center justify-center'}
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-zinc-400" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

