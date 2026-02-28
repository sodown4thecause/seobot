"use client"

import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useJobStatus } from '@/lib/hooks/use-job-status'

interface JobProgressProps {
  className?: string
}

const STATUS_TEXT: Record<string, string> = {
  queued: 'Queued...',
  processing: 'Processing SERP data...',
  complete: 'Complete',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export function JobProgress({ className }: JobProgressProps) {
  const { job, progress, status, error } = useJobStatus(true)
  const [hidden, setHidden] = React.useState(false)

  React.useEffect(() => {
    if (!status) {
      return
    }

    if (status === 'complete' || status === 'cancelled') {
      const timeoutId = window.setTimeout(() => setHidden(true), 5000)
      return () => window.clearTimeout(timeoutId)
    }

    setHidden(false)
  }, [status])

  const cancelJob = async () => {
    if (!job?.jobId) {
      return
    }

    await fetch('/api/jobs/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.jobId }),
    })
  }

  if (hidden || error) {
    return null
  }

  if (!job) {
    return (
      <div className={className}>
        <Skeleton className="h-4 w-52" />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-zinc-300">{STATUS_TEXT[status ?? 'queued']}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{progress}%</span>
            {status === 'queued' || status === 'processing' ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={cancelJob}
                className="h-5 w-5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Cancel refresh job"
              >
                <X className="h-3 w-3" />
              </Button>
            ) : null}
          </div>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  )
}
