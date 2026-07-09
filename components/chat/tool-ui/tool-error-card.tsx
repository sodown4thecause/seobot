'use client'

import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolErrorCardProps {
  title: string
  message?: string
  /** Number of identical failures grouped into this card. */
  count?: number
  className?: string
}

/**
 * Shared, dismissible error card for failed tool calls. Identical failures
 * are grouped into a single card (with a count) instead of stacking.
 */
export function ToolErrorCard({ title, message, count = 1, className }: ToolErrorCardProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      role="alert"
      className={cn(
        'my-3 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200',
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {title}
          {count > 1 && <span className="ml-2 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs">×{count}</span>}
        </p>
        {message && <p className="mt-1 text-xs text-rose-200/80">{message}</p>}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss error"
        className="rounded-md p-1 text-rose-300/70 transition-colors hover:bg-rose-500/20 hover:text-rose-100"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
