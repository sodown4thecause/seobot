"use client"

import * as React from 'react'
import { Loader2, RotateCw } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface RefreshButtonProps {
  websiteUrl?: string
  competitorUrls?: string[]
  jobType?: 'full-refresh' | 'ranks-only' | 'backlinks-only' | 'audit-only' | 'overview-only'
  estimatedCostUsd?: number
}

export function RefreshButton({
  websiteUrl,
  competitorUrls,
  jobType = 'full-refresh',
  estimatedCostUsd,
}: RefreshButtonProps) {
  const { isSignedIn } = useAuth()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [didComplete, setDidComplete] = React.useState(false)

  const triggerRefresh = React.useCallback(async () => {
    if (!isSignedIn || isRefreshing) {
      return
    }

    setIsRefreshing(true)
    setDidComplete(false)

    try {
      const response = await fetch('/api/jobs/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl, competitorUrls, jobType }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to queue refresh job')
      }

      setDidComplete(true)
      toast({
        title: 'Refresh queued',
        description: 'Background refresh has started. Live progress is now available.',
      })
      window.setTimeout(() => setDidComplete(false), 2000)
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: error instanceof Error ? error.message : 'Unable to start refresh',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [competitorUrls, isRefreshing, isSignedIn, jobType, toast, websiteUrl])

  return (
    <div className="flex items-center gap-2">
      {typeof estimatedCostUsd === 'number' && (
        <p className="text-xs text-zinc-400">Est. cost ${estimatedCostUsd.toFixed(3)}</p>
      )}
      <Button onClick={triggerRefresh} disabled={!isSignedIn || isRefreshing} size="sm" className="gap-2">
        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
        {isRefreshing ? 'Refreshing...' : didComplete ? 'Queued' : 'Refresh Now'}
      </Button>
    </div>
  )
}
