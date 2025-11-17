/**
 * Lightweight performance profiler for chat API
 * Measures time spent in different stages of request processing
 */

import { performance } from 'perf_hooks'

interface ProfilerEntry {
  stage: string
  startTime: number
  endTime?: number
  duration?: number
}

class Profiler {
  public entries: Map<string, ProfilerEntry> = new Map()
  private startTime: number

  constructor() {
    this.startTime = performance.now()
  }

  /**
   * Start timing a stage
   */
  start(stage: string): void {
    this.entries.set(stage, {
      stage,
      startTime: performance.now(),
    })
  }

  /**
   * End timing a stage
   */
  end(stage: string): void {
    const entry = this.entries.get(stage)
    if (entry) {
      entry.endTime = performance.now()
      entry.duration = entry.endTime - entry.startTime
    }
  }

  /**
   * Get duration for a specific stage
   */
  getDuration(stage: string): number | undefined {
    return this.entries.get(stage)?.duration
  }

  /**
   * Get all timings as a structured object
   */
  getTimings(): Record<string, number> {
    const timings: Record<string, number> = {}
    for (const [stage, entry] of this.entries.entries()) {
      if (entry.duration !== undefined) {
        timings[stage] = Math.round(entry.duration * 100) / 100 // Round to 2 decimals
      }
    }
    return timings
  }

  /**
   * Get total elapsed time
   */
  getTotalTime(): number {
    return Math.round((performance.now() - this.startTime) * 100) / 100
  }

  /**
   * Log all timings in a structured format
   */
  logTimings(context: string = 'Profiler'): void {
    const timings = this.getTimings()
    const total = this.getTotalTime()
    
    console.log(`[${context}] Performance timings:`)
    console.log(`[${context}] Total time: ${total}ms`)
    
    // Sort by duration (descending)
    const sortedEntries = Object.entries(timings).sort((a, b) => b[1] - a[1])
    
    for (const [stage, duration] of sortedEntries) {
      const percentage = ((duration / total) * 100).toFixed(1)
      console.log(`[${context}]   ${stage}: ${duration}ms (${percentage}%)`)
    }
  }
}

/**
 * Create a new profiler instance
 */
export function createProfiler(): Profiler {
  return new Profiler()
}

/**
 * Helper to time an async operation
 */
export async function timeAsync<T>(
  stage: string,
  operation: () => Promise<T>,
  profiler?: Profiler
): Promise<T> {
  const startTime = performance.now()
  try {
    const result = await operation()
    const duration = performance.now() - startTime
    if (profiler) {
      profiler.entries.set(stage, {
        stage,
        startTime,
        endTime: performance.now(),
        duration,
      })
    }
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    if (profiler) {
      profiler.entries.set(stage, {
        stage,
        startTime,
        endTime: performance.now(),
        duration,
      })
    }
    throw error
  }
}

