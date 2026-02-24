"use client"

import { useEffect, useRef, useState } from 'react'

type JobStatus = 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled'

interface JobState {
  jobId: string
  progress: number
  status: JobStatus
  updatedAt?: string
}

interface UseJobStatusResult {
  job: JobState | null
  progress: number
  status: JobStatus | null
  error: string | null
  isConnected: boolean
}

export function useJobStatus(enabled = true): UseJobStatusResult {
  const [job, setJob] = useState<JobState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const retryRef = useRef(0)
  const reconnectTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let source: EventSource | null = null
    let cancelled = false

    const connect = () => {
      if (cancelled) {
        return
      }

      source = new EventSource('/api/jobs/sse')

      source.onopen = () => {
        setIsConnected(true)
        setError(null)
        retryRef.current = 0
      }

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as JobState
          setJob(payload)
        } catch {
          setError('Failed to parse job status stream')
        }
      }

      source.onerror = () => {
        setIsConnected(false)
        source?.close()

        if (retryRef.current >= 5) {
          setError('Unable to reconnect to job status stream')
          return
        }

        retryRef.current += 1
        reconnectTimeoutRef.current = window.setTimeout(connect, retryRef.current * 1000)
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }
      source?.close()
      setIsConnected(false)
    }
  }, [enabled])

  return {
    job,
    progress: job?.progress ?? 0,
    status: job?.status ?? null,
    error,
    isConnected,
  }
}
